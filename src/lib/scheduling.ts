import { getCloudflareContext } from "@opennextjs/cloudflare";
import { services } from "@/data/site";
import { isWithinAppointmentWindow } from "@/lib/appointment-dates";

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
  cancelledAt: string | null;
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
  cancelled_at?: string | null;
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

type LocalAppointment = Appointment & {
  cancelTokenHash?: string | null;
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
    cancelledAt: row.cancelled_at ?? null,
    createdAt: row.created_at,
  };
}

function toPublicAppointment(appointment: LocalAppointment): Appointment {
  return {
    id: appointment.id,
    serviceId: appointment.serviceId,
    serviceName: appointment.serviceName,
    serviceDurationMinutes: appointment.serviceDurationMinutes,
    servicePrice: appointment.servicePrice,
    date: appointment.date,
    time: appointment.time,
    name: appointment.name,
    phone: appointment.phone,
    email: appointment.email,
    message: appointment.message,
    status: appointment.status,
    cancelledAt: appointment.cancelledAt,
    createdAt: appointment.createdAt,
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

async function readLocalAppointments(): Promise<LocalAppointment[]> {
  try {
    const [{ readFile }, path] = await Promise.all([
      import("node:fs/promises"),
      import("node:path"),
    ]);
    const appointmentsFile = path.join(process.cwd(), "data", "appointments.json");
    const file = await readFile(appointmentsFile, "utf8");
    const rows = JSON.parse(file) as Partial<LocalAppointment>[];

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
      cancelledAt: row.cancelledAt ?? null,
      cancelTokenHash: row.cancelTokenHash ?? null,
      createdAt: row.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function writeLocalAppointments(appointments: LocalAppointment[]) {
  const [{ mkdir, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const dataDir = path.join(process.cwd(), "data");
  const appointmentsFile = path.join(dataDir, "appointments.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(appointmentsFile, JSON.stringify(appointments, null, 2));
}

function generateCancelToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function hashCancelToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );

  return Buffer.from(digest).toString("hex");
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
          date, time, name, phone, email, message, status, cancelled_at, created_at
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
      .map(toPublicAppointment)
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
    const cancelledAt = status === "cancelled" ? new Date().toISOString() : null;
    const updated = appointments.map((appointment) =>
      appointment.id === id ? { ...appointment, status, cancelledAt } : appointment,
    );

    await writeLocalAppointments(updated);
    return { success: true };
  }

  await db
    .prepare("UPDATE appointments SET status = ?, cancelled_at = ? WHERE id = ?")
    .bind(status, status === "cancelled" ? new Date().toISOString() : null, id)
    .run();
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
  if (
    !datePattern.test(date) ||
    serviceDuration <= 0 ||
    isPastDate(date) ||
    !isWithinAppointmentWindow(date)
  ) {
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
  const cancelToken = generateCancelToken();
  const cancelTokenHash = await hashCancelToken(cancelToken);

  if (db) {
    await db
      .prepare(
        `INSERT INTO appointments (
          id, service_id, service_name, service_duration_minutes, service_price,
          date, time, name, phone, email, message, status, cancel_token_hash,
          cancelled_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        cancelTokenHash,
        validation.appointment.cancelledAt,
        validation.appointment.createdAt,
      )
      .run();

    return {
      appointment: validation.appointment,
      cancelToken,
      mode: "cloudflare-d1" as const,
    };
  }

  const appointments = await readLocalAppointments();
  await writeLocalAppointments([
    ...appointments,
    { ...validation.appointment, cancelTokenHash },
  ]);

  return { appointment: validation.appointment, cancelToken, mode: "local-json" as const };
}

export async function getAppointmentByCancelToken(token?: string) {
  if (!token || token.length < 20) {
    return { error: "Lien d'annulation invalide." };
  }

  const cancelTokenHash = await hashCancelToken(token);
  const db = await getDatabase();

  if (db) {
    const rows = await db
      .prepare(
        `SELECT id, service_id, service_name, service_duration_minutes, service_price,
          date, time, name, phone, email, message, status, cancelled_at, created_at
         FROM appointments
         WHERE cancel_token_hash = ?
         LIMIT 1`,
      )
      .bind(cancelTokenHash)
      .all<AppointmentRow>();
    const appointment = rows.results?.[0];

    return appointment
      ? { appointment: toAppointment(appointment) }
      : { error: "Lien d'annulation invalide." };
  }

  const appointment = (await readLocalAppointments()).find(
    (item) => item.cancelTokenHash === cancelTokenHash,
  );

  if (!appointment) {
    return { error: "Lien d'annulation invalide." };
  }

  return { appointment: toPublicAppointment(appointment) };
}

export async function cancelAppointmentByToken(token?: string) {
  const result = await getAppointmentByCancelToken(token);

  if ("error" in result) {
    return result;
  }

  if (result.appointment.status === "cancelled") {
    return { error: "Ce rendez-vous est déjà annulé.", appointment: result.appointment };
  }

  const cancelledAt = new Date().toISOString();
  const cancelTokenHash = await hashCancelToken(token ?? "");
  const db = await getDatabase();

  if (db) {
    await db
      .prepare(
        `UPDATE appointments
         SET status = 'cancelled', cancelled_at = ?
         WHERE cancel_token_hash = ? AND status != 'cancelled'`,
      )
      .bind(cancelledAt, cancelTokenHash)
      .run();
  } else {
    const appointments = await readLocalAppointments();
    await writeLocalAppointments(
      appointments.map((appointment) =>
        appointment.cancelTokenHash === cancelTokenHash
          ? { ...appointment, status: "cancelled", cancelledAt }
          : appointment,
      ),
    );
  }

  return {
    appointment: {
      ...result.appointment,
      status: "cancelled" as const,
      cancelledAt,
    },
  };
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

  if (!isWithinAppointmentWindow(payload.date)) {
    return {
      error: "Les rendez-vous sont ouverts jusqu'à deux mois à l'avance.",
    };
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
      cancelledAt: null,
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
