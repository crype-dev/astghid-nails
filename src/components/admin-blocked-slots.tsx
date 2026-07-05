"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BlockedSlot = {
  id: number;
  blockedDate: string;
  blockedTime: string | null;
  reason: string;
};

type BlockedSlotsResponse = {
  blockedSlots: BlockedSlot[];
};

const today = new Date().toISOString().slice(0, 10);

export function AdminBlockedSlots() {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const fetchBlockedSlots = useCallback(async (selectedDate: string) => {
    const response = await fetch(`/api/blocked-slots?date=${selectedDate}`, {
      cache: "no-store",
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return [];
    }

    const data = (await response.json()) as BlockedSlotsResponse;

    if (!response.ok) {
      throw new Error("Impossible de charger les indisponibilités.");
    }

    return data.blockedSlots;
  }, [router]);

  const loadBlockedSlots = useCallback(async (selectedDate = date) => {
    setLoading(true);
    setStatus("");

    try {
      setBlockedSlots(await fetchBlockedSlots(selectedDate));
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Impossible de charger les indisponibilités.",
      );
    } finally {
      setLoading(false);
    }
  }, [date, fetchBlockedSlots]);

  async function createBlockedSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blockedDate: date,
        blockedTime: String(formData.get("blockedTime") ?? "") || null,
        reason: String(formData.get("reason") ?? "").trim(),
      }),
    });
    const data = (await response.json()) as { message?: string };

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setStatus(data.message ?? "Ajout impossible.");
      return;
    }

    event.currentTarget.reset();
    await loadBlockedSlots(date);
  }

  async function deleteBlockedSlot(id: number) {
    const response = await fetch(`/api/blocked-slots?id=${id}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setStatus("Suppression impossible.");
      return;
    }

    setBlockedSlots((current) => current.filter((blockedSlot) => blockedSlot.id !== id));
  }

  useEffect(() => {
    let ignore = false;

    fetchBlockedSlots(date)
      .then((loadedBlockedSlots) => {
        if (!ignore) {
          setBlockedSlots(loadedBlockedSlots);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Impossible de charger les indisponibilités.",
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
  }, [date, fetchBlockedSlots]);

  return (
    <div className="admin-stack">
      <header className="admin-section-header">
        <div>
          <p className="eyebrow">Disponibilités</p>
          <h2>Indisponibilités</h2>
          <p>Bloquez une journée complète ou un créneau précis.</p>
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
      </header>

      <form className="admin-panel admin-block-form" onSubmit={createBlockedSlot}>
        <label>
          Heure
          <input name="blockedTime" placeholder="10:00, ou vide pour la journée" />
        </label>
        <label>
          Raison
          <input name="reason" placeholder="Congé, pause, urgence..." />
        </label>
        <button className="primary-action" type="submit">
          Bloquer
        </button>
      </form>

      {status ? <p className="status-message error">{status}</p> : null}

      <div className="admin-panel">
        {loading ? (
          <p className="admin-empty">Chargement...</p>
        ) : blockedSlots.length === 0 ? (
          <p className="admin-empty">Aucune indisponibilité pour cette date.</p>
        ) : (
          <div className="blocked-list">
            {blockedSlots.map((blockedSlot) => (
              <article key={blockedSlot.id}>
                <div>
                  <strong>{blockedSlot.blockedTime ?? "Journée complète"}</strong>
                  <span>{blockedSlot.reason || "Indisponibilité"}</span>
                </div>
                <button
                  className="admin-danger"
                  onClick={() => deleteBlockedSlot(blockedSlot.id)}
                  type="button"
                >
                  Supprimer
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
