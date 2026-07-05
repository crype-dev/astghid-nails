import { redirect } from "next/navigation";
import { AdminAppointments } from "@/components/admin-appointments";
import { AdminFrame } from "@/components/admin-frame";
import { isAdminRequest } from "@/lib/admin-auth";

export const metadata = {
  title: "Rendez-vous | Admin Astghid Nails",
};

export default async function AdminAppointmentsPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login");
  }

  return (
    <AdminFrame current="appointments">
      <AdminAppointments />
    </AdminFrame>
  );
}
