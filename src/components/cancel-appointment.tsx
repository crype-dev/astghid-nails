"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Appointment = {
  serviceName: string;
  date: string;
  time: string;
  status: "confirmed" | "cancelled";
};

type CancelState =
  | { type: "loading"; message: string }
  | { type: "ready"; appointment: Appointment; message: string }
  | { type: "success"; appointment: Appointment; message: string }
  | { type: "error"; message: string };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function CancelAppointment({
  appointmentId,
  token,
}: {
  appointmentId?: string;
  token: string;
}) {
  const [state, setState] = useState<CancelState>({
    type: "loading",
    message: "Vérification du rendez-vous...",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadAppointment() {
      try {
        const params = new URLSearchParams({ token });

        if (appointmentId) {
          params.set("id", appointmentId);
        }

        const response = await fetch(
          `/api/appointments/cancel?${params.toString()}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as {
          appointment?: Appointment;
          message?: string;
        };

        if (!response.ok || !data.appointment) {
          throw new Error(data.message ?? "Lien d'annulation invalide.");
        }

        if (!ignore) {
          if (data.appointment.status === "cancelled") {
            setState({
              type: "success",
              appointment: data.appointment,
              message: "Ce rendez-vous est déjà annulé.",
            });
            return;
          }

          setState({
            type: "ready",
            appointment: data.appointment,
            message: "Confirmez l'annulation de ce rendez-vous.",
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Lien d'annulation invalide.",
          });
        }
      }
    }

    loadAppointment();

    return () => {
      ignore = true;
    };
  }, [appointmentId, token]);

  async function cancelAppointment() {
    setSubmitting(true);

    try {
      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, token }),
      });
      const data = (await response.json()) as {
        appointment?: Appointment;
        message?: string;
      };

      if (!response.ok || !data.appointment) {
        throw new Error(data.message ?? "L'annulation a échoué.");
      }

      setState({
        type: "success",
        appointment: data.appointment,
        message: data.message ?? "Votre rendez-vous a bien été annulé.",
      });
    } catch (error) {
      setState({
        type: "error",
        message:
          error instanceof Error ? error.message : "L'annulation a échoué.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const appointment =
    state.type === "ready" || state.type === "success" ? state.appointment : null;

  return (
    <main className="cancel-page">
      <section className="cancel-card">
        <p className="eyebrow">Astghid Nails</p>
        <h1>Annuler mon rendez-vous</h1>
        <p className={state.type === "error" ? "cancel-error" : "cancel-message"}>
          {state.message}
        </p>

        {appointment ? (
          <div className="cancel-summary">
            <span>Rendez-vous</span>
            <strong>{appointment.serviceName}</strong>
            <p>{formatDate(appointment.date)} à {appointment.time}</p>
          </div>
        ) : null}

        {state.type === "ready" ? (
          <button
            className="primary-action full"
            disabled={submitting}
            onClick={cancelAppointment}
            type="button"
          >
            {submitting ? "Annulation..." : "Annuler mon rendez-vous"}
          </button>
        ) : null}

        <Link className="secondary-action full" href="/">
          Retour au site
        </Link>
      </section>
    </main>
  );
}
