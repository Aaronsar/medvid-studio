import { getApiKeyStatus } from "@/lib/integrations/config";
import { DashboardContent } from "@/components/project/dashboard-content";

export default function DashboardPage() {
  const apiStatus = getApiKeyStatus();
  return <DashboardContent apiStatus={apiStatus} />;
}
