"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { services } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fr } from "react-day-picker/locale";
import {
  dateKeyToNoonDate,
  getInitialAppointmentDateKey,
  getMaxAppointmentDateKey,
  getTodayKey,
  isClosedDay,
  toDateKey,
} from "@/lib/appointment-dates";

type SlotsResponse = {
  slots: string[];
};

type BookingStatus =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const today = getTodayKey();
const todayDate = dateKeyToNoonDate(today);
const maxAppointmentDate = dateKeyToNoonDate(getMaxAppointmentDateKey());

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function BookingForm() {
  const [serviceId, setServiceId] = useState(services[0].id);
  const [date, setDate] = useState(getInitialAppointmentDateKey());
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
  const selectedDate = useMemo(() => new Date(`${date}T12:00:00`), [date]);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setStatus({ type: "idle", message: "" });

      try {
        const params = new URLSearchParams({
          date,
          serviceDuration: String(selectedService.duration),
        });
        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as SlotsResponse;

        if (!response.ok) {
          throw new Error("Impossible de charger les créneaux.");
        }

        if (!ignore) {
          setSlots(data.slots);
          setSlot((currentSlot) =>
            data.slots.includes(currentSlot) ? currentSlot : "",
          );
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
  }, [date, selectedService.duration]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formData = new FormData(form);
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
        throw new Error(
          response.status === 409
            ? "Ce créneau vient d'être réservé, choisis un autre horaire."
            : data.message ?? "La réservation a échoué.",
        );
      }

      setStatus({
        type: "success",
        message:
          data.message ??
          "Rendez-vous enregistré. Le salon vous recontacte si une précision est nécessaire.",
      });
      setSlots((current) => current.filter((currentSlot) => currentSlot !== slot));
      setSlot("");
      form.reset();
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
      <div className="form-grid booking-service-grid">
        <label>
          Prestation
          <select
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setSlot("");
            }}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="booking-summary">
        <span>{selectedService.duration} min</span>
        <strong>{selectedService.price}</strong>
        <p>{selectedService.description}</p>
      </div>

      <div className="appointment-picker">
        <div className="appointment-calendar">
          <Calendar
            className="p-2"
            disabled={[
              { before: todayDate },
              { after: maxAppointmentDate },
              isClosedDay,
            ]}
            endMonth={maxAppointmentDate}
            locale={fr}
            mode="single"
            onSelect={(newDate) => {
              if (newDate) {
                setDate(toDateKey(newDate));
                setSlot("");
              }
            }}
            selected={selectedDate}
            startMonth={todayDate}
            weekStartsOn={1}
          />
        </div>

        <div className="appointment-slots">
          <div className="appointment-slots-heading">
            <span>Créneaux disponibles</span>
            <strong>{formatSelectedDate(date)}</strong>
          </div>
          <ScrollArea className="appointment-slots-scroll">
            <div className="appointment-slots-grid">
              {loadingSlots ? (
                <p className="appointment-slot-empty">Chargement...</p>
              ) : slots.length > 0 ? (
                slots.map((availableSlot) => (
                  <Button
                    className={`appointment-slot-button ${slot === availableSlot ? "active-slot" : ""}`}
                    key={availableSlot}
                    onClick={() => setSlot(availableSlot)}
                    size="sm"
                    type="button"
                    variant={slot === availableSlot ? "default" : "outline"}
                  >
                    {availableSlot}
                  </Button>
                ))
              ) : (
                <p className="appointment-slot-empty">
                  Aucun créneau disponible pour cette date.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
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

        <label className="email-field">
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
