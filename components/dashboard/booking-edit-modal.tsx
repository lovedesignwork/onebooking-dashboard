"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XMarkIcon, CheckIcon } from "@/components/ui/icons";
import type { Booking, BookingStatus } from "@/types";

interface BookingEditModalProps {
  booking: Booking;
  onClose: () => void;
}

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "no_show", label: "No Show" },
];

export function BookingEditModal({ booking, onClose }: BookingEditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [hotelName, setHotelName] = useState(booking.hotel_name || "");
  const [roomNumber, setRoomNumber] = useState(booking.room_number || "");
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/bookings/${booking.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            hotel_name: hotelName || null,
            room_number: roomNumber || null,
            admin_notes: adminNotes || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to update booking");
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1000);
      } catch {
        setError("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            Edit Booking {booking.booking_ref}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              Booking updated successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              disabled={isPending || success}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none disabled:bg-slate-50"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Hotel Name
            </label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              disabled={isPending || success}
              placeholder="Enter hotel name"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Room Number
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              disabled={isPending || success}
              placeholder="Enter room number"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Admin Notes
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={isPending || success}
              placeholder="Internal notes (not visible to customer)"
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none resize-none disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || success}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a237e] text-white rounded-xl font-medium hover:bg-[#1a237e]/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
