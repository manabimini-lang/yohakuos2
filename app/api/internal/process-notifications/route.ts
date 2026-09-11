import { processScheduledNotifications } from "@/app/ui/backend/yui/notification_cron_service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return processScheduledNotifications(request);
}
