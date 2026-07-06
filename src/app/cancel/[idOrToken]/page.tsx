import { CancelAppointment } from "@/components/cancel-appointment";

export const metadata = {
  title: "Annuler un rendez-vous | Astghid Nails",
};

type CancelPageProps = {
  params: Promise<{ idOrToken: string }>;
};

export default async function CancelPage({ params }: CancelPageProps) {
  const { idOrToken } = await params;

  return <CancelAppointment token={idOrToken} />;
}
