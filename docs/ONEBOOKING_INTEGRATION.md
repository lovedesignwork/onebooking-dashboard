# OneBooking Central Integration Specification

## Overview

This document defines the integration between source booking websites (Hanuman World, Flying Hanuman, Hanuman Luge, etc.) and the **OneBooking Central Dashboard** - a unified booking management system.

### Purpose

- **Centralize all bookings** from multiple adventure park websites into one dashboard
- **Enable team management** from a single location (OneBooking Dashboard)
- **Sync edits bidirectionally** - changes in OneBooking reflect back to source websites
- **Source websites remain read-only** for booking management (view only)

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Hanuman World  │     │ Flying Hanuman  │     │  Hanuman Luge   │
│   (Source A)    │     │   (Source B)    │     │   (Source C)    │
│                 │     │                 │     │                 │
│  Own Supabase   │     │  Own Supabase   │     │  Own Supabase   │
│  Own Blog/CMS   │     │  Own Blog/CMS   │     │  Own Blog/CMS   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  POST /api/bookings/sync                      │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   OneBooking Central    │
                    │   https://db.onebooking.co │
                    │                         │
                    │  - Central Supabase     │
                    │  - All bookings         │
                    │  - Multi-tenant UI      │
                    │  - Team management      │
                    └────────────┬────────────┘
                                 │
                                 │ POST /api/webhooks/onebooking
                                 │ (sync edits back)
                                 ▼
                    ┌─────────────────────────┐
                    │   Source Websites       │
                    │   (receive updates)     │
                    └─────────────────────────┘
```

---

## For OneBooking Dashboard Development

> **This section is for the Cursor agent building the OneBooking Dashboard project**

### Project Context

You are building a **central booking dashboard** that:
1. Receives bookings from multiple source websites via API
2. Stores all bookings in its own Supabase database
3. Provides a multi-tenant admin interface for the operations team
4. Syncs edits back to source websites when bookings are modified

### Tech Stack Requirements

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (for admin users)
- **Deployment**: Vercel or similar

### Initial Requirements

1. **Multi-tenant Dashboard**
   - Filter bookings by website (Hanuman World, Flying Hanuman, etc.)
   - Global view showing all bookings across websites
   - Website management (add/edit source websites)

2. **API Endpoints**
   - `POST /api/bookings/sync` - Receive bookings from source websites
   - `GET /api/bookings` - List bookings with filters
   - `PUT /api/bookings/[id]` - Update booking (triggers sync back)
   - `POST /api/websites` - Register new source website

3. **Admin Authentication**
   - Supabase Auth for admin users
   - Role-based access (superadmin, admin, staff)
   - Some users can see all websites, some only specific ones

4. **Webhook System**
   - When a booking is edited in OneBooking
   - Call the source website's webhook endpoint
   - Include updated fields and new values

---

## Database Schema (OneBooking Central)

### Table: `websites`

Registered source websites that send bookings.

```sql
CREATE TABLE websites (
  id TEXT PRIMARY KEY,                    -- e.g., 'hanuman-world', 'flying-hanuman'
  name TEXT NOT NULL,                     -- e.g., 'Hanuman World Phuket'
  domain TEXT NOT NULL,                   -- e.g., 'hanumanworld.com'
  api_key TEXT NOT NULL UNIQUE,           -- Secret key for authentication
  webhook_url TEXT,                       -- URL to call for sync back
  webhook_secret TEXT,                    -- Secret for signing webhooks
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example data
INSERT INTO websites (id, name, domain, api_key, webhook_url) VALUES
('hanuman-world', 'Hanuman World Phuket', 'hanumanworld.com', 'hw_sk_live_xxxxx', 'https://hanumanworld.com/api/webhooks/onebooking'),
('flying-hanuman', 'Flying Hanuman', 'flyinghanuman.com', 'fh_sk_live_xxxxx', 'https://flyinghanuman.com/api/webhooks/onebooking');
```

### Table: `bookings`

All bookings from all source websites (denormalized).

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source identification
  website_id TEXT NOT NULL REFERENCES websites(id),
  source_booking_id UUID NOT NULL,        -- Original ID from source website
  booking_ref TEXT NOT NULL,              -- e.g., 'HW-000023'
  
  -- Package info (denormalized - stored as values, not FK)
  package_name TEXT NOT NULL,
  package_price INTEGER NOT NULL,
  
  -- Booking details
  activity_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'confirmed',
  
  -- Customer info (denormalized)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_country_code TEXT,
  special_requests TEXT,
  
  -- Transport info
  transport_type TEXT,                    -- 'hotel_pickup', 'self_arrange', 'private'
  hotel_name TEXT,
  room_number TEXT,
  non_players INTEGER DEFAULT 0,
  private_passengers INTEGER DEFAULT 0,
  transport_cost INTEGER DEFAULT 0,
  
  -- Addons (stored as JSONB)
  addons JSONB DEFAULT '[]',
  
  -- Payment info
  stripe_payment_intent_id TEXT,
  
  -- Admin fields
  admin_notes TEXT,
  
  -- Timestamps
  source_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(website_id, source_booking_id)
);

-- Indexes
CREATE INDEX idx_bookings_website_id ON bookings(website_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_activity_date ON bookings(activity_date);
CREATE INDEX idx_bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
```

### Table: `sync_logs`

Track sync events for debugging.

```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  website_id TEXT REFERENCES websites(id),
  direction TEXT NOT NULL,                -- 'inbound' or 'outbound'
  event_type TEXT NOT NULL,               -- 'create', 'update', 'status_change'
  payload JSONB,
  status TEXT DEFAULT 'success',          -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## API Specification

### Authentication

All API requests from source websites must include:

```
Header: X-API-Key: <website_api_key>
```

The API key identifies which website is making the request.

### POST /api/bookings/sync

Receive a new or updated booking from a source website.

**Request:**

```typescript
// Headers
{
  "Content-Type": "application/json",
  "X-API-Key": "hw_sk_live_xxxxx"
}

// Body
{
  "event": "booking.created" | "booking.updated" | "booking.cancelled" | "booking.refunded",
  "source_booking_id": "uuid-from-source-database",
  "booking_ref": "HW-000023",
  "package_name": "World A+",
  "package_price": 3490,
  "activity_date": "2026-03-01",
  "time_slot": "10:00",
  "guest_count": 2,
  "total_amount": 8500,
  "discount_amount": 0,
  "currency": "THB",
  "status": "confirmed",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "country_code": "+66",
    "special_requests": "Vegetarian lunch please"
  },
  "transport": {
    "type": "hotel_pickup",
    "hotel_name": "Marriott Phuket",
    "room_number": "1205",
    "non_players": 1,
    "private_passengers": 0,
    "cost": 0
  },
  "addons": [
    {
      "name": "Photo Package",
      "quantity": 1,
      "unit_price": 500
    },
    {
      "name": "Souvenir T-Shirt",
      "quantity": 2,
      "unit_price": 350
    }
  ],
  "stripe_payment_intent_id": "pi_xxxxxxxxxxxxx",
  "created_at": "2026-02-20T10:30:00Z"
}
```

**Response (Success):**

```json
{
  "success": true,
  "booking_id": "uuid-in-onebooking",
  "message": "Booking synced successfully"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "AUTH_FAILED"
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `AUTH_FAILED` | Invalid or missing API key |
| `INVALID_PAYLOAD` | Request body validation failed |
| `DUPLICATE_BOOKING` | Booking already exists (use update event) |
| `WEBSITE_NOT_FOUND` | Website not registered |
| `SERVER_ERROR` | Internal server error |

---

## Webhook Specification (Sync Back to Source)

When a booking is edited in OneBooking Dashboard, call the source website's webhook.

### POST {website.webhook_url}

**Request:**

```typescript
// Headers
{
  "Content-Type": "application/json",
  "X-Webhook-Signature": "sha256=xxxxxx",  // HMAC signature
  "X-Webhook-Timestamp": "1708444800"
}

// Body
{
  "event": "booking.updated",
  "source_booking_id": "uuid-from-source-database",
  "updated_fields": ["status", "admin_notes"],
  "data": {
    "status": "cancelled",
    "admin_notes": "Customer requested cancellation due to flight change"
  },
  "updated_at": "2026-02-20T15:30:00Z",
  "updated_by": "admin@onebooking.co"
}
```

**Signature Verification:**

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Booking updated"
}
```

---

## Source Website Implementation

### Environment Variables

Each source website needs these environment variables:

```env
# OneBooking Integration
ONEBOOKING_API_URL=https://db.onebooking.co
ONEBOOKING_API_KEY=hw_sk_live_xxxxx
ONEBOOKING_WEBHOOK_SECRET=whsec_xxxxx

