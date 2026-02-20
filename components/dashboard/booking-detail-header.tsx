"use client";

import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  GiftIcon,
  HotelIcon,
  CarIcon,
  MapPinIcon,
} from "@/components/ui/icons";
import type { Booking } from "@/types";

interface BookingDetailHeaderProps {
  booking: Booking;
}

const transportConfig: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  hotel_pickup: { label: "Hotel Pickup", color: "bg-blue-100 text-blue-700", Icon: HotelIcon },
  private: { label: "Private Transfer", color: "bg-purple-100 text-purple-700", Icon: CarIcon },
  self_arrange: { label: "Self Transfer", color: "bg-slate-100 text-slate-700", Icon: MapPinIcon },
};

export function BookingDetailHeader({ booking }: BookingDetailHeaderProps) {
  const transport = booking.transport_type
    ? transportConfig[booking.transport_type]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Package
            </h3>
            <p className="text-xl font-medium text-[#1a237e]">
              {booking.package_name}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {booking.currency} {booking.package_price?.toLocaleString() || "0"} per person
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Play Date</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(booking.activity_date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <ClockIcon className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Time Slot</p>
                <p className="text-sm font-medium text-slate-900">
                  {booking.time_slot}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
              <UsersIcon className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Guests</p>
                <p className="text-sm font-medium text-slate-900">
                  {booking.guest_count} Player{booking.guest_count !== 1 ? "s" : ""}
                  {booking.non_players > 0 && (
                    <span className="text-slate-500">
                      {" "}+ {booking.non_players} Non-Player{booking.non_players !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-80 space-y-4">
          {transport && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Transport</p>
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-lg ${transport.color}`}>
                  <transport.Icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {transport.label}
                  </p>
                  {booking.hotel_name && (
                    <p className="text-xs text-slate-500">
                      {booking.hotel_name}
                      {booking.room_number && ` • Room ${booking.room_number}`}
                    </p>
                  )}
                  {booking.transport_type === "private" && booking.private_passengers > 0 && (
                    <p className="text-xs text-slate-500">
                      {booking.private_passengers} passenger{booking.private_passengers !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              {booking.transport_cost > 0 && (
                <p className="text-sm text-slate-600 mt-2">
                  Transport cost: {booking.currency} {booking.transport_cost.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {booking.addons && booking.addons.length > 0 && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-2">Add-ons</p>
              <div className="space-y-2">
                {booking.addons.map((addon, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <GiftIcon className="w-4 h-4 text-indigo-500" />
                      <span className="text-slate-700">
                        {addon.quantity > 1 && `${addon.quantity}x `}
                        {addon.name}
                      </span>
                    </div>
                    <span className="text-slate-900 font-medium">
                      {booking.currency}{" "}
                      {(addon.unit_price * addon.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
