import type { Booking } from "@/types";

interface BookingDetailCardProps {
  booking: Booking;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
};

export function BookingDetailCard({ booking }: BookingDetailCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {booking.booking_ref}
          </h2>
          <p className="text-sm text-gray-500">
            {booking.website?.name || booking.website_id}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize border ${
            statusColors[booking.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Customer Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-900">
                {booking.customer_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{booking.customer_email}</p>
            </div>
            {booking.customer_phone && (
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">
                  {booking.customer_country_code} {booking.customer_phone}
                </p>
              </div>
            )}
            {booking.special_requests && (
              <div>
                <p className="text-xs text-gray-500">Special Requests</p>
                <p className="text-sm text-gray-900">{booking.special_requests}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Booking Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Package</p>
              <p className="text-sm font-medium text-gray-900">
                {booking.package_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Activity Date</p>
              <p className="text-sm text-gray-900">
                {new Date(booking.activity_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Time Slot</p>
              <p className="text-sm text-gray-900">{booking.time_slot}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Guests</p>
              <p className="text-sm text-gray-900">{booking.guest_count} guests</p>
            </div>
          </div>
        </div>

        {booking.transport_type && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Transport
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm text-gray-900 capitalize">
                  {booking.transport_type.replace("_", " ")}
                </p>
              </div>
              {booking.hotel_name && (
                <div>
                  <p className="text-xs text-gray-500">Hotel</p>
                  <p className="text-sm text-gray-900">
                    {booking.hotel_name}
                    {booking.room_number && ` (Room ${booking.room_number})`}
                  </p>
                </div>
              )}
              {booking.non_players > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Non-Players</p>
                  <p className="text-sm text-gray-900">{booking.non_players}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Payment
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Package Price</p>
              <p className="text-sm text-gray-900">
                {booking.currency} {booking.package_price.toLocaleString()} x{" "}
                {booking.guest_count}
              </p>
            </div>
            {booking.discount_amount > 0 && (
              <div>
                <p className="text-xs text-gray-500">Discount</p>
                <p className="text-sm text-green-600">
                  -{booking.currency} {booking.discount_amount.toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {booking.currency} {booking.total_amount.toLocaleString()}
              </p>
            </div>
            {booking.stripe_payment_intent_id && (
              <div>
                <p className="text-xs text-gray-500">Payment ID</p>
                <p className="text-sm text-gray-600 font-mono">
                  {booking.stripe_payment_intent_id}
                </p>
              </div>
            )}
          </div>
        </div>

        {booking.addons && booking.addons.length > 0 && (
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Add-ons
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {booking.addons.map((addon, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                  <p className="text-xs text-gray-500">
                    {addon.quantity} x {booking.currency}{" "}
                    {addon.unit_price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
