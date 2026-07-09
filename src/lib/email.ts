import { Resend } from "resend";
import { salon } from "@/data/site";
import type { Appointment } from "@/lib/scheduling";

type EmailResult =
  | { status: "sent" }
  | { status: "disabled" }
  | { status: "failed"; error: string };

export type AppointmentEmailResult = {
  customer: EmailResult;
  owner: EmailResult;
};

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

function getLogoUrl() {
  return `${getSiteUrl()}/astghid-logo.png`;
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
  const safeLogoUrl = escapeHtml(getLogoUrl());

  return `
    <div style="margin:0;padding:0;background:#fff8f5">
      <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
        Votre rendez-vous chez ${escapeHtml(salon.name)} est confirmé.
      </div>
      <div style="max-width:640px;margin:0 auto;padding:28px 14px;font-family:Arial,Helvetica,sans-serif;color:#261c21;line-height:1.6">
        <div style="border:1px solid #eadcd5;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 10px 32px rgba(38,28,33,.08)">
          <div style="background:#fbefe9;padding:26px 24px 22px;text-align:center;border-bottom:1px solid #eadcd5">
            <img src="${safeLogoUrl}" width="58" height="58" alt="${escapeHtml(
              salon.name,
            )}" style="display:block;width:58px;height:58px;margin:0 auto 12px;border:0;border-radius:999px;outline:none;text-decoration:none">
            <p style="margin:0;color:#a84e64;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">
              ${escapeHtml(salon.name)}
            </p>
            <p style="margin:4px 0 0;color:#7d6d70;font-size:13px">${escapeHtml(
              salon.baseline,
            )}</p>
          </div>

          <div style="padding:28px 24px 24px">
            <p style="margin:0 0 10px;color:#b88942;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">Confirmation</p>
            <h1 style="font-size:28px;line-height:1.2;margin:0 0 14px;color:#261c21">Votre rendez-vous est confirmé</h1>
            <p style="margin:0 0 20px;color:#5f5358">Bonjour ${safeName}, merci pour votre réservation. Voici toutes les informations utiles pour votre passage au salon.</p>

            <div style="border:1px solid #eadcd5;border-radius:14px;padding:20px;margin:22px 0;background:#fffaf8">
              <p style="margin:0 0 14px;color:#a84e64;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Détails du rendez-vous</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                <tr>
                  <td style="padding:8px 0;color:#7d6d70;font-size:14px">Prestation</td>
                  <td style="padding:8px 0;color:#261c21;font-size:14px;font-weight:700;text-align:right">${safeService}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7d6d70;font-size:14px">Date</td>
                  <td style="padding:8px 0;color:#261c21;font-size:14px;font-weight:700;text-align:right">${formatAppointmentDate(
                    appointment.date,
                  )}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7d6d70;font-size:14px">Heure</td>
                  <td style="padding:8px 0;color:#261c21;font-size:14px;font-weight:700;text-align:right">${appointment.time}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7d6d70;font-size:14px">Durée</td>
                  <td style="padding:8px 0;color:#261c21;font-size:14px;font-weight:700;text-align:right">${appointment.serviceDurationMinutes} min</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#7d6d70;font-size:14px">Prix</td>
                  <td style="padding:8px 0;color:#261c21;font-size:14px;font-weight:700;text-align:right">${safePrice}</td>
                </tr>
              </table>
            </div>

            <div style="border-left:4px solid #d7a85d;padding:2px 0 2px 14px;margin:0 0 22px">
              <p style="margin:0;color:#7d6d70;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Informations pratiques</p>
              <p style="margin:6px 0 0;color:#261c21"><strong>Adresse :</strong> ${safeAddress}</p>
              <p style="margin:6px 0 0;color:#5f5358">En cas d'empêchement, merci d'annuler via le lien ci-dessous afin de libérer le créneau.</p>
            </div>

            <div style="margin:22px 0 6px">
              ${buildButton(getSiteUrl(), "Voir le site")}
              ${buildButton(cancelUrl, "Annuler mon rendez-vous", "#a84e64")}
            </div>

            <p style="font-size:12px;color:#7d6d70;margin:18px 0 0;line-height:1.5">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${escapeHtml(cancelUrl)}" style="color:#a84e64;word-break:break-all">${escapeHtml(cancelUrl)}</a>
            </p>
          </div>

          <div style="padding:20px 24px;background:#171013;color:#fff6ef;font-size:13px;text-align:center">
            <strong style="display:block;color:#ffffff;margin-bottom:4px">${escapeHtml(
              salon.name,
            )}</strong>
            <span style="color:#eadcd5">${safeAddress}</span><br>
            <a href="${safeSiteUrl}" style="color:#a84e64">${safeSiteUrl}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildOwnerBookingHtml(appointment: Appointment) {
  return `
    <div style="font-family:Arial,sans-serif;color:#241b1f;line-height:1.6">
      <h1 style="font-size:22px;margin:0 0 16px">Nouveau rendez-vous</h1>
      <p><strong>Cliente :</strong> ${escapeHtml(appointment.name)}</p>
      <p><strong>Email :</strong> ${escapeHtml(appointment.email)}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(appointment.phone)}</p>
      <p><strong>Prestation :</strong> ${escapeHtml(appointment.serviceName)}</p>
      <p><strong>Date :</strong> ${formatAppointmentDate(appointment.date)}</p>
      <p><strong>Heure :</strong> ${appointment.time}</p>
      <p><strong>Durée :</strong> ${appointment.serviceDurationMinutes} min</p>
      <p><strong>Prix :</strong> ${escapeHtml(appointment.servicePrice)}</p>
      ${
        appointment.message
          ? `<p><strong>Message :</strong> ${escapeHtml(appointment.message)}</p>`
          : ""
      }
    </div>
  `;
}

export async function sendAppointmentConfirmation(
  appointment: Appointment,
  cancelToken: string,
): Promise<AppointmentEmailResult> {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    return {
      customer: { status: "disabled" },
      owner: { status: "disabled" },
    };
  }

  try {
    const cancelUrl = `${getSiteUrl()}/cancel/${encodeURIComponent(
      appointment.id,
    )}/${encodeURIComponent(cancelToken)}`;
    const ownerEmail = process.env.RESEND_OWNER_EMAIL;

    const [customerResult, ownerResult] = await Promise.allSettled([
      resend.emails.send({
        from,
        to: appointment.email,
        subject: `Confirmation de votre rendez-vous - ${salon.name}`,
        html: buildConfirmationHtml(appointment, cancelUrl),
      }),
      ownerEmail
        ? resend.emails.send({
            from,
            to: ownerEmail,
            subject: `Nouveau rendez-vous - ${appointment.name}`,
            html: buildOwnerBookingHtml(appointment),
          })
        : Promise.resolve(undefined),
    ]);

    return {
      customer:
        customerResult.status === "fulfilled"
          ? { status: "sent" }
          : {
              status: "failed",
              error:
                customerResult.reason instanceof Error
                  ? customerResult.reason.message
                  : "Impossible d'envoyer l'email cliente.",
            },
      owner: !ownerEmail
        ? { status: "disabled" }
        : ownerResult.status === "fulfilled"
          ? { status: "sent" }
          : {
              status: "failed",
              error:
                ownerResult.reason instanceof Error
                  ? ownerResult.reason.message
                  : "Impossible d'envoyer l'email salon.",
            },
    };
  } catch (error) {
    console.error("resend.appointment_confirmation.failed", error);

    return {
      customer: {
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer l'email de confirmation.",
      },
      owner: { status: "disabled" },
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
