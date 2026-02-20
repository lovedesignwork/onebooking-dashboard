"use client";

import { GlobeIcon } from "@/components/ui/icons";
import type { Booking } from "@/types";

interface BookingDetailInfoProps {
  booking: Booking;
}

export function BookingDetailInfo({ booking }: BookingDetailInfoProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Booking Details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Booking Reference</p>
            <p className="text-slate-900 font-mono font-medium">
              {booking.booking_ref}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Source Booking ID</p>
            <p className="text-slate-700 font-mono text-sm">
              {booking.source_booking_id}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">OneBooking ID</p>
            <p className="text-slate-700 font-mono text-sm">{booking.id}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Source Website</p>
            <div className="flex items-center gap-2 mt-1">
              {booking.website?.logo_url ? (
                <img
                  src={booking.website.logo_url}
                  alt={booking.website.name}
                  className="w-6 h-6 rounded"
                />
              ) : (
                <GlobeIcon className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className="text-slate-900 font-medium">
                  {booking.website?.name || booking.website_id}
                </p>
                {booking.website?.domain && (
                  <a
                    href={`https://${booking.website.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1a237e] hover:underline"
                  >
                    {booking.website.domain}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500">Currency</p>
            <p className="text-slate-900">{booking.currency}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Activity Date</p>
            <p className="text-slate-900">
              {new Date(booking.activity_date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
