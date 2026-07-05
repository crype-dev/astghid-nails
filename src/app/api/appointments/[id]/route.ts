import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { deleteAppointment, updateAppointmentStatus } from "@/lib/scheduling";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { status?: string };

    if (payload.status !== "confirmed" && payload.status !== "cancelled") {
      return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    }

    await updateAppointmentStatus(id, payload.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("appointments.patch.failed", error);
    return NextResponse.json(
      { message: "Impossible de modifier le rendez-vous." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteAppointment(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("appointments.delete.failed", error);
    return NextResponse.json(
      { message: "Impossible de supprimer le rendez-vous." },
      { status: 500 },
    );
  }
}
