import { getCloudflareContext } from "@opennextjs/cloudflare";
import { services } from "@/data/site";

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
};

export type BlockedSlot = {
  id: number;
  blockedDate: string;
  blockedTime: string | null;
  reason: string;
  createdAt: string;
};

export type BlockedSlotPayload = {
  blockedDate?: string;
  blockedTime?: string | null;
  reason?: string;
};

export type AppointmentPayload = {
  serviceId?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
};

type AppointmentRow = {
  id: string;
  service_id: string;
  service_name: string;
  service_duration_minutes?: number;
  service_price?: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status?: "confirmed" | "cancelled";
  created_at: string;
};

type BlockedSlotRow = {
  id: number;
  blocked_date: string;
  blocked_time: string | null;
  reason: string | null;
  created_at: string;
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

export type D1DatabaseLike = {
  prepare(query: string): D1Statement;
};

export const slotPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const businessHours: Record<number, { start: number; end: number } | null> = {
  0: null,
  1: null,
  2: { start: 10, end: 18.5 },
  3: { start: 10, end: 18.5 },
  4: { start: 10, end: 19 },
  5: { start: 9.5, end: 18 },
  6: { start: 9.5, end: 16 },
};

export async function getDatabase() {
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

export function isPastDate(date: string) {
  const today = new Date().toISOString().slice(0, 10);
  return date < today;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    serviceDurationMinutes: row.service_duration_minutes ?? 60,
    servicePrice: row.service_price ?? "",
    date: row.date,
    time: row.time,
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    status: row.status ?? "confirmed",
    createdAt: row.created_at,
  };
}

function toBlockedSlot(row: BlockedSlotRow): BlockedSlot {
  return {
    id: row.id,
    blockedDate: row.blocked_date,
    blockedTime: row.blocked_time,
    reason: row.reason ?? "",
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
    const rows = JSON.parse(file) as Partial<Appointment>[];

    return rows.map((row) => ({
      id: row.id ?? crypto.randomUUID(),
      serviceId: row.serviceId ?? "",
      serviceName: row.serviceName ?? "",
      serviceDurationMinutes: row.serviceDurationMinutes ?? 60,
      servicePrice: row.servicePrice ?? "",
      date: row.date ?? "",
      time: row.time ?? "",
      name: row.name ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      message: row.message ?? "",
      status: row.status ?? "confirmed",
      createdAt: row.createdAt ?? new Date().toISOString(),
    }));
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

export async function listAppointments(options: {
  date?: string;
  includeAll?: boolean;
}) {
  const db = await getDatabase();
  const includeAll = options.includeAll ?? false;

  if (db) {
    const clauses: string[] = [];
    const bindings: unknown[] = [];

    if (options.date) {
      clauses.push("date = ?");
      bindings.push(options.date);
    }

    if (!includeAll) {
      clauses.push("status = 'confirmed'");
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db
      .prepare(
        `SELECT id, service_id, service_name, service_duration_minutes, service_price,
          date, time, name, phone, email, message, status, created_at
         FROM appointments
         ${where}
         ORDER BY date ASC, time ASC`,
      )
      .bind(...bindings)
      .all<AppointmentRow>();

    return {
      mode: "cloudflare-d1" as const,
      appointments: (rows.results ?? []).map(toAppointment),
    };
  }

  const appointments = await readLocalAppointments();

  return {
    mode: "local-json" as const,
    appointments: appointments
      .filter((appointment) => (options.date ? appointment.date === options.date : true))
      .filter((appointment) => (includeAll ? true : appointment.status === "confirmed"))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
  };
}

export async function listBlockedSlots(date?: string) {
  const db = await getDatabase();

  if (!db) {
    return [] as BlockedSlot[];
  }

  const rows = await db
    .prepare(
      `SELECT id, blocked_date, blocked_time, reason, created_at
       FROM blocked_slots
       ${date ? "WHERE blocked_date = ?" : ""}
       ORDER BY blocked_date ASC, blocked_time ASC`,
    )
    .bind(...(date ? [date] : []))
    .all<BlockedSlotRow>();

  return (rows.results ?? []).map(toBlockedSlot);
}

export async function createBlockedSlot(payload: BlockedSlotPayload) {
  if (!payload.blockedDate || !datePattern.test(payload.blockedDate)) {
    return { error: "Date invalide." };
  }

  if (payload.blockedTime && !slotPattern.test(payload.blockedTime)) {
    return { error: "Heure invalide." };
  }

  const db = await getDatabase();

  if (!db) {
    return { error: "La gestion des indisponibilités nécessite Cloudflare D1." };
  }

  await db
    .prepare(
      `INSERT INTO blocked_slots (blocked_date, blocked_time, reason)
       VALUES (?, ?, ?)`,
    )
    .bind(payload.blockedDate, payload.blockedTime || null, payload.reason?.trim() ?? "")
    .run();

  return { success: true };
}

export async function deleteBlockedSlot(id: number) {
  const db = await getDatabase();

  if (!db) {
    return { error: "La gestion des indisponibilités nécessite Cloudflare D1." };
  }

  await db.prepare("DELETE FROM blocked_slots WHERE id = ?").bind(id).run();
  return { success: true };
}

export async function updateAppointmentStatus(
  id: string,
  status: "confirmed" | "cancelled",
) {
  const db = await getDatabase();

  if (!db) {
    const appointments = await readLocalAppointments();
    const updated = appointments.map((appointment) =>
      appointment.id === id ? { ...appointment, status } : appointment,
    );

    await writeLocalAppointments(updated);
    return { success: true };
  }

  await db.prepare("UPDATE appointments SET status = ? WHERE id = ?").bind(status, id).run();
  return { success: true };
}

export async function deleteAppointment(id: string) {
  const db = await getDatabase();

  if (!db) {
    const appointments = await readLocalAppointments();
    await writeLocalAppointments(appointments.filter((appointment) => appointment.id !== id));
    return { success: true };
  }

  await db.prepare("DELETE FROM appointments WHERE id = ?").bind(id).run();
  return { success: true };
}

export function getDaySlots(date: string) {
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
    slots.push(minutesToTime(Math.round(current * 60)));
  }

  return slots;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number) {
  const hours = Math.floor(total / 60).toString().padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getClosingMinutes(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  const hours = businessHours[day];
  return hours ? Math.round(hours.end * 60) : null;
}

export function appointmentsOverlap(
  firstStart: string,
  firstDuration: number,
  secondStart: string,
  secondDuration: number,
) {
  const firstStartMinutes = timeToMinutes(firstStart);
  const firstEndMinutes = firstStartMinutes + firstDuration;
  const secondStartMinutes = timeToMinutes(secondStart);
  const secondEndMinutes = secondStartMinutes + secondDuration;

  return firstStartMinutes < secondEndMinutes && secondStartMinutes < firstEndMinutes;
}

export async function getAvailableSlots(date: string, serviceDuration: number) {
  if (!datePattern.test(date) || serviceDuration <= 0 || isPastDate(date)) {
    return [];
  }

  const closingMinutes = getClosingMinutes(date);
  if (!closingMinutes) {
    return [];
  }

  const [{ appointments }, blockedSlots] = await Promise.all([
    listAppointments({ date }),
    listBlockedSlots(date),
  ]);

  return getDaySlots(date).filter((slot) => {
    const requestedEnd = timeToMinutes(slot) + serviceDuration;

    if (requestedEnd > closingMinutes) {
      return false;
    }

    const isBlocked = blockedSlots.some(
      (blockedSlot) =>
        blockedSlot.blockedTime === null || blockedSlot.blockedTime === slot,
    );

    if (isBlocked) {
      return false;
    }

    return !appointments.some((appointment) =>
      appointmentsOverlap(
        slot,
        serviceDuration,
        appointment.time,
        appointment.serviceDurationMinutes,
      ),
    );
  });
}

export async function createAppointment(payload: AppointmentPayload) {
  const validation = validateAppointmentPayload(payload);

  if ("error" in validation) {
    return validation;
  }

  const availableSlots = await getAvailableSlots(
    validation.appointment.date,
    validation.appointment.serviceDurationMinutes,
  );

  if (!availableSlots.includes(validation.appointment.time)) {
    return { error: "CONFLICT" as const };
  }

  const db = await getDatabase();

  if (db) {
    await db
      .prepare(
        `INSERT INTO appointments (
          id, service_id, service_name, service_duration_minutes, service_price,
          date, time, name, phone, email, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        validation.appointment.id,
        validation.appointment.serviceId,
        validation.appointment.serviceName,
        validation.appointment.serviceDurationMinutes,
        validation.appointment.servicePrice,
        validation.appointment.date,
        validation.appointment.time,
        validation.appointment.name,
        validation.appointment.phone,
        validation.appointment.email,
        validation.appointment.message,
        validation.appointment.status,
        validation.appointment.createdAt,
      )
      .run();

    return { appointment: validation.appointment, mode: "cloudflare-d1" as const };
  }

  const appointments = await readLocalAppointments();
  await writeLocalAppointments([...appointments, validation.appointment]);

  return { appointment: validation.appointment, mode: "local-json" as const };
}

function validateAppointmentPayload(payload: AppointmentPayload) {
  const service = services.find((item) => item.id === payload.serviceId);

  if (!service) {
    return { error: "Prestation invalide." };
  }

  if (!payload.date || !datePattern.test(payload.date)) {
    return { error: "Date invalide." };
  }

  if (isPastDate(payload.date)) {
    return { error: "La date choisie est déjà passée." };
  }

  if (!payload.time || !slotPattern.test(payload.time)) {
    return { error: "Créneau invalide." };
  }

  if (!getDaySlots(payload.date).includes(payload.time)) {
    return { error: "Ce créneau n'est pas disponible." };
  }

  const closingMinutes = getClosingMinutes(payload.date);
  if (!closingMinutes || timeToMinutes(payload.time) + service.duration > closingMinutes) {
    return { error: "Ce rendez-vous dépasse les horaires d'ouverture." };
  }

  if (!payload.name || payload.name.trim().length < 2) {
    return { error: "Le nom est obligatoire." };
  }

  if (!payload.phone || !/^[+\d\s().-]{8,}$/.test(payload.phone.trim())) {
    return { error: "Téléphone invalide." };
  }

  if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    return { error: "Email invalide." };
  }

  return {
    appointment: {
      id: crypto.randomUUID(),
      serviceId: service.id,
      serviceName: service.name,
      serviceDurationMinutes: service.duration,
      servicePrice: service.price,
      date: payload.date,
      time: payload.time,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      message: payload.message?.trim() ?? "",
      status: "confirmed" as const,
      createdAt: new Date().toISOString(),
    },
  };
}

export function isDuplicateSlotError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "CONFLICT" ||
      error.message.includes("UNIQUE constraint failed"))
  );
}
