import Link from "next/link";
import { EyeIcon } from "@/components/ui/icons";
import type { Booking } from "@/types";

interface BookingsTableProps {
  bookings: Booking[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
  no_show: "bg-orange-100 text-orange-800",
};

export function BookingsTable({ bookings }: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-500 text-lg">No bookings found</p>
        <p className="text-gray-400 text-sm mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Booking</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Website</th>
              <th className="px-6 py-4">Package</th>
              <th className="px-6 py-4">Activity Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {booking.booking_ref}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">{booking.customer_email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">
                    {booking.website?.name || booking.website_id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{booking.package_name}</p>
                  <p className="text-xs text-gray-500">
                    {booking.guest_count} guest{booking.guest_count > 1 ? "s" : ""}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {new Date(booking.activity_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">{booking.time_slot}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      statusColors[booking.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {booking.currency} {booking.total_amount.toLocaleString()}
                  </p>
                  {booking.discount_amount > 0 && (
                    <p className="text-xs text-green-600">
                      -{booking.currency} {booking.discount_amount.toLocaleString()}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
