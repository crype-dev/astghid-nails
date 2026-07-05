import { NextResponse } from "next/server";
import {
  createAppointment,
  getAvailableSlots,
  isDuplicateSlotError,
  listAppointments,
} from "@/lib/scheduling";
import { services } from "@/data/site";

export const runtime = "nodejs";

function hasCalendarConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    const includeAll = searchParams.get("includeAll") === "true";
    const serviceId = searchParams.get("serviceId") ?? services[0]?.id;
    const service = services.find((item) => item.id === serviceId) ?? services[0];
    const { mode, appointments } = await listAppointments({ date, includeAll });
    const slots = date && service ? await getAvailableSlots(date, service.duration) : [];
    const booked = appointments.map((appointment) => appointment.time);

    return NextResponse.json({
      mode,
      configuredCalendar: hasCalendarConfig(),
      appointments,
      slots,
      booked,
    });
  } catch (error) {
    console.error("appointments.get.failed", error);
    return NextResponse.json(
      { message: "Impossible de charger les rendez-vous." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await createAppointment(payload);

    if ("error" in result) {
      if (result.error === "CONFLICT") {
        return NextResponse.json(
          {
            message:
              "Ce créneau vient d'être réservé, choisis un autre horaire.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        appointment: result.appointment,
        mode: "mode" in result ? result.mode : undefined,
        message: "Rendez-vous enregistré. Le créneau est maintenant bloqué.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("appointments.post.failed", error);

    if (isDuplicateSlotError(error)) {
      return NextResponse.json(
        {
          message: "Ce créneau vient d'être réservé, choisis un autre horaire.",
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
