"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: String(formData.get("password") ?? ""),
        }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Connexion impossible.");
      }

      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submitLogin}>
      <label>
        Mot de passe
        <input
          autoComplete="current-password"
          name="password"
          required
          type="password"
        />
      </label>
      <button className="primary-action full" disabled={loading} type="submit">
        {loading ? "Connexion..." : "Se connecter"}
      </button>
      {error ? <p className="status-message error">{error}</p> : null}
    </form>
  );
}
