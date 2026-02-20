import crypto from "crypto";

export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: string
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  return `sha256=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret, timestamp);
  return expectedSignature === signature;
}

export function generateApiKey(prefix: string): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `${prefix}_sk_live_${randomBytes}`;
}

export function generateWebhookSecret(): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `whsec_${randomBytes}`;
}
