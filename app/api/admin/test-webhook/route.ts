import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWebhook } from "@/lib/webhooks/sender";
import type { ApiResponse, Booking } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminUser || adminUser.role !== "superadmin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Superadmin only", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.website_id || !body.booking_id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: website_id, booking_id",
          code: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, website:websites(*)")
      .eq("id", body.booking_id)
      .eq("website_id", body.website_id)
      .single();

    if (error || !booking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Booking not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const success = await sendWebhook({
      booking: booking as Booking,
      updatedFields: body.fields || ["status"],
      updatedBy: user.email || "test@onebooking.co",
    });

    return NextResponse.json<ApiResponse>({
      success,
      message: success
        ? "Test webhook sent successfully"
        : "Webhook delivery failed",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
