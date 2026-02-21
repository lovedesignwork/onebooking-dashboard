import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, getApiKeyFromHeaders } from "@/lib/utils/api-auth";
import { sendBookingNotification } from "@/lib/line/notify";
import type { BookingSyncPayload, ApiResponse } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromHeaders(request.headers);
    const website = await validateApiKey(apiKey);

    if (!website) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid API key",
          code: "AUTH_FAILED",
        },
        { status: 401 }
      );
    }

    let payload: BookingSyncPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid JSON payload",
          code: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    const missingFields: string[] = [];
    if (!payload.source_booking_id) missingFields.push("source_booking_id");
    if (!payload.booking_ref) missingFields.push("booking_ref");
    if (!payload.customer?.email) missingFields.push("customer.email");

    if (missingFields.length > 0) {
      console.error("[Sync API] Missing fields:", missingFields, "Payload received:", JSON.stringify(payload, null, 2));
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          code: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    const bookingData = {
      website_id: website.id,
      source_booking_id: payload.source_booking_id,
      booking_ref: payload.booking_ref,
      package_name: payload.package_name,
      package_price: payload.package_price,
      activity_date: payload.activity_date,
      time_slot: payload.time_slot,
      guest_count: payload.guest_count,
      total_amount: payload.total_amount,
      discount_amount: payload.discount_amount || 0,
      currency: payload.currency || "THB",
      status: payload.status || "confirmed",
      customer_name: payload.customer.name,
      customer_email: payload.customer.email,
      customer_phone: payload.customer.phone || null,
      customer_country_code: payload.customer.country_code || null,
      special_requests: payload.customer.special_requests || null,
      transport_type: payload.transport?.type || null,
      hotel_name: payload.transport?.hotel_name || null,
      room_number: payload.transport?.room_number || null,
      non_players: payload.transport?.non_players || 0,
      private_passengers: payload.transport?.private_passengers || 0,
      transport_cost: payload.transport?.cost || 0,
      addons: payload.addons || [],
      stripe_payment_intent_id: payload.stripe_payment_intent_id || null,
      source_created_at: payload.created_at || null,
    };

    let booking;
    let eventType: string;

    if (payload.event === "booking.created") {
      const { data: existingBooking } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("website_id", website.id)
        .eq("source_booking_id", payload.source_booking_id)
        .single();

      if (existingBooking) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Booking already exists. Use booking.updated event to update.",
            code: "DUPLICATE_BOOKING",
          },
          { status: 409 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (error) {
        console.error("Error creating booking:", error);
        throw error;
      }

      booking = data;
      eventType = "create";
    } else {
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .update({
          ...bookingData,
          updated_at: new Date().toISOString(),
        })
        .eq("website_id", website.id)
        .eq("source_booking_id", payload.source_booking_id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          const { data: newBooking, error: insertError } = await supabaseAdmin
            .from("bookings")
            .insert(bookingData)
            .select()
            .single();

          if (insertError) throw insertError;
          booking = newBooking;
          eventType = "create";
        } else {
          throw error;
        }
      } else {
        booking = data;
        eventType = payload.event === "booking.cancelled" ? "status_change" : "update";
      }
    }

    await supabaseAdmin.from("sync_logs").insert({
      booking_id: booking.id,
      website_id: website.id,
      direction: "inbound",
      event_type: eventType,
      payload: payload,
      status: "success",
    });

    // Send LINE notification for new bookings (non-blocking)
    if (eventType === "create") {
      sendBookingNotification({
        websiteId: website.id,
        websiteName: website.name,
        bookingRef: payload.booking_ref,
        customerName: payload.customer.name,
        customerEmail: payload.customer.email,
        customerPhone: payload.customer.phone || null,
        packageName: payload.package_name,
        activityDate: payload.activity_date,
        timeSlot: payload.time_slot,
        guestCount: payload.guest_count,
        nonPlayers: payload.transport?.non_players || 0,
        transportType: payload.transport?.type || null,
        hotelName: payload.transport?.hotel_name || null,
        roomNumber: payload.transport?.room_number || null,
        totalAmount: payload.total_amount,
        currency: payload.currency || "THB",
        status: payload.status || "confirmed",
        specialRequests: payload.customer.special_requests || null,
      }).catch((err) => {
        console.error("[Sync API] LINE notification error:", err);
      });
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { booking_id: booking.id },
        message: "Booking synced successfully",
      },
      { status: payload.event === "booking.created" ? 201 : 200 }
    );
  } catch (error) {
    console.error("Sync error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
