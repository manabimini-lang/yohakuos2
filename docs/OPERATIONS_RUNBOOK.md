# YOHAKU OS2 Operations Runbook

## Service Health

- Public readiness check: `GET /api/health`
- Healthy response: HTTP 200 with `status: "ok"` and `database: "ok"`.
- Database failure or a response over three seconds: HTTP 503. The response never includes credentials, hostnames, or provider details.
- Configure an external uptime monitor to request the endpoint every five minutes and alert after two consecutive failures.

## Release Checklist

1. Keep each release in a reviewable commit so the deployed revision can be identified and rolled back.
2. Run `npm run check`.
3. Run `npm run env:check` with the production environment available. Vercel runs this automatically before every production build.
4. Deploy and confirm the Vercel deployment is Ready.
5. Verify `/api/health`, `/`, `/login`, and one authenticated YUI screen.
6. Record the deployment ID, commit SHA, verification time, and operator in the release record.

## Daily Review

- Confirm `/api/health` availability and p95 latency.
- Confirm the Google sync and morning/evening notification cron executions completed.
- Review server errors, failed AI jobs, Stripe webhook retries, and authentication failures.
- Compare failures with the previous seven days; investigate any material increase.

## Weekly Review

- Review active users, activation, seven-day return rate, AI consultation success, and calendar-action success.
- Confirm database backup status and perform a documented restore drill at least monthly.
- Review dependency and security alerts, then create a small, reversible release for accepted updates.

## Periodic Tasks

| Task | Frequency | Purpose | Failure Handling |
| :--- | :--- | :--- | :--- |
| **Google Calendar sync** | Daily 06:00 JST | Refresh connected calendar data. | Inspect cron logs and Google reauthorization state. |
| **Morning notifications** | Daily 07:00 JST | Generate and deliver the morning brief. | Inspect delivery logs and retry only failed users. |
| **Evening notifications** | Daily 20:00 JST | Generate and deliver the evening reflection. | Inspect delivery logs and retry only failed users. |
| **AI job processing** | Daily 07:00, 12:00, 21:00 JST | Process queued AI work. | Check pending/processing counts and provider errors. |
| **Expired-data cleanup** | Daily 04:00 JST | Remove records whose retention period has expired. | Review cleanup logs before any manual deletion. |

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
