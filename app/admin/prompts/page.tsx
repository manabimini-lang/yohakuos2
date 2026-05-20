import { PromptsManager } from "@/components/admin/prompts-manager";

export const dynamic = "force-dynamic";

export default function AdminPromptsPage() {
  return (
    <div className="py-6">
      <PromptsManager />
    </div>
  );
}
