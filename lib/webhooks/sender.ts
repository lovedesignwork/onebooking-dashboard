import { createClient } from "@supabase/supabase-js";
import { generateWebhookSignature } from "@/lib/utils/signature";
import type { Booking, WebhookPayload } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendWebhookOptions {
  booking: Booking;
  updatedFields: string[];
  updatedBy: string;
}

export async function sendWebhook({
  booking,
  updatedFields,
  updatedBy,
}: SendWebhookOptions): Promise<boolean> {
  const website = booking.website;

  if (!website?.webhook_url || !website?.webhook_secret) {
    console.log("No webhook configured for website:", website?.id);
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const webhookData: Record<string, unknown> = {};
  for (const field of updatedFields) {
    webhookData[field] = booking[field as keyof Booking];
  }

  const payload: WebhookPayload = {
    event: updatedFields.includes("status")
      ? "booking.status_changed"
      : "booking.updated",
    source_booking_id: booking.source_booking_id,
    updated_fields: updatedFields,
    data: webhookData,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(
    payloadString,
    website.webhook_secret,
    timestamp
  );

  await supabaseAdmin.from("sync_logs").insert({
    booking_id: booking.id,
    website_id: website.id,
    direction: "outbound",
    event_type: payload.event,
    payload: payload,
    status: "pending",
  });

  try {
    const response = await fetch(website.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": timestamp,
      },
      body: payloadString,
    });

    const status = response.ok ? "success" : "failed";
    const errorMessage = response.ok
      ? null
      : `HTTP ${response.status}: ${await response.text()}`;

    await supabaseAdmin
      .from("sync_logs")
      .update({
        status,
        error_message: errorMessage,
      })
      .eq("booking_id", booking.id)
      .eq("direction", "outbound")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!response.ok) {
      console.error("Webhook failed:", errorMessage);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Webhook error:", error);

    await supabaseAdmin
      .from("sync_logs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("booking_id", booking.id)
      .eq("direction", "outbound")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    return false;
  }
}
