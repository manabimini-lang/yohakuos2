export interface SharePayload {
  title: string;
  content: string;
  createdAt: string;
  userName?: string;
}

export interface ShareResult {
  success: boolean;
  error?: string;
}

export interface ShareProvider {
  send(payload: SharePayload): Promise<ShareResult>;
}
