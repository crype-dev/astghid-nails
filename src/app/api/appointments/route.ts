import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { services } from "@/data/site";

export const runtime = "nodejs";

type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
};

type AppointmentRow = {
  id: string;
  service_id: string;
  service_name: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  created_at: string;
};

type AppointmentPayload = {
  serviceId?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
};

type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
};

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};

type D1DatabaseLike = {
  prepare(query: string): D1Statement;
};

const slotPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const businessHours: Record<number, { start: number; end: number } | null> = {
  0: null,
  1: null,
  2: { start: 10, end: 18.5 },
  3: { start: 10, end: 18.5 },
  4: { start: 10, end: 19 },
  5: { start: 9.5, end: 18 },
  6: { start: 9.5, end: 16 },
};

async function getDatabase() {
  if (process.env.NODE_ENV === "development") {
    return undefined;
  }

  try {
    const context = await getCloudflareContext({ async: true });
    return (context.env as { DB?: D1DatabaseLike }).DB;
  } catch {
    return undefined;
  }
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    date: row.date,
    time: row.time,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
  };
}

async function readLocalAppointments(): Promise<Appointment[]> {
  try {
    const [{ readFile }, path] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const appointmentsFile = path.join(process.cwd(), "data", "appointments.json");
    const file = await readFile(appointmentsFile, "utf8");
    return JSON.parse(file) as Appointment[];
  } catch {
    return [];
  }
}

async function writeLocalAppointments(appointments: Appointment[]) {
  const [{ mkdir, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const dataDir = path.join(process.cwd(), "data");
  const appointmentsFile = path.join(dataDir, "appointments.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(appointmentsFile, JSON.stringify(appointments, null, 2));
}

async function readAppointments(date: string) {
  const db = await getDatabase();

  if (db) {
    const rows = await db
      .prepare(
        `SELECT id, service_id, service_name, date, time, name, phone, email, message, created_at
         FROM appointments
         WHERE date = ?
         ORDER BY time ASC`,
      )
      .bind(date)
      .all<AppointmentRow>();

    return {
      mode: "cloudflare-d1" as const,
      appointments: (rows.results ?? []).map(toAppointment),
    };
  }

  const appointments = await readLocalAppointments();

  return {
    mode: "local-json" as const,
    appointments: appointments.filter((appointment) => appointment.date === date),
  };
}

async function createAppointment(appointment: Appointment) {
  const db = await getDatabase();

  if (db) {
    await db
      .prepare(
        `INSERT INTO appointments (
          id, service_id, service_name, date, time, name, phone, email, message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        appointment.id,
        appointment.serviceId,
        appointment.serviceName,
        appointment.date,
        appointment.time,
        appointment.name,
        appointment.phone,
        appointment.email,
        appointment.message,
        appointment.createdAt,
      )
      .run();

    return "cloudflare-d1" as const;
  }

  const appointments = await readLocalAppointments();
  const alreadyBooked = appointments.some(
    (item) => item.date === appointment.date && item.time === appointment.time,
  );

  if (alreadyBooked) {
    throw new Error("DUPLICATE_SLOT");
  }

  await writeLocalAppointments([...appointments, appointment]);

  return "local-json" as const;
}

function getSlots(date: string) {
  if (!datePattern.test(date)) {
    return [];
  }

  const day = new Date(`${date}T12:00:00`).getDay();
  const hours = businessHours[day];

  if (!hours) {
    return [];
  }

  const slots: string[] = [];

  for (let current = hours.start; current < hours.end; current += 0.5) {
    const hour = Math.floor(current).toString().padStart(2, "0");
    const minutes = current % 1 === 0 ? "00" : "30";
    slots.push(`${hour}:${minutes}`);
  }

  return slots;
}

function hasCalendarConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

function validatePayload(payload: AppointmentPayload) {
  const service = services.find((item) => item.id === payload.serviceId);

  if (!service) {
    return { error: "Prestation invalide." };
  }

  if (!payload.date || !datePattern.test(payload.date)) {
    return { error: "Date invalide." };
  }

  if (!payload.time || !slotPattern.test(payload.time)) {
    return { error: "Créneau invalide." };
  }

  if (!getSlots(payload.date).includes(payload.time)) {
    return { error: "Ce créneau n'est pas disponible." };
  }

  if (!payload.name || payload.name.trim().length < 2) {
    return { error: "Le nom est obligatoire." };
  }

  if (!payload.phone || payload.phone.trim().length < 8) {
    return { error: "Le téléphone est obligatoire." };
  }

  if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    return { error: "Email invalide." };
  }

  return { service };
}

function isDuplicateSlotError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "DUPLICATE_SLOT" ||
      error.message.includes("UNIQUE constraint failed"))
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const { mode, appointments } = await readAppointments(date);
  const booked = appointments.map((appointment) => appointment.time);
  const slots = getSlots(date).filter((slot) => !booked.includes(slot));

  return NextResponse.json({
    mode,
    configuredCalendar: hasCalendarConfig(),
    slots,
    booked,
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AppointmentPayload;
    const validation = validatePayload(payload);

    if ("error" in validation) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      serviceId: validation.service.id,
      serviceName: validation.service.name,
      date: payload.date!,
      time: payload.time!,
      name: payload.name!.trim(),
      phone: payload.phone!.trim(),
      email: payload.email!.trim(),
      message: payload.message?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };

    const mode = await createAppointment(appointment);

    return NextResponse.json(
      {
        appointment,
        mode,
        message: "Rendez-vous enregistré. Le créneau est maintenant bloqué.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateSlotError(error)) {
      return NextResponse.json(
        {
          message:
            "Ce créneau vient d'être pris. Choisissez une autre heure, aucun rendez-vous n'a été enregistré.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Erreur serveur. Aucun rendez-vous n'a été enregistré, veuillez réessayer.",
      },
      { status: 500 },
    );
  }
}
