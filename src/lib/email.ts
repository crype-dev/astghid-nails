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

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://astghidnails.com";
}

function buildButton(href: string, label: string, background = "#171013") {
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;border-radius:999px;background:${background};color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;margin:6px 8px 6px 0">
      ${escapeHtml(label)}
    </a>
  `;
}

function buildConfirmationHtml(appointment: Appointment, cancelUrl: string) {
  const safeName = escapeHtml(appointment.name);
  const safeService = escapeHtml(appointment.serviceName);
  const safePrice = escapeHtml(appointment.servicePrice);
  const safeAddress = escapeHtml(salon.address);
  const safeSiteUrl = escapeHtml(getSiteUrl());

  return `
    <div style="margin:0;padding:0;background:#fffaf8">
      <div style="max-width:620px;margin:0 auto;padding:28px 16px;font-family:Arial,sans-serif;color:#241b1f;line-height:1.6">
        <div style="border:1px solid #eadfda;border-radius:14px;overflow:hidden;background:#ffffff">
          <div style="background:#171013;color:#fff6ef;padding:26px 24px">
            <p style="margin:0 0 8px;color:#f0bcc9;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">
              ${escapeHtml(salon.name)}
            </p>
            <h1 style="font-size:24px;line-height:1.2;margin:0">Votre rendez-vous est confirmé</h1>
          </div>

          <div style="padding:24px">
            <p style="margin:0 0 14px">Bonjour ${safeName},</p>
            <p style="margin:0 0 18px">Merci pour votre réservation chez <strong>${escapeHtml(salon.name)}</strong>. Voici le résumé complet de votre rendez-vous.</p>

            <div style="border:1px solid #eadfda;border-radius:10px;padding:18px;margin:20px 0;background:#fffaf8">
              <p style="margin:0 0 10px"><strong>Prestation :</strong> ${safeService}</p>
              <p style="margin:0 0 10px"><strong>Date :</strong> ${formatAppointmentDate(appointment.date)}</p>
              <p style="margin:0 0 10px"><strong>Heure :</strong> ${appointment.time}</p>
              <p style="margin:0 0 10px"><strong>Durée :</strong> ${appointment.serviceDurationMinutes} min</p>
              <p style="margin:0"><strong>Prix :</strong> ${safePrice}</p>
            </div>

            <p style="margin:0 0 12px"><strong>Adresse :</strong> ${safeAddress}</p>
            <p style="margin:0 0 18px">Si vous ne pouvez plus venir, merci d'annuler via le lien ci-dessous afin de libérer le créneau.</p>

            <div style="margin:22px 0">
              ${buildButton(getSiteUrl(), "Voir le site")}
              ${buildButton(cancelUrl, "Annuler mon rendez-vous", "#a84e64")}
            </div>

            <p style="font-size:13px;color:#7d6d70;margin:18px 0 0">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${escapeHtml(cancelUrl)}" style="color:#a84e64;word-break:break-all">${escapeHtml(cancelUrl)}</a>
            </p>
          </div>

          <div style="padding:18px 24px;background:#fff6ef;border-top:1px solid #eadfda;color:#7d6d70;font-size:13px">
            À bientôt,<br><strong style="color:#241b1f">${escapeHtml(salon.name)}</strong><br>
            <a href="${safeSiteUrl}" style="color:#a84e64">${safeSiteUrl}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendAppointmentConfirmation(
  appointment: Appointment,
  cancelToken: string,
): Promise<EmailResult> {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    return { status: "disabled" };
  }

  try {
    const cancelUrl = `${getSiteUrl()}/cancel/${encodeURIComponent(cancelToken)}`;

    await resend.emails.send({
      from,
      to: appointment.email,
      bcc: process.env.RESEND_OWNER_EMAIL || undefined,
      subject: `Confirmation de votre rendez-vous - ${salon.name}`,
      html: buildConfirmationHtml(appointment, cancelUrl),
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

export async function sendAppointmentCancellationNotice(
  appointment: Appointment,
): Promise<EmailResult> {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  const ownerEmail = process.env.RESEND_OWNER_EMAIL;

  if (!resend || !from || !ownerEmail) {
    return { status: "disabled" };
  }

  try {
    await resend.emails.send({
      from,
      to: ownerEmail,
      subject: `Rendez-vous annulé - ${appointment.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#241b1f;line-height:1.6">
          <h1 style="font-size:22px;margin:0 0 16px">Rendez-vous annulé</h1>
          <p><strong>Cliente :</strong> ${escapeHtml(appointment.name)}</p>
          <p><strong>Email :</strong> ${escapeHtml(appointment.email)}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(appointment.phone)}</p>
          <p><strong>Prestation :</strong> ${escapeHtml(appointment.serviceName)}</p>
          <p><strong>Date :</strong> ${formatAppointmentDate(appointment.date)}</p>
          <p><strong>Heure :</strong> ${appointment.time}</p>
        </div>
      `,
    });

    return { status: "sent" };
  } catch (error) {
    console.error("resend.appointment_cancellation_notice.failed", error);

    return {
      status: "failed",
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'email d'annulation.",
    };
  }
}
