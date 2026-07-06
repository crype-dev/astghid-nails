import { CancelAppointment } from "@/components/cancel-appointment";

export const metadata = {
  title: "Annuler un rendez-vous | Astghid Nails",
};

type CancelPageProps = {
  params: Promise<{ idOrToken: string; token: string }>;
};

export default async function CancelPage({ params }: CancelPageProps) {
  const { idOrToken, token } = await params;

  return <CancelAppointment appointmentId={idOrToken} token={token} />;
}
