# OneBooking Dashboard - Bookings UI Specification

This document provides detailed specifications for implementing the Bookings page in the OneBooking Central Dashboard, matching the design and functionality of Hanuman World's admin panel.

## Overview

The OneBooking Dashboard is a central booking management system that aggregates bookings from multiple source websites (Hanuman World, Flying Hanuman, Hanuman Luge, etc.). The bookings table should match the quality and functionality of the source websites' admin panels.

---

## 1. Sidebar Navigation Changes

### Current Issue
The sidebar shows a generic "Bookings" link.

### Required Changes
Separate bookings by brand/website in the sidebar:

```
Dashboard
─────────────────
HW Bookings      (Hanuman World)
FH Bookings      (Flying Hanuman)
HL Bookings      (Hanuman Luge)
[Add more brands as needed]
─────────────────
Websites
Sync Logs
Settings
```

### Implementation
- Each booking entry in the database has a `website_id` field
- Create separate sidebar links that filter by `website_id`
- Use brand prefixes: HW = Hanuman World, FH = Flying Hanuman, HL = Hanuman Luge
- Consider using brand colors for visual distinction

---

## 2. Table Columns (REQUIRED)

The bookings table must include ALL of the following columns:

| Column | Description | Sortable | Format |
|--------|-------------|----------|--------|
| **Booking Ref** | Unique booking reference (e.g., HW-000027) | ✅ | Text, bold, primary color |
| **Booked On** | When the booking was created | ✅ | Date + Time (GMT+7) |
| **Customer** | Customer name and email | ❌ | Name (bold) + Email (smaller) |
| **Package** | Package/product name | ❌ | Text |
| **Play Date** | Activity date | ✅ | Date + Time slot |
| **Players** | Number of guests/players | ✅ | Number (centered) |
| **Non-Players** | Non-participating guests | ❌ | Number or "-" if none |
| **Transport** | Transport type with icon | ❌ | Badge with icon |
| **Hotel / Room** | Hotel name and room number | ❌ | Hotel name + Room # |
| **Add-ons** | Purchased add-ons | ❌ | Badges with quantity |
| **Amount** | Total paid amount | ✅ | Currency + Promo code info |
| **Status** | Booking status | ✅ | Colored badge |
| **Actions** | Edit and View buttons | ❌ | Buttons |

### Column Details

#### Booking Ref
```tsx
<span className="text-sm font-medium text-[#1a237e]">
  {booking.booking_ref}
</span>
```

#### Booked On (Created At)
```tsx
<div>
  <p className="text-sm text-slate-800">
    {new Date(booking.created_at).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'Asia/Bangkok'
    })}
  </p>
  <p className="text-xs text-slate-500">
    {new Date(booking.created_at).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    })} (GMT+7)
  </p>
</div>
```

#### Customer
```tsx
<div>
  <p className="text-sm font-medium text-slate-800">
    {customer.name}
  </p>
  <p className="text-xs text-slate-500">{customer.email}</p>
</div>
```

#### Play Date
```tsx
<div>
  <p className="text-sm text-slate-800">
    {new Date(booking.activity_date).toLocaleDateString()}
  </p>
  <p className="text-xs text-slate-500">{booking.time_slot}</p>
</div>
```

#### Transport Type
Display with appropriate icon and color:
- **Hotel Pickup**: Blue badge, Hotel icon
- **Private**: Purple badge, Car icon
- **Self Transfer**: Gray badge, MapPin icon

```tsx
const getTransportLabel = (type: string) => {
  switch (type) {
    case 'hotel_pickup':
      return { label: 'Hotel Pickup', icon: Hotel, color: 'text-blue-600 bg-blue-50' };
    case 'private':
      return { label: 'Private', icon: Car, color: 'text-purple-600 bg-purple-50' };
    case 'self_arrange':
      return { label: 'Self Transfer', icon: MapPin, color: 'text-slate-600 bg-slate-50' };
    default:
      return { label: type, icon: MapPin, color: 'text-slate-600 bg-slate-50' };
  }
};
```

#### Amount with Promo Code
```tsx
<div>
  <p className="text-sm font-medium text-slate-800">
    {formatCurrency(booking.total_amount)}
  </p>
  {booking.promo_code && booking.discount_amount > 0 && (
    <div className="flex items-center gap-1 mt-0.5">
      <Tag className="w-3 h-3 text-green-600" />
      <span className="text-xs font-medium text-green-600">
        {booking.promo_code}
      </span>
      <span className="text-xs text-green-500">
        ({booking.discount_type === 'percentage' 
          ? `${booking.discount_value}% OFF`
          : `-฿${booking.discount_value}`
        })
      </span>
    </div>
  )}
</div>
```

