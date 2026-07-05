import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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

type AppointmentPayload = {
  serviceId?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
};

const dataDir = path.join(process.cwd(), "data");
const appointmentsFile = path.join(dataDir, "appointments.json");
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

async function readAppointments(): Promise<Appointment[]> {
  try {
    const file = await readFile(appointmentsFile, "utf8");
    return JSON.parse(file) as Appointment[];
  } catch {
    return [];
  }
}

async function writeAppointments(appointments: Appointment[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(appointmentsFile, JSON.stringify(appointments, null, 2));
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? "";
  const appointments = await readAppointments();
  const booked = appointments
    .filter((appointment) => appointment.date === date)
    .map((appointment) => appointment.time);
  const slots = getSlots(date).filter((slot) => !booked.includes(slot));

  return NextResponse.json({
    mode: "local-json",
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

    const appointments = await readAppointments();
    const alreadyBooked = appointments.some(
      (appointment) =>
        appointment.date === payload.date && appointment.time === payload.time,
    );

    if (alreadyBooked) {
      return NextResponse.json(
        {
          message:
            "Ce créneau vient d'être pris. Choisissez une autre heure, aucun rendez-vous n'a été enregistré.",
        },
        { status: 409 },
      );
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

    await writeAppointments([...appointments, appointment]);

    return NextResponse.json(
      {
        appointment,
        message:
          "Rendez-vous enregistré localement. Le créneau est maintenant bloqué.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Erreur serveur. Aucun rendez-vous n'a été enregistré, veuillez réessayer.",
      },
      { status: 500 },
    );
  }
}
