"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { services } from "@/data/site";

type SlotsResponse = {
  configuredCalendar: boolean;
  slots: string[];
  booked: string[];
};

type BookingStatus =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const today = new Date().toISOString().slice(0, 10);

export function BookingForm() {
  const [serviceId, setServiceId] = useState(services[0].id);
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<BookingStatus>({
    type: "idle",
    message: "",
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? services[0],
    [serviceId],
  );

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setStatus({ type: "idle", message: "" });

      try {
        const response = await fetch(`/api/appointments?date=${date}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as SlotsResponse;

        if (!response.ok) {
          throw new Error("Impossible de charger les créneaux.");
        }

        if (!ignore) {
          setSlots(data.slots);
          setSlot(data.slots[0] ?? "");
        }
      } catch {
        if (!ignore) {
          setSlots([]);
          setSlot("");
          setStatus({
            type: "error",
            message:
              "Les créneaux ne sont pas disponibles pour le moment. Réessayez ou contactez le salon.",
          });
        }
      } finally {
        if (!ignore) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      ignore = true;
    };
  }, [date]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formData = new FormData(event.currentTarget);
    const payload = {
      serviceId,
      date,
      time: slot,
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "La réservation a échoué.");
      }

      setStatus({
        type: "success",
        message:
          data.message ??
          "Rendez-vous enregistré. Le salon vous recontacte si une précision est nécessaire.",
      });
      setSlots((current) => current.filter((currentSlot) => currentSlot !== slot));
      setSlot("");
      event.currentTarget.reset();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "La réservation a échoué. Aucun rendez-vous n'a été enregistré.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-panel" onSubmit={submitBooking}>
      <div className="form-grid">
        <label>
          Prestation
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            min={today}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

        <label>
          Heure disponible
          <select
            value={slot}
            onChange={(event) => setSlot(event.target.value)}
            disabled={loadingSlots || slots.length === 0}
            required
          >
            {loadingSlots ? (
              <option>Chargement...</option>
            ) : slots.length > 0 ? (
              slots.map((availableSlot) => (
                <option key={availableSlot} value={availableSlot}>
                  {availableSlot}
                </option>
              ))
            ) : (
              <option>Aucun créneau disponible</option>
            )}
          </select>
        </label>
      </div>

      <div className="booking-summary">
        <span>{selectedService.duration} min</span>
        <strong>{selectedService.price}</strong>
        <p>{selectedService.description}</p>
      </div>

      <div className="form-grid">
        <label>
          Nom complet
          <input name="name" minLength={2} placeholder="Votre nom" required />
        </label>

        <label>
          Téléphone
          <input
            name="phone"
            inputMode="tel"
            minLength={8}
            placeholder="+32 ..."
            required
          />
        </label>

        <label>
          Email
          <input name="email" type="email" placeholder="vous@email.com" required />
        </label>
      </div>

      <label>
        Message optionnel
        <textarea
          name="message"
          placeholder="Inspiration, longueur souhaitée, contrainte horaire..."
          rows={4}
        />
      </label>

      <button
        className="primary-action full"
        disabled={submitting || loadingSlots || !slot}
        type="submit"
      >
        {submitting ? "Enregistrement..." : "Confirmer le rendez-vous"}
      </button>

      {status.message ? (
        <p className={`status-message ${status.type}`}>{status.message}</p>
      ) : null}
    </form>
  );
}
