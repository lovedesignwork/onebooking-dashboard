import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWebhook } from "@/lib/webhooks/sender";
import type { ApiResponse, Booking } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, website:websites(*)")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Booking not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Booking>>({
      success: true,
      data: booking as Booking,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, website:websites(*)")
      .eq("id", id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Booking not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const updates = await request.json();

    const allowedFields = [
      "status",
      "admin_notes",
      "activity_date",
      "time_slot",
      "guest_count",
      "special_requests",
      "transport_type",
      "hotel_name",
      "room_number",
      "non_players",
      "private_passengers",
    ];

    const filteredUpdates: Record<string, unknown> = {};
    const updatedFields: string[] = [];

    for (const field of allowedFields) {
      if (field in updates && updates[field] !== existingBooking[field]) {
        filteredUpdates[field] = updates[field];
        updatedFields.push(field);
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json<ApiResponse<Booking>>({
        success: true,
        data: existingBooking as Booking,
        message: "No changes detected",
      });
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, website:websites(*)")
      .single();

    if (updateError) {
      console.error("Error updating booking:", updateError);
      throw updateError;
    }

    if (existingBooking.website?.webhook_url) {
      await sendWebhook({
        booking: updatedBooking as Booking,
        updatedFields,
        updatedBy: user.email || "unknown",
      });
    }

    return NextResponse.json<ApiResponse<Booking>>({
      success: true,
      data: updatedBooking as Booking,
      message: "Booking updated successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
