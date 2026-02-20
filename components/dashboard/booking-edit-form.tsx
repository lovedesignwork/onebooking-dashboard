"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowPathIcon, CheckIcon } from "@/components/ui/icons";
import type { Booking, BookingStatus } from "@/types";

interface BookingEditFormProps {
  booking: Booking;
}

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "no_show", label: "No Show" },
];

export function BookingEditForm({ booking }: BookingEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [formData, setFormData] = useState({
    status: booking.status,
    hotel_name: booking.hotel_name || "",
    room_number: booking.room_number || "",
    admin_notes: booking.admin_notes || "",
    activity_date: booking.activity_date,
    time_slot: booking.time_slot,
    guest_count: booking.guest_count,
    special_requests: booking.special_requests || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update booking");
      }

      setSuccess(true);
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToSource = async () => {
    setSyncing(true);
    setError(null);
    setSyncSuccess(false);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/sync-to-source`, {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to sync to source");
      }

      setSyncSuccess(true);
      router.refresh();

      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Edit Booking</h3>
          <p className="text-sm text-slate-500">
            Update booking details
          </p>
        </div>
        {booking.website?.webhook_url && (
          <button
            type="button"
            onClick={handleSyncToSource}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1a237e] bg-[#1a237e]/5 hover:bg-[#1a237e]/10 rounded-xl transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync to Source"}
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
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

        {syncSuccess && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" />
            Changes synced to source website!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as BookingStatus })
              }
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Guest Count
            </label>
            <input
              type="number"
              min="1"
              value={formData.guest_count}
              onChange={(e) =>
                setFormData({ ...formData, guest_count: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Activity Date
            </label>
            <input
              type="date"
              value={formData.activity_date}
              onChange={(e) =>
                setFormData({ ...formData, activity_date: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Slot
            </label>
            <input
              type="text"
              value={formData.time_slot}
              onChange={(e) =>
                setFormData({ ...formData, time_slot: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hotel Name
            </label>
            <input
              type="text"
              value={formData.hotel_name}
              onChange={(e) =>
                setFormData({ ...formData, hotel_name: e.target.value })
              }
              placeholder="Enter hotel name"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room Number
            </label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) =>
                setFormData({ ...formData, room_number: e.target.value })
              }
              placeholder="Enter room number"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={formData.special_requests}
              onChange={(e) =>
                setFormData({ ...formData, special_requests: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Admin Notes
            </label>
            <textarea
              value={formData.admin_notes}
              onChange={(e) =>
                setFormData({ ...formData, admin_notes: e.target.value })
              }
              rows={3}
              placeholder="Internal notes (not sent to customer)"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-[#1a237e] text-white rounded-xl font-medium hover:bg-[#1a237e]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
    </form>
  );
}
