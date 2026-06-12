# YOHAKU OS2 Operations Runbook

## Periodic Tasks

| Task | Frequency | Purpose | Failure Handling |
| :--- | :--- | :--- | :--- |
| **Zombie Recovery** | 5 Minutes | Restart AI jobs stuck in `processing` due to worker crash. | Check worker logs for crash loops. |
| **Failed Job Aggregation** | 1 Hour | Alert if `FAILED > 10/hr`. Indicates AI Provider outage. | Switch Gemini API keys or notify users. |
| **Storage Cleanup** | Daily (03:00) | Delete `FAILED` upload records and orphaned files. | Manual storage audit if cleanup logs errors. |
| **Webhook Retention** | Daily | Prune `StripeWebhookEvent` logs older than 30 days. | Ensure DB index efficiency. |

## Critical Incident Response

### 1. Subscription Mismatch
- **Scenario**: User reports "Paid" but status is "Free".
- **Action**: Query `StripeWebhookEvent` for the user's email. Check `AuditLog` category `billing`.

### 2. AI Processing Stalls
- **Scenario**: No new `UserMemory` generated for 1 hour.
- **Action**: Check `/admin/operations/summary`. If `pendingJobs` is high but `processingJobs` is 0, restart the background worker.

### 3. Storage Inconsistency
- **Scenario**: `ContentItem` has `uploadStatus: FAILED`.
- **Action**: Run `lib/storage/cleanup` manually to ensure S3/Supabase Storage matches DB.
