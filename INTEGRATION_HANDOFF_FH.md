# Flying Hanuman → OneBooking Dashboard Integration Guide

This document explains how to integrate the Flying Hanuman website with the OneBooking Dashboard for booking synchronization.

---

## Overview

When a customer completes a booking on Flying Hanuman, the booking data must be sent to the OneBooking Dashboard via API. This allows centralized booking management across all Hanuman brands.

---

## API Endpoint

```
POST https://db.onebooking.co/api/bookings/sync
```

### Authentication

Include the API key in the request header:

```
X-API-Key: fh_sk_live_[YOUR_API_KEY]
```

> **Note:** The API key will be provided by the OneBooking admin. Request it before implementing.

---

## Environment Variables (Add to Flying Hanuman Vercel)

```env
ONEBOOKING_API_URL=https://db.onebooking.co
ONEBOOKING_API_KEY=fh_sk_live_[PROVIDED_BY_ADMIN]
WEBSITE_ID=flying-hanuman
```

---

## Payload Structure

Send this JSON payload when a booking is created:

```typescript
interface BookingSyncPayload {
  event: "booking.created" | "booking.updated" | "booking.cancelled";
  source_booking_id: string;      // Your database booking UUID
  booking_ref: string;            // e.g., "FH-000001"
  package_name: string;           // e.g., "Zipline Adventure"
  package_price: number;          // Base price per person
  activity_date: string;          // ISO date: "2026-02-25"
  time_slot: string;              // e.g., "10:00 AM"
  guest_count: number;            // Number of players
  total_amount: number;           // Final amount charged
  discount_amount?: number;       // Discount applied (default: 0)
  currency?: string;              // Default: "THB"
  status: string;                 // "pending" | "confirmed" | "completed" | "cancelled"
  customer: {
    name: string;                 // Full name
    email: string;                // Required
    phone?: string;               // With country code
    country_code?: string;        // e.g., "TH", "US"
    special_requests?: string;    // Customer notes
  };
  transport?: {
    type: "hotel_pickup" | "self_arrange" | "private";
    hotel_name?: string;
    room_number?: string;
    non_players?: number;         // Non-participating guests
    private_passengers?: number;  // For private transfer
    cost?: number;                // Transport cost
  };
  addons?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  stripe_payment_intent_id?: string;
  created_at?: string;            // ISO timestamp
}
```

---

## Example Implementation

### 1. Create Sync Library (`lib/onebooking/sync.ts`)

```typescript
interface SyncResult {
  success: boolean;
  bookingId?: string;
  error?: string;
  code?: string;
}

export async function syncBookingToOneBooking(
  bookingData: BookingSyncPayload
): Promise<SyncResult> {
  const apiUrl = process.env.ONEBOOKING_API_URL;
  const apiKey = process.env.ONEBOOKING_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log("[OneBooking] Sync skipped - not configured");
    return { success: false, error: "OneBooking not configured" };
  }

  // Validate required fields
  if (!bookingData.customer?.email) {
    return { success: false, error: "Customer email required", code: "MISSING_CUSTOMER_EMAIL" };
  }

  try {
    const response = await fetch(`${apiUrl}/api/bookings/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[OneBooking] Sync failed:", result);
      return {
        success: false,
        error: result.error || "Sync failed",
        code: result.code,
      };
    }

    console.log("[OneBooking] Booking synced:", result.data?.booking_id);
    return {
      success: true,
      bookingId: result.data?.booking_id,
    };
  } catch (error) {
    console.error("[OneBooking] Sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### 2. Call After Successful Payment (Stripe Webhook)

In your Stripe webhook handler (`app/api/webhooks/stripe/route.ts`):

```typescript
import { syncBookingToOneBooking } from "@/lib/onebooking/sync";

// After booking is created in your database...
case "checkout.session.completed": {
  // ... your existing booking creation logic ...
  
  // Sync to OneBooking (non-blocking)
  syncBookingToOneBooking({
    event: "booking.created",
    source_booking_id: booking.id,  // Your UUID
    booking_ref: booking.booking_ref,
    package_name: booking.package_name,
    package_price: booking.package_price,
    activity_date: booking.activity_date,
    time_slot: booking.time_slot,
    guest_count: booking.guest_count,
    total_amount: booking.total_amount,
    discount_amount: booking.discount_amount || 0,
    currency: "THB",
    status: "confirmed",
    customer: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone || undefined,
      country_code: customer.country_code || undefined,
      special_requests: customer.special_requests || undefined,
    },
    transport: booking.transport_type ? {
      type: booking.transport_type,
      hotel_name: booking.hotel_name || undefined,
      room_number: booking.room_number || undefined,
      non_players: booking.non_players || 0,
      cost: booking.transport_cost || 0,
    } : undefined,
    addons: booking.addons || [],
    stripe_payment_intent_id: session.payment_intent as string,
    created_at: new Date().toISOString(),
  }).catch(err => {
    console.error("[Stripe Webhook] OneBooking sync error:", err);
  });
  
  break;
}
```

---

## Important Notes

### 1. Booking Reference Format
Use `FH-XXXXXX` format for Flying Hanuman bookings (e.g., `FH-000001`).

### 2. Source Booking ID
This must be a valid UUID from your database. It's used for duplicate detection.

### 3. Customer Email Required
The `customer.email` field is mandatory. Sync will fail without it.

### 4. Non-Blocking Sync
Always run the sync asynchronously (don't await or use `.catch()`). The booking should succeed even if OneBooking sync fails.

### 5. Duplicate Detection
If you send `booking.created` for an existing `source_booking_id`, you'll get a `DUPLICATE_BOOKING` error. Use `booking.updated` for updates.

### 6. Supabase Relations
If using Supabase with `select(*, relation(*))`, the relation might return as an array. Handle this:

```typescript
const customer = Array.isArray(booking.booking_customers) 
  ? booking.booking_customers[0] 
  : booking.booking_customers;
```

---

## API Response Codes

| Status | Code | Meaning |
|--------|------|---------|
| 201 | - | Booking created successfully |
| 200 | - | Booking updated successfully |
| 400 | `INVALID_PAYLOAD` | Missing required fields |
| 401 | `AUTH_FAILED` | Invalid API key |
| 409 | `DUPLICATE_BOOKING` | Booking already exists |
| 500 | `SERVER_ERROR` | Internal server error |

---

## Testing

1. Create a test booking on Flying Hanuman
2. Check OneBooking Dashboard at https://db.onebooking.co/bookings
3. Filter by "FH Bookings" in the sidebar
4. Verify all fields appear correctly

---

## What OneBooking Dashboard Does

When it receives your booking:
1. Stores it in the central database
2. Sends a LINE notification to the admin group chat
3. Makes it available for management (status updates, pickup time, etc.)
4. Emails can be sent to customers from `support@flyinghanuman.com`

---

## Contact

If you encounter issues with the sync API, check:
1. Vercel runtime logs for error messages
2. The `sync_logs` table in OneBooking Supabase for detailed logs

---

*Last updated: February 2026*
