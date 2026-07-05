import { redirect } from "next/navigation";
import { AdminBlockedSlots } from "@/components/admin-blocked-slots";
import { AdminFrame } from "@/components/admin-frame";
import { isAdminRequest } from "@/lib/admin-auth";

export const metadata = {
  title: "Indisponibilités | Admin Astghid Nails",
};

export default async function AdminBlockedSlotsPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login");
  }

  return (
    <AdminFrame current="blocked-slots">
      <AdminBlockedSlots />
    </AdminFrame>
  );
}