#### Status Badge
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    case 'partially_refunded':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

<span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
  {booking.status}
</span>
```

---

## 3. Filters & Search (REQUIRED)

### Search Box
- Full-text search across: booking_ref, customer name, email, hotel name
- Placeholder: "Search by booking ref, customer name, or email..."
- Icon: Search icon on the left

### Status Filter (Dropdown)
Options:
- All Status
- Pending
- Confirmed
- Cancelled
- Completed
- Refunded

### Date Range Filter
Two modes:
1. **Booking Date** - Filter by `created_at`
2. **Play Date** - Filter by `activity_date`

Include:
- Toggle buttons to switch between modes
- Date pickers for "From" and "To"
- Clear button to reset date filters

```tsx
<div className="flex items-center gap-3">
  <div className="flex rounded-lg border border-slate-200 overflow-hidden">
    <button
      onClick={() => setDateFilterType('booking')}
      className={`px-3 py-1.5 text-sm font-medium ${
        dateFilterType === 'booking'
          ? 'bg-[#1a237e] text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      Booking Date
    </button>
    <button
      onClick={() => setDateFilterType('play')}
      className={`px-3 py-1.5 text-sm font-medium ${
        dateFilterType === 'play'
          ? 'bg-[#1a237e] text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      Play Date
    </button>
  </div>
  
  <input type="date" value={dateFrom} onChange={...} />
  <input type="date" value={dateTo} onChange={...} />
  
  {(dateFrom || dateTo) && (
    <button onClick={clearDateFilters}>
      <X className="w-4 h-4" />
      Clear
    </button>
  )}
</div>
```

### Website Filter (NEW - OneBooking Specific)
Since this is a central dashboard, add a website/brand filter:
- All Websites
- Hanuman World (HW)
- Flying Hanuman (FH)
- Hanuman Luge (HL)
- [Other websites]

---

## 4. Sorting

Enable sorting on these columns (click header to toggle):
- Booking Ref (ascending/descending)
- Booked On (ascending/descending) - default: descending
- Play Date (ascending/descending)
- Players (ascending/descending)
- Amount (ascending/descending)
- Status (ascending/descending)

### Sort Icons
```tsx
const SortIcon = ({ field }: { field: SortField }) => {
  if (sortField !== field) {
    return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
  }
  return sortDirection === 'asc' 
    ? <ArrowUp className="w-3 h-3 text-[#1a237e]" />
    : <ArrowDown className="w-3 h-3 text-[#1a237e]" />;
};
```

---

## 5. Pagination

Include:
- "Showing X to Y of Z bookings" text
- Page size selector: 10, 25, 50, 100
- Previous/Next buttons
- Current page indicator "Page X of Y"

```tsx
<div className="flex items-center justify-between p-4 border-t border-slate-100">
  <div className="flex items-center gap-4">
    <p className="text-sm text-slate-500">
      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} bookings
    </p>
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">Show:</span>
      <select value={pageSize} onChange={...}>
        {[10, 25, 50, 100].map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <span className="text-sm text-slate-500">per page</span>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
      <ChevronLeft className="w-4 h-4" />
    </button>
    <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

---

## 6. Actions Column

Each row should have:

### Edit Button
Opens a modal to edit:
- Status (dropdown)
- Hotel Name (text input)
- Room Number (text input)

```tsx
<button onClick={() => openEditModal(booking)} className="text-orange-600 hover:bg-orange-50">
  <Pencil className="w-4 h-4" />
  Edit
</button>
```

### View Button
Links to booking detail page:
```tsx
<Link href={`/bookings/${booking.id}`} className="text-[#1a237e] hover:bg-[#1a237e]/10">
  <Eye className="w-4 h-4" />
  View
</Link>
```

---

## 7. Export Function

Add an "Export" button in the header that:
- Exports filtered bookings to CSV
- Includes all visible columns
- Names file: `bookings-export-YYYY-MM-DD.csv`

```tsx
<button 
  onClick={handleExport}
  disabled={exporting}
  className="flex items-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-xl"
>
  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
  Export
</button>
```

---

## 8. Edit Modal

When clicking "Edit", show a modal with:

```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
    <div className="p-4 border-b">
      <h3>Edit Booking {booking.booking_ref}</h3>
      <button onClick={closeModal}><X /></button>
    </div>
    
    <div className="p-4 space-y-4">
      {/* Status Dropdown */}
      <div>
        <label>Status</label>
        <select value={status} onChange={...}>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      
      {/* Hotel Name */}
      <div>
        <label>Hotel Name</label>
        <input type="text" value={hotelName} onChange={...} />
      </div>
      
      {/* Room Number */}
      <div>
        <label>Room Number</label>
        <input type="text" value={roomNumber} onChange={...} />
      </div>
    </div>
    
    <div className="p-4 border-t flex justify-end gap-3">
      <button onClick={closeModal}>Cancel</button>
      <button onClick={saveChanges}>
        <Save /> Save Changes
      </button>
    </div>
  </div>
</div>
```

---

## 9. Booking Detail Page

When clicking "View", show a detailed page with:

### Left Column (2/3 width)
1. **Booking Details Card**
   - Date, Time, Guests, Total (in grid format)

2. **Package Card**
   - Package name and price
   - Add-ons list
   - Promo code applied (if any)
   - Price breakdown (subtotal, discount, total)

3. **Transport Card**
   - Transport type
   - Hotel name and room
   - Non-players count

4. **Special Requests Card** (if any)

### Right Column (1/3 width)
1. **Customer Card**
   - Name
   - Email (clickable mailto:)
   - Phone (clickable tel:)

2. **Actions Card**
   - Confirm Booking button (if pending)
   - Send Confirmation Email button
   - Cancel Booking button
   - Process Refund button (if confirmed and has payment)

3. **Refund History Card** (if any refunds)

4. **Admin/OP Notes Card**
   - Textarea for internal notes
   - Save Notes button

5. **Payment Info Card**
   - Stripe Payment Intent ID

---

## 10. Data Structure Expected

The API should return bookings in this format:

```typescript
interface Booking {
  id: string;
  booking_ref: string;
  website_id: string;
  activity_date: string;
  time_slot: string;
  guest_count: number;
  total_amount: number;
  discount_amount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded' | 'partially_refunded';
  created_at: string;
  
  // Related data
  package_name: string;
  package_price: number;
  
  promo_code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  
  customer: {
    name: string;
    email: string;
    phone: string;
    country_code: string;
    special_requests?: string;
  };
  
  transport?: {
    type: 'hotel_pickup' | 'private' | 'self_arrange';
    hotel_name?: string;
    room_number?: string;
    non_players: number;
    private_passengers?: number;
    transport_cost: number;
  };
  
  addons: Array<{
    name: string;
    quantity: number;
    unit_price: number;
  }>;
  
  stripe_payment_intent_id?: string;
  admin_notes?: string;
}
```

---

## 11. Design System

### Colors
- Primary: `#1a237e` (deep indigo)
- Background: `slate-100` for page, `white` for cards
- Text: `slate-800` for headings, `slate-500` for secondary

### Components
- Cards: `rounded-2xl shadow-sm` with `p-6` padding
- Buttons: `rounded-xl` with hover states
- Inputs: `rounded-xl` with focus border color
- Badges: `rounded-full` with colored backgrounds

### Icons
Use Lucide React icons consistently:
- Search, Download, ChevronLeft, ChevronRight
- Eye, Pencil, X, Save
- Hotel, Car, MapPin, Gift, Calendar
- Tag (for promo codes)
- ArrowUpDown, ArrowUp, ArrowDown (for sorting)

---

## 12. Sync Back to Source (Important!)

When editing a booking in OneBooking:
1. Save changes to OneBooking database
2. Call the source website's webhook API to sync changes back
3. Log the sync attempt in `sync_logs` table

Refer to `docs/ONEBOOKING_INTEGRATION.md` for the webhook API specification.

---

## Summary Checklist

- [ ] Add brand-specific sidebar navigation (HW Bookings, FH Bookings, etc.)
- [ ] Add all 13 columns to the table
- [ ] Implement search functionality
- [ ] Add status filter dropdown
- [ ] Add date range filter with booking/play date toggle
- [ ] Add website filter (OneBooking specific)
- [ ] Implement column sorting with visual indicators
- [ ] Add pagination with page size options
- [ ] Implement Edit modal with status, hotel, room fields
- [ ] Create detailed View/Detail page
- [ ] Add Export to CSV functionality
- [ ] Style everything to match the design system
- [ ] Implement sync back to source websites on edit
