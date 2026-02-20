"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsUpDownIcon,
  HotelIcon,
  CarIcon,
  MapPinIcon,
  TagIcon,
  GiftIcon,
} from "@/components/ui/icons";
import { BookingEditModal } from "./booking-edit-modal";
import type { Booking } from "@/types";

interface BookingsTableProps {
  bookings: Booking[];
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
  partially_refunded: "bg-orange-100 text-orange-800",
  no_show: "bg-orange-100 text-orange-800",
};

const transportConfig: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  hotel_pickup: { label: "Hotel Pickup", color: "text-blue-600 bg-blue-50", Icon: HotelIcon },
  private: { label: "Private", color: "text-purple-600 bg-purple-50", Icon: CarIcon },
  self_arrange: { label: "Self Transfer", color: "text-slate-600 bg-slate-50", Icon: MapPinIcon },
};

export function BookingsTable({ bookings, sortField, sortDirection }: BookingsTableProps) {
  const router = useRouter();
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const handleSort = (field: string) => {
    const params = new URLSearchParams(window.location.search);
    const currentField = params.get("sort_field");
    const currentDir = params.get("sort_dir");

    if (currentField === field) {
      if (currentDir === "asc") {
        params.set("sort_dir", "desc");
      } else {
        params.delete("sort_field");
        params.delete("sort_dir");
      }
    } else {
      params.set("sort_field", field);
      params.set("sort_dir", "asc");
    }

    router.push(`?${params.toString()}`);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="w-3 h-3 text-slate-300" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="w-3 h-3 text-[#1a237e]" />
    ) : (
      <ArrowDownIcon className="w-3 h-3 text-[#1a237e]" />
    );
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <p className="text-slate-500 text-lg">No bookings found</p>
        <p className="text-slate-400 text-sm mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                <SortableHeader field="booking_ref">Booking Ref</SortableHeader>
                <SortableHeader field="created_at">Booked On</SortableHeader>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Package</th>
                <SortableHeader field="activity_date">Play Date</SortableHeader>
                <SortableHeader field="guest_count">Players</SortableHeader>
                <th className="px-4 py-3">Non-Players</th>
                <th className="px-4 py-3">Transport</th>
                <th className="px-4 py-3">Hotel / Room</th>
                <th className="px-4 py-3">Add-ons</th>
                <SortableHeader field="total_amount">Amount</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const transport = booking.transport_type
                  ? transportConfig[booking.transport_type]
                  : null;

                return (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-sm font-medium text-[#1a237e] hover:underline"
                      >
                        {booking.booking_ref}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-800">
                        {new Date(booking.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Bangkok",
                        })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(booking.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Bangkok",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {booking.customer_name}
                      </p>
                      <p className="text-xs text-slate-500">{booking.customer_email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-800">{booking.package_name}</p>
                      <p className="text-xs text-slate-500">
                        {booking.currency} {booking.package_price?.toLocaleString() || "0"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-800">
                        {new Date(booking.activity_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-500">{booking.time_slot}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-slate-800">
                        {booking.guest_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-slate-500">
                        {booking.non_players > 0 ? booking.non_players : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {transport ? (
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${transport.color}`}
                          >
                            <transport.Icon className="w-3.5 h-3.5" />
                            {transport.label}
                          </span>
                          {(booking.guest_count > 0 || booking.non_players > 0) && (
                            <p className="text-xs text-slate-500">
                              Pickup: {booking.guest_count + (booking.non_players || 0)} pax
                            </p>
                          )}
                        </div>
                      ) : booking.transport_type === "self_arrange" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-slate-600 bg-slate-50">
                          <MapPinIcon className="w-3.5 h-3.5" />
                          Self Transfer
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {booking.hotel_name ? (
                        <div>
                          <p className="text-sm text-slate-800">{booking.hotel_name}</p>
                          {booking.room_number && (
                            <p className="text-xs text-slate-500">
                              Room: {booking.room_number}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {booking.addons && booking.addons.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {booking.addons.map((addon, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-medium"
                            >
                              <GiftIcon className="w-3 h-3" />
                              {addon.quantity > 1 && `${addon.quantity}x `}
                              {addon.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {booking.currency} {booking.total_amount.toLocaleString()}
                      </p>
                      {booking.discount_amount > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <TagIcon className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600">
                            -{booking.currency} {booking.discount_amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          statusColors[booking.status] || "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingBooking(booking)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-xs font-medium"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-[#1a237e] hover:bg-[#1a237e]/10 rounded-lg transition-colors text-xs font-medium"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
        />
      )}
    </>
  );
}
