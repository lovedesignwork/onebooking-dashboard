# Hanuman Luge → OneBooking Dashboard Integration Guide

This document explains how to integrate the Hanuman Luge website with the OneBooking Dashboard for booking synchronization.

---

## Overview

Hanuman Luge is a **ticket-based activity** (not player-based like zipline tours). Customers purchase ride tickets in quantities:
- 1 Ride Ticket
- 2 Rides Ticket  
- 3 Rides Ticket

A single order can contain multiple ticket types with different quantities. Transport is typically **not included** unless the customer chooses "Private Pickup" as an add-on.

---

## API Endpoint

```
POST https://db.onebooking.co/api/bookings/sync
```

### Authentication

Include the API key in the request header:

```
X-API-Key: hl_sk_live_[YOUR_API_KEY]
```

> **Note:** Get the API key from OneBooking Dashboard → Websites → Hanuman Luge → View Details

---

## Environment Variables (Add to Hanuman Luge Vercel)

```env
ONEBOOKING_API_URL=https://db.onebooking.co
ONEBOOKING_API_KEY=hl_sk_live_[PROVIDED_BY_ADMIN]
WEBSITE_ID=hanuman-luge
```

---

## Payload Structure for Ticket-Based Bookings

Since Hanuman Luge sells tickets (not activity slots with players), structure the payload like this:

```typescript
interface BookingSyncPayload {
  event: "booking.created" | "booking.updated" | "booking.cancelled";
  source_booking_id: string;      // Your database booking UUID
  booking_ref: string;            // e.g., "HL-000001"
  
  // For ticket-based: Use a generic package name
  package_name: string;           // e.g., "Luge Tickets" or "Luge Ride Tickets"
  package_price: number;          // Can be 0 or average price
  
  activity_date: string;          // ISO date: "2026-02-25"
  time_slot: string;              // e.g., "Open" or specific time if applicable
  
  // IMPORTANT: guest_count = TOTAL number of tickets purchased
  guest_count: number;            // Sum of all ticket quantities
  
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
  
  // IMPORTANT: For Luge, transport is typically "none"
  transport?: {
    type: "none" | "private";     // "none" by default, "private" if they add private pickup
    hotel_name?: string;          // Only if private pickup
    room_number?: string;
    cost?: number;                // Private pickup cost
  };
  
  // IMPORTANT: Put ticket types in addons array
  addons: Array<{
    name: string;                 // e.g., "1 Ride Ticket", "2 Rides Ticket", "3 Rides Ticket"
    quantity: number;             // How many of this ticket type
    unit_price: number;           // Price per ticket of this type
  }>;
  
  stripe_payment_intent_id?: string;
  created_at?: string;            // ISO timestamp
}
```

---

## Example Payload

Customer purchases:
- 5x "1 Ride Ticket" @ 350 THB each = 1,750 THB
- 2x "2 Rides Ticket" @ 600 THB each = 1,200 THB  
- 7x "3 Rides Ticket" @ 800 THB each = 5,600 THB
- Total: 14 tickets, 8,550 THB

```json
{
  "event": "booking.created",
  "source_booking_id": "550e8400-e29b-41d4-a716-446655440000",
  "booking_ref": "HL-000001",
  "package_name": "Luge Tickets",
  "package_price": 0,
  "activity_date": "2026-02-25",
  "time_slot": "Open",
  "guest_count": 14,
  "total_amount": 8550,
  "discount_amount": 0,
  "currency": "THB",
  "status": "confirmed",
  "customer": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+66812345678",
    "country_code": "TH",
    "special_requests": "Need wheelchair access"
  },
  "transport": {
    "type": "none"
  },
  "addons": [
    { "name": "1 Ride Ticket", "quantity": 5, "unit_price": 350 },
    { "name": "2 Rides Ticket", "quantity": 2, "unit_price": 600 },
    { "name": "3 Rides Ticket", "quantity": 7, "unit_price": 800 }
  ],
  "stripe_payment_intent_id": "pi_xxx",
  "created_at": "2026-02-20T10:30:00Z"
}
```

---

## Example with Private Pickup Add-on

If customer adds private pickup:

```json
{
  "event": "booking.created",
  "source_booking_id": "550e8400-e29b-41d4-a716-446655440001",
  "booking_ref": "HL-000002",
  "package_name": "Luge Tickets",
  "package_price": 0,
  "activity_date": "2026-02-25",
  "time_slot": "Open",
  "guest_count": 4,
  "total_amount": 3400,
  "currency": "THB",
  "status": "confirmed",
  "customer": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "transport": {
    "type": "private",
    "hotel_name": "Marriott Phuket",
    "room_number": "305",
    "cost": 1000
  },
  "addons": [
    { "name": "2 Rides Ticket", "quantity": 4, "unit_price": 600 },
    { "name": "Private Pickup", "quantity": 1, "unit_price": 1000 }
  ],
  "stripe_payment_intent_id": "pi_xxx",
  "created_at": "2026-02-20T11:00:00Z"
}
```

---

## Implementation Example

### 1. Create Sync Library (`lib/onebooking/sync.ts`)

