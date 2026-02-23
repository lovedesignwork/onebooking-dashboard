export type UserRole = "superadmin" | "admin" | "staff";

export interface Website {
  id: string;
  name: string;
  domain: string;
  api_key: string;
  webhook_url: string | null;
  webhook_secret: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingAddon {
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Booking {
  id: string;
  website_id: string;
  source_booking_id: string;
  booking_ref: string;
  package_name: string;
  package_price: number;
  activity_date: string;
  time_slot: string;
  guest_count: number;
  adult_count?: number;
  child_count?: number;
  total_amount: number;
  discount_amount: number;
  currency: string;
  status: BookingStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_country_code: string | null;
  special_requests: string | null;
  transport_type: TransportType | null;
  hotel_name: string | null;
  room_number: string | null;
  non_players: number;
  private_passengers: number;
  transport_cost: number;
  addons: BookingAddon[];
  stripe_payment_intent_id: string | null;
  admin_notes: string | null;
  pickup_time: string | null;
  source_created_at: string | null;
  created_at: string;
  updated_at: string;
  website?: Website;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded"
  | "no_show";

export type TransportType = "hotel_pickup" | "self_arrange" | "private" | "none";

export interface SyncLog {
  id: string;
  booking_id: string | null;
  website_id: string | null;
  direction: "inbound" | "outbound";
  event_type: string;
  payload: Record<string, unknown> | null;
  status: "success" | "failed" | "pending";
  error_message: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  allowed_websites: string[] | null;
  created_at: string;
}

export interface BookingSyncPayload {
  event: "booking.created" | "booking.updated" | "booking.cancelled" | "booking.refunded";
  source_booking_id: string;
  booking_ref: string;
  package_name: string;
  package_price: number;
  activity_date: string;
  time_slot: string;
  guest_count?: number;
  adult_count?: number;
  child_count?: number;
  total_amount: number;
  discount_amount?: number;
  currency?: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    country_code?: string;
    special_requests?: string;
  };
  transport?: {
    type: TransportType;
    hotel_name?: string;
    room_number?: string;
    non_players?: number;
    private_passengers?: number;
    cost?: number;
  };
  addons?: BookingAddon[];
  stripe_payment_intent_id?: string;
  created_at?: string;
}

export interface WebhookPayload {
  event: "booking.updated" | "booking.status_changed";
  source_booking_id: string;
  updated_fields: string[];
  data: Record<string, unknown>;
  updated_at: string;
  updated_by: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface BookingFilters {
  website_id?: string;
  status?: BookingStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
