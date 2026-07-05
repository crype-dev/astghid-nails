import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createBlockedSlot,
  deleteBlockedSlot,
  listBlockedSlots,
} from "@/lib/scheduling";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    const blockedSlots = await listBlockedSlots(date);

    return NextResponse.json({ blockedSlots });
  } catch (error) {
    console.error("blocked-slots.get.failed", error);
    return NextResponse.json(
      { message: "Impossible de charger les indisponibilités." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await createBlockedSlot(payload);

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("blocked-slots.post.failed", error);
    return NextResponse.json(
      { message: "Impossible d'ajouter l'indisponibilité." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Identifiant invalide." }, { status: 400 });
    }

    await deleteBlockedSlot(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("blocked-slots.delete.failed", error);
    return NextResponse.json(
      { message: "Impossible de supprimer l'indisponibilité." },
      { status: 500 },
    );
  }
}
