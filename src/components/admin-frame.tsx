import Link from "next/link";
import { ReactNode } from "react";
import { AdminLogoutButton } from "@/components/admin-logout-button";

type AdminFrameProps = {
  children: ReactNode;
  current: "appointments" | "blocked-slots";
};

export function AdminFrame({ children, current }: AdminFrameProps) {
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Astghid Nails</h1>
        </div>
        <nav className="admin-nav" aria-label="Navigation admin">
          <Link
            className={current === "appointments" ? "active" : ""}
            href="/admin"
          >
            Rendez-vous
          </Link>
          <Link
            className={current === "blocked-slots" ? "active" : ""}
            href="/admin/blocked-slots"
          >
            Indisponibilités
          </Link>
        </nav>
        <AdminLogoutButton />
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  );
}
