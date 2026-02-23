# OneBooking Dashboard - Hanuman Luge Ticket Display Update

## Overview

Hanuman Luge uses a **ticket-based booking model** instead of the traditional activity/package-based model. The admin bookings table needs to display ticket types (1 Ride, 2 Rides, 3 Rides, Doubling) instead of Players/Non-Players/Add-ons columns.

## What Changed

### Old Model (Activity-Based)
- Players count
- Non-Players count  
- Add-ons list (generic)

### New Model (Ticket-Based for Hanuman Luge)
- **1 Ride** - Single ride tickets (฿790 each)
- **2 Rides** - Two ride tickets (฿890 each)
- **3 Rides** - Three ride tickets (฿990 each)
- **Doubling** - Doubling ride tickets (฿390 each)
- **Total** - Total ticket count

## Database Structure

Ticket information is stored in the `booking_addons` table with:

```sql
booking_addons (
  id UUID,
  booking_id UUID,
  addon_id UUID NULL,        -- NULL for Luge tickets
  addon_name TEXT,           -- Contains ticket type name (e.g., "1 Ride Ticket", "2 Rides Ticket")
  quantity INTEGER,
  unit_price DECIMAL,
  created_at TIMESTAMP
)
```

### Ticket Name Values in `addon_name` Column:
- `"1 Ride Ticket"` - 1 Ride
- `"2 Rides Ticket"` - 2 Rides  
- `"3 Rides Ticket"` - 3 Rides
- `"Doubling Ride"` - Doubling

## API Query Update

When fetching bookings, include `addon_name` in the select:

```typescript
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    packages (name),
    booking_customers (...),
    booking_transport (...),
    booking_addons (quantity, addon_name, unit_price, promo_addons (name))
  `)
```

## Frontend Helper Function

Add this helper to extract ticket counts from booking addons:

```typescript
interface BookingAddon {
  quantity: number;
  addon_name?: string | null;
  promo_addons?: { name: string } | null;
}

const getTicketCounts = (addons: BookingAddon[]) => {
  const counts = { ride1: 0, ride2: 0, ride3: 0, doubling: 0 };
  
  if (!addons || addons.length === 0) return counts;
  
  addons.forEach(addon => {
    const name = (addon.addon_name || addon.promo_addons?.name || '').toLowerCase();
    const qty = addon.quantity || 0;
    
    if (name.includes('1 ride') || name.includes('1-ride')) {
      counts.ride1 += qty;
    } else if (name.includes('2 ride') || name.includes('2-ride')) {
      counts.ride2 += qty;
    } else if (name.includes('3 ride') || name.includes('3-ride')) {
      counts.ride3 += qty;
    } else if (name.includes('doubling')) {
      counts.doubling += qty;
    }
  });
  
  return counts;
};
```

## Table Column Changes

### Remove These Columns:
- PLAYERS
- NON-PLAYERS
- ADD-ONS (the old generic add-ons display)

### Add These Columns:

```tsx
<th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
  1 Ride
</th>
<th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
  2 Rides
</th>
<th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
  3 Rides
</th>
<th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
  Doubling
</th>
<th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">
  Total
</th>
```

### Table Body Cells:

```tsx
{/* Inside the map for each booking row */}
const ticketCounts = getTicketCounts(booking.booking_addons || []);

{/* 1 Ride Column */}
<td className="px-4 py-3 whitespace-nowrap text-center">
  {ticketCounts.ride1 > 0 ? (
    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-sm font-bold bg-blue-100 text-blue-700 rounded-lg">
      {ticketCounts.ride1}
    </span>
  ) : (
    <span className="text-xs text-slate-300">-</span>
  )}
</td>

{/* 2 Rides Column */}
<td className="px-4 py-3 whitespace-nowrap text-center">
  {ticketCounts.ride2 > 0 ? (
    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-sm font-bold bg-green-100 text-green-700 rounded-lg">
      {ticketCounts.ride2}
    </span>
  ) : (
    <span className="text-xs text-slate-300">-</span>
  )}
</td>

{/* 3 Rides Column */}
<td className="px-4 py-3 whitespace-nowrap text-center">
  {ticketCounts.ride3 > 0 ? (
    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-sm font-bold bg-purple-100 text-purple-700 rounded-lg">
      {ticketCounts.ride3}
    </span>
  ) : (
    <span className="text-xs text-slate-300">-</span>
  )}
</td>

{/* Doubling Column */}
<td className="px-4 py-3 whitespace-nowrap text-center">
  {ticketCounts.doubling > 0 ? (
    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-1 text-sm font-bold bg-orange-100 text-orange-700 rounded-lg">
      {ticketCounts.doubling}
    </span>
  ) : (
    <span className="text-xs text-slate-300">-</span>
  )}
</td>

{/* Total Column */}
<td className="px-4 py-3 whitespace-nowrap text-center">
  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 text-sm font-bold bg-slate-800 text-white rounded-lg">
    {booking.guest_count}
  </span>
</td>
```

## Color Coding Reference

| Ticket Type | Background | Text Color |
|-------------|------------|------------|
| 1 Ride | `bg-blue-100` | `text-blue-700` |
| 2 Rides | `bg-green-100` | `text-green-700` |
| 3 Rides | `bg-purple-100` | `text-purple-700` |
| Doubling | `bg-orange-100` | `text-orange-700` |
| Total | `bg-slate-800` | `text-white` |

## Package Display

For Hanuman Luge bookings, `packages` will be `null` since tickets are used instead. Display "Luge Tickets" as fallback:

```tsx
<td className="px-4 py-3 whitespace-nowrap">
  <p className="text-sm text-slate-800">
    {booking.packages?.name || 'Luge Tickets'}
  </p>
</td>
```

## Time Slot Display

Hanuman Luge uses "Open" time slots (flexible arrival):

```tsx
<p className="text-xs text-slate-500">
  {booking.time_slot === 'flexible' || booking.time_slot === 'Open' ? 'Open' : booking.time_slot}
</p>
```

## Summary

1. Update API to include `addon_name` in booking_addons select
2. Add `getTicketCounts` helper function
3. Replace Players/Non-Players/Add-ons columns with 1 Ride/2 Rides/3 Rides/Doubling/Total
4. Use color-coded badges for each ticket type
5. Handle null packages by showing "Luge Tickets"
6. Handle "Open" time slots
