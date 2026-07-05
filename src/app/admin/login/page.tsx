import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata = {
  title: "Connexion admin | Astghid Nails",
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-back-link" href="/">
          Retour au site
        </Link>
        <p className="eyebrow">Administration</p>
        <h1>Astghid Nails</h1>
        <p>
          Connectez-vous pour consulter les rendez-vous et gérer les
          indisponibilités.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
