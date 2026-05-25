import { getSafetyOverview } from "./actions";
import { SafetyAdminView } from "@/components/admin/safety/safety-view";

export const dynamic = "force-dynamic";

export default async function AdminSafetyPage() {
  const overview = await getSafetyOverview();
  
  return <SafetyAdminView initialData={overview} />;
}