# Website identifier
WEBSITE_ID=hanuman-world
```

### Sync Service (lib/onebooking/sync.ts)

Source websites should implement a sync service that:

1. **Pushes bookings** after payment confirmation
2. **Retries failed syncs** with exponential backoff
3. **Logs sync status** for debugging

### Webhook Endpoint (app/api/webhooks/onebooking/route.ts)

Source websites should implement a webhook endpoint that:

1. **Verifies signature** using the shared secret
2. **Updates local booking** with received data
3. **Returns success/failure** response

---

## Sync Events

### Events from Source to OneBooking

| Event | When | Data |
|-------|------|------|
| `booking.created` | Payment confirmed | Full booking data |
| `booking.updated` | Local status change | Updated fields |
| `booking.cancelled` | Booking cancelled | Status + reason |
| `booking.refunded` | Refund processed | Status + amount |

### Events from OneBooking to Source

| Event | When | Data |
|-------|------|------|
| `booking.updated` | Admin edits booking | Changed fields only |
| `booking.status_changed` | Status updated | New status + notes |

---

## Error Handling

### Retry Logic (Source Websites)

If sync to OneBooking fails, implement retry with exponential backoff:

```typescript
const RETRY_DELAYS = [1000, 5000, 30000, 300000]; // 1s, 5s, 30s, 5min

async function syncWithRetry(data: BookingSyncData, attempt = 0): Promise<boolean> {
  try {
    await syncBookingToOneBooking(data);
    return true;
  } catch (error) {
    if (attempt < RETRY_DELAYS.length) {
      await sleep(RETRY_DELAYS[attempt]);
      return syncWithRetry(data, attempt + 1);
    }
    // Log failure for manual intervention
    console.error('Sync failed after all retries:', error);
    return false;
  }
}
```

### Failed Sync Queue

For production, consider implementing a queue (e.g., database table) to store failed syncs for later retry or manual processing.

---

## Security Considerations

1. **API Keys** - Keep secret, rotate periodically
2. **Webhook Signatures** - Always verify before processing
3. **HTTPS Only** - All API calls must use HTTPS
4. **Rate Limiting** - Implement on OneBooking API
5. **Input Validation** - Validate all incoming data

---

## Testing

### Test API Key

For development/testing, use:

```
API Key: test_sk_xxxxx
Website ID: test-website
```

### Test Webhook

OneBooking should provide a way to manually trigger webhooks for testing:

```
POST /api/admin/test-webhook
{
  "website_id": "hanuman-world",
  "booking_id": "uuid",
  "event": "booking.updated"
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-20 | Initial specification |
