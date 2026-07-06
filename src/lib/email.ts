import { Resend } from "resend";
import { salon } from "@/data/site";
import type { Appointment } from "@/lib/scheduling";

type EmailResult =
  | { status: "sent" }
  | { status: "disabled" }
  | { status: "failed"; error: string };

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !process.env.RESEND_FROM_EMAIL) {
    return undefined;
  }

  return new Resend(apiKey);
}

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildConfirmationHtml(appointment: Appointment) {
  const safeName = escapeHtml(appointment.name);
  const safeService = escapeHtml(appointment.serviceName);
  const safePrice = escapeHtml(appointment.servicePrice);
  const safeAddress = escapeHtml(salon.address);
  const safeSiteUrl = escapeHtml(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://astghidnails.com",
  );

  return `
    <div style="font-family:Arial,sans-serif;color:#241b1f;line-height:1.6">
      <h1 style="font-size:22px;margin:0 0 16px">Votre rendez-vous est confirmé</h1>
      <p>Bonjour ${safeName},</p>
      <p>Merci pour votre réservation chez <strong>${salon.name}</strong>.</p>
      <div style="border:1px solid #eadfda;border-radius:8px;padding:16px;margin:20px 0;background:#fffaf8">
        <p style="margin:0 0 8px"><strong>Prestation :</strong> ${safeService}</p>
        <p style="margin:0 0 8px"><strong>Date :</strong> ${formatAppointmentDate(appointment.date)}</p>
        <p style="margin:0 0 8px"><strong>Heure :</strong> ${appointment.time}</p>
        <p style="margin:0"><strong>Prix :</strong> ${safePrice}</p>
      </div>
      <p><strong>Adresse :</strong> ${safeAddress}</p>
      <p>
        Site :
        <a href="${safeSiteUrl}" style="color:#a84e64">${safeSiteUrl}</a>
      </p>
      <p>À bientôt,<br>${salon.name}</p>
    </div>
  `;
}

export async function sendAppointmentConfirmation(
  appointment: Appointment,
): Promise<EmailResult> {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    return { status: "disabled" };
  }

  try {
    await resend.emails.send({
      from,
      to: appointment.email,
      bcc: process.env.RESEND_OWNER_EMAIL || undefined,
      subject: `Confirmation de votre rendez-vous - ${salon.name}`,
      html: buildConfirmationHtml(appointment),
    });

    return { status: "sent" };
  } catch (error) {
    console.error("resend.appointment_confirmation.failed", error);

    return {
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'email de confirmation.",
    };
  }
}