```typescript
interface SyncResult {
  success: boolean;
  bookingId?: string;
  error?: string;
  code?: string;
}

interface TicketItem {
  name: string;        // "1 Ride Ticket", "2 Rides Ticket", etc.
  quantity: number;
  unit_price: number;
}

export async function syncBookingToOneBooking(
  booking: {
    id: string;
    booking_ref: string;
    activity_date: string;
    total_amount: number;
    discount_amount?: number;
    status: string;
    stripe_payment_intent_id?: string;
    created_at: string;
  },
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country_code?: string;
    special_requests?: string;
  },
  tickets: TicketItem[],
  transport?: {
    type: "none" | "private";
    hotel_name?: string;
    room_number?: string;
    cost?: number;
  }
): Promise<SyncResult> {
  const apiUrl = process.env.ONEBOOKING_API_URL;
  const apiKey = process.env.ONEBOOKING_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log("[OneBooking] Sync skipped - not configured");
    return { success: false, error: "OneBooking not configured" };
  }

  // Calculate total tickets
  const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);

  // Build addons array from tickets
  const addons = tickets.map(t => ({
    name: t.name,
    quantity: t.quantity,
    unit_price: t.unit_price,
  }));

  // Add private pickup as addon if applicable
  if (transport?.type === "private" && transport.cost) {
    addons.push({
      name: "Private Pickup",
      quantity: 1,
      unit_price: transport.cost,
    });
  }

  const payload = {
    event: "booking.created",
    source_booking_id: booking.id,
    booking_ref: booking.booking_ref,
    package_name: "Luge Tickets",
    package_price: 0,
    activity_date: booking.activity_date,
    time_slot: "Open",
    guest_count: totalTickets,
    total_amount: booking.total_amount,
    discount_amount: booking.discount_amount || 0,
    currency: "THB",
    status: booking.status,
    customer: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone || undefined,
      country_code: customer.country_code || undefined,
      special_requests: customer.special_requests || undefined,
    },
    transport: {
      type: transport?.type || "none",
      hotel_name: transport?.hotel_name,
      room_number: transport?.room_number,
      cost: transport?.cost,
    },
    addons,
    stripe_payment_intent_id: booking.stripe_payment_intent_id,
    created_at: booking.created_at,
  };

  try {
    const response = await fetch(`${apiUrl}/api/bookings/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
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

```typescript
import { syncBookingToOneBooking } from "@/lib/onebooking/sync";

// In your Stripe webhook handler...
case "checkout.session.completed": {
  // ... your existing booking creation logic ...
  
  // Build tickets array from your order items
  const tickets = orderItems.map(item => ({
    name: item.ticket_type,      // "1 Ride Ticket", "2 Rides Ticket", etc.
    quantity: item.quantity,
    unit_price: item.price,
  }));

  // Sync to OneBooking (non-blocking)
  syncBookingToOneBooking(
    {
      id: booking.id,
      booking_ref: booking.booking_ref,
      activity_date: booking.activity_date,
      total_amount: booking.total_amount,
      discount_amount: booking.discount_amount,
      status: "confirmed",
      stripe_payment_intent_id: session.payment_intent as string,
      created_at: new Date().toISOString(),
    },
    {
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      country_code: customer.country_code,
      special_requests: customer.special_requests,
    },
    tickets,
    hasPrivatePickup ? {
      type: "private",
      hotel_name: booking.hotel_name,
      room_number: booking.room_number,
      cost: privatePickupCost,
    } : { type: "none" }
  ).catch(err => {
    console.error("[Stripe Webhook] OneBooking sync error:", err);
  });
  
  break;
}
```

---

## How It Displays in OneBooking Dashboard

When viewing "HL Bookings" in the dashboard:

| Column | Display |
|--------|---------|
| **Booking Ref** | HL-000001 |
| **Package** | Luge Tickets |
| **Tickets** | 14 (total count) |
| **Non-Players** | - |
| **Transport** | No Transport (or "Private" if selected) |
| **Add-ons** | Badges showing: "5x 1 Ride Ticket", "2x 2 Rides Ticket", "7x 3 Rides Ticket" |
| **Pickup Time** | Only clickable if transport is "private" |
| **Amount** | THB 8,550 |

---

## Important Notes

### 1. Booking Reference Format
Use `HL-XXXXXX` format for Hanuman Luge bookings (e.g., `HL-000001`).

### 2. Transport Type
- Default to `"none"` for most Luge bookings
- Only use `"private"` if customer purchases private pickup add-on
- `"hotel_pickup"` and `"self_arrange"` are NOT typically used for Luge

### 3. Guest Count = Total Tickets
Unlike zipline tours where `guest_count` = number of players, for Luge it represents the **total number of tickets** purchased across all ticket types.

### 4. Ticket Types in Addons
Always put the ticket breakdown in the `addons` array. This allows the dashboard to display exactly what was purchased.

### 5. Customer Email Required
The `customer.email` field is mandatory. Sync will fail without it.

### 6. Non-Blocking Sync
Always run the sync asynchronously (don't await or use `.catch()`). The booking should succeed even if OneBooking sync fails.

### 7. Special Requests / Notes
Include `customer.special_requests` if the customer enters any notes during checkout. This will display in the "Notes" column.

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

1. Create a test booking on Hanuman Luge website
2. Check OneBooking Dashboard at https://db.onebooking.co/bookings
3. Filter by "HL Bookings" in the sidebar
4. Verify:
   - Ticket count shows correctly
   - Add-ons show each ticket type with quantity
   - Transport shows "No Transport" (unless private pickup was added)
   - Customer notes appear in Notes column

---

## What OneBooking Dashboard Does

When it receives your booking:
1. Stores it in the central database
2. Sends a LINE notification to the admin group chat
3. Makes it available for management (status updates, etc.)
4. Pickup time is only available if transport type is "private"
5. Emails can be sent to customers from `support@hanumanluge.com`

---

## Differences from Hanuman World / Flying Hanuman

| Aspect | HW / FH (Activity) | HL (Tickets) |
|--------|-------------------|--------------|
| Package | Specific tour package | "Luge Tickets" (generic) |
| Guest Count | Number of players | Total tickets |
| Time Slot | Specific time | "Open" or flexible |
| Transport | Usually included | Usually "none" |
| Add-ons | Extra services | **Ticket types** + optional private pickup |
| Non-Players | Yes | No (not applicable) |

---

*Last updated: February 2026*
