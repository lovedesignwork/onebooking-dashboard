import Link from "next/link";
import type { Booking } from "@/types";

interface RecentBookingsProps {
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

export function RecentBookings({ bookings }: RecentBookingsProps) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No recent bookings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Bookings
          </h3>
          <Link
            href="/bookings"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Booking Ref</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Package</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link
                    href={`/bookings/${booking.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {booking.booking_ref}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.customer_email}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{booking.package_name}</p>
                  <p className="text-xs text-gray-500">
                    {booking.guest_count} guests
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {new Date(booking.activity_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">{booking.time_slot}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      statusColors[booking.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {booking.currency} {booking.total_amount.toLocaleString()}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
