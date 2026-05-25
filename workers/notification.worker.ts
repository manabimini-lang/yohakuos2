// ===================================================
// YOHAKU Workers — Notification Worker
// ===================================================
//
// Sends email and push notifications.
// Triggered by notification.email and notification.push jobs.
// ===================================================

import type { WorkerDefinition } from "@/core/queue/types";

export const emailNotificationWorker: WorkerDefinition = {
  jobType: "notification.email",
  name: "Email Notification Worker",
  description: "Sends email notifications to users",
  maxRetries: 5,
  concurrency: 5,
  handle: async (job) => {
    const { userId, email, template, data } = job.payload as any;

    if (!email || !template) {
      throw new Error("email and template are required");
    }

    // Future: Send email via email service
    // await emailService.send({ to: email, template, data });

    console.log(`[worker:notification] Sending email to ${email}: ${template}`);
  },
};

export const pushNotificationWorker: WorkerDefinition = {
  jobType: "notification.push",
  name: "Push Notification Worker",
  description: "Sends push notifications to users",
  maxRetries: 3,
  concurrency: 10,
  handle: async (job) => {
    const { userId, title, body } = job.payload as any;

    if (!userId || !title) {
      throw new Error("userId and title are required");
    }

    // Future: Send push notification
    // await pushService.send({ userId, title, body });

    console.log(`[worker:notification] Sending push to ${userId}: ${title}`);
  },
};