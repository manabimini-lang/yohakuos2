export interface NotificationDeliveryResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  deliveredAt: string;
  error?: string;
}

export interface NotificationProvider {
  sendNotification(
    userId: string,
    title: string,
    body: string,
    type: "morning" | "evening"
  ): Promise<NotificationDeliveryResult>;
}

export class MockNotificationProvider implements NotificationProvider {
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    type: "morning" | "evening"
  ): Promise<NotificationDeliveryResult> {
    const deliveredAt = new Date().toISOString();
    console.log(`[MockNotificationProvider] Delivered ${type} notification to user ${userId}:`, {
      title,
      body,
      deliveredAt,
    });

    return {
      success: true,
      provider: "mock",
      providerMessageId: `mock-msg-${Date.now()}`,
      deliveredAt,
    };
  }
}

export const defaultNotificationProvider: NotificationProvider = new MockNotificationProvider();
