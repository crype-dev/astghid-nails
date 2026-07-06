"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "confirmed" | "cancelled";
};

type AppointmentsResponse = {
  appointments: Appointment[];
};

const today = new Date().toISOString().slice(0, 10);

export function AdminAppointments() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const confirmedCount = useMemo(
    () => appointments.filter((appointment) => appointment.status === "confirmed").length,
    [appointments],
  );

  const fetchAppointments = useCallback(async (selectedDate: string) => {
    const params = new URLSearchParams({ includeAll: "true" });
    if (selectedDate) {
      params.set("date", selectedDate);
    }

    const response = await fetch(`/api/appointments?${params.toString()}`, {
      cache: "no-store",
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return [];
    }

    const data = (await response.json()) as AppointmentsResponse;

    if (!response.ok) {
      throw new Error("Impossible de charger les rendez-vous.");
    }

    return selectedDate
      ? data.appointments
      : data.appointments.filter((appointment) => appointment.date >= today);
  }, [router]);

  async function updateStatus(id: string, nextStatus: Appointment["status"]) {
    setStatus("");

    const response = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setStatus("La modification a échoué.");
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status: nextStatus } : appointment,
      ),
    );
  }

  useEffect(() => {
    let ignore = false;

    fetchAppointments(date)
      .then((loadedAppointments) => {
        if (!ignore) {
          setAppointments(loadedAppointments);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Impossible de charger les rendez-vous.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [date, fetchAppointments]);

  return (
    <div className="admin-stack">
      <header className="admin-section-header">
        <div>
          <p className="eyebrow">Rendez-vous</p>
          <h2>{date ? "Planning du jour" : "Prochains rendez-vous"}</h2>
          <p>
            {confirmedCount} rendez-vous confirmé{confirmedCount > 1 ? "s" : ""}
          </p>
        </div>
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setLoading(true);
              setStatus("");
              setDate(event.target.value);
            }}
          />
        </label>
        {date ? (
          <button
            className="admin-secondary"
            onClick={() => {
              setLoading(true);
              setStatus("");
              setDate("");
            }}
            type="button"
          >
            Voir tout
          </button>
        ) : null}
      </header>

      {status ? <p className="status-message error">{status}</p> : null}

      <div className="admin-table-wrap">
        {loading ? (
          <p className="admin-empty">Chargement...</p>
        ) : appointments.length === 0 ? (
          <p className="admin-empty">Aucun rendez-vous pour cette date.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Date</th>
                <th>Cliente</th>
                <th>Prestation</th>
                <th>Contact</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <strong>{appointment.time}</strong>
                    <small>{appointment.serviceDurationMinutes} min</small>
                  </td>
                  <td>{appointment.date}</td>
                  <td>
                    <strong>{appointment.name}</strong>
                    {appointment.message ? <small>{appointment.message}</small> : null}
                  </td>
                  <td>
                    <strong>{appointment.serviceName}</strong>
                    <small>{appointment.servicePrice}</small>
                  </td>
                  <td>
                    <a href={`tel:${appointment.phone}`}>{appointment.phone}</a>
                    <a href={`mailto:${appointment.email}`}>{appointment.email}</a>
                  </td>
                  <td>
                    <span className={`admin-pill ${appointment.status}`}>
                      {appointment.status === "confirmed" ? "Confirmé" : "Annulé"}
                    </span>
                  </td>
                  <td>
                    {appointment.status === "confirmed" ? (
                      <button
                        className="admin-danger"
                        onClick={() => updateStatus(appointment.id, "cancelled")}
                        type="button"
                      >
                        Annuler
                      </button>
                    ) : (
                      <button
                        className="admin-secondary"
                        onClick={() => updateStatus(appointment.id, "confirmed")}
                        type="button"
                      >
                        Réactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
