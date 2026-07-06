import { NextResponse } from "next/server";
import { getAvailableSlots, datePattern } from "@/lib/scheduling";
import { isWithinAppointmentWindow } from "@/lib/appointment-dates";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? "";
    const serviceDuration = Number(searchParams.get("serviceDuration") ?? "0");

    if (!datePattern.test(date)) {
      return NextResponse.json({ message: "Date invalide." }, { status: 400 });
    }

    if (!isWithinAppointmentWindow(date)) {
      return NextResponse.json(
        {
          message: "Les rendez-vous sont ouverts jusqu'à deux mois à l'avance.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(serviceDuration) || serviceDuration <= 0) {
      return NextResponse.json(
        { message: "Durée de prestation invalide." },
        { status: 400 },
      );
    }

    const slots = await getAvailableSlots(date, serviceDuration);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("availability.get.failed", error);
    return NextResponse.json(
      { message: "Impossible de charger les disponibilités." },
      { status: 500 },
    );
  }
}
