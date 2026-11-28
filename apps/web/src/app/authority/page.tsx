import { requireRole } from "@/lib/auth/server";
import { AuthorityDashboard } from "@/components/analytics/authority-dashboard";

export default async function AuthorityPage() {
  await requireRole("authority");

  return (
    <div data-fullscreen="true" className="w-full flex-1 flex flex-col">
      <AuthorityDashboard />
    </div>
  );
}
