import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import crypto from "crypto";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const supabase = await createClient();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, website:websites(*)")
      .eq("id", id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.website?.webhook_url) {
      return NextResponse.json(
        { success: false, error: "Website has no webhook URL configured" },
        { status: 400 }
      );
    }

    const webhookPayload = {
      event: "booking.updated",
      source_booking_id: booking.source_booking_id,
      updated_fields: ["status", "hotel_name", "room_number", "activity_date", "time_slot", "guest_count", "special_requests", "admin_notes"],
      data: {
        status: booking.status,
        hotel_name: booking.hotel_name,
        room_number: booking.room_number,
        activity_date: booking.activity_date,
        time_slot: booking.time_slot,
        guest_count: booking.guest_count,
        special_requests: booking.special_requests,
        admin_notes: booking.admin_notes,
      },
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (booking.website.webhook_secret) {
      const signature = crypto
        .createHmac("sha256", booking.website.webhook_secret)
        .update(JSON.stringify(webhookPayload))
        .digest("hex");
      headers["X-OneBooking-Signature"] = signature;
    }

    const webhookResponse = await fetch(booking.website.webhook_url, {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload),
    });

    const syncStatus = webhookResponse.ok ? "success" : "failed";
    const errorMessage = !webhookResponse.ok
      ? `HTTP ${webhookResponse.status}: ${await webhookResponse.text().catch(() => "Unknown error")}`
      : null;

    await supabase.from("sync_logs").insert({
      booking_id: booking.id,
      website_id: booking.website_id,
      direction: "outbound",
      event_type: "booking.updated",
      payload: webhookPayload,
      status: syncStatus,
      error_message: errorMessage,
    });

    if (!webhookResponse.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to sync: ${errorMessage}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Changes synced to source website",
    });
  } catch (error) {
    console.error("Sync to source error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
