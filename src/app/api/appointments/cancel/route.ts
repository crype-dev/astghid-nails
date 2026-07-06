import { NextResponse } from "next/server";
import {
  cancelAppointmentByToken,
  getAppointmentByCancelToken,
} from "@/lib/scheduling";
import { sendAppointmentCancellationNotice } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? "";
    const appointmentId = searchParams.get("id") ?? undefined;
    const result = await getAppointmentByCancelToken(token, appointmentId);

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: 404 });
    }

    return NextResponse.json({ appointment: result.appointment });
  } catch (error) {
    console.error("appointments.cancel.get.failed", error);
    return NextResponse.json(
      { message: "Impossible de vérifier ce rendez-vous." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string; token?: string };
    const result = await cancelAppointmentByToken(payload.token, payload.id);

    if (result.error) {
      const status = result.error.includes("déjà annulé") ? 409 : 404;
      return NextResponse.json(
        { message: result.error, appointment: result.appointment },
        { status },
      );
    }

    if (!result.appointment) {
      return NextResponse.json(
        { message: "Lien d'annulation invalide." },
        { status: 404 },
      );
    }

    const emailResult = await sendAppointmentCancellationNotice(result.appointment);

    return NextResponse.json({
      appointment: result.appointment,
      emailStatus: emailResult.status,
      message: "Votre rendez-vous a bien été annulé.",
    });
  } catch (error) {
    console.error("appointments.cancel.post.failed", error);
    return NextResponse.json(
      { message: "Impossible d'annuler ce rendez-vous." },
      { status: 500 },
    );
  }
}
