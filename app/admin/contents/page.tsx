import { ExternalContentsManager } from "@/components/admin/external-contents-manager";

export const dynamic = "force-dynamic";

export default function AdminContentsPage() {
  return (
    <div className="py-6">
      <ExternalContentsManager />
    </div>
  );
}
