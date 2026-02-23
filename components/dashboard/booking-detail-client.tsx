"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  GiftIcon,
  HotelIcon,
  CarIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  CheckIcon,
  TagIcon,
  GlobeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { StatusSelect } from "@/components/ui/select";
import type { Booking, BookingStatus, SyncLog } from "@/types";

interface BookingDetailClientProps {
  booking: Booking;
  syncLogs: SyncLog[];
}

const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  refunded: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  no_show: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
};

const transportConfig: Record<string, { label: string; color: string; bgColor: string; Icon: React.ComponentType<{ className?: string }> }> = {
  hotel_pickup: { label: "Hotel Pickup", color: "text-blue-600", bgColor: "bg-blue-100", Icon: HotelIcon },
  private: { label: "Private Transfer", color: "text-purple-600", bgColor: "bg-purple-100", Icon: CarIcon },
  self_arrange: { label: "Self Transfer", color: "text-slate-600", bgColor: "bg-slate-100", Icon: MapPinIcon },
};

export function BookingDetailClient({ booking, syncLogs }: BookingDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "edit" | "history">("details");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const status = statusConfig[booking.status] || statusConfig.pending;
  const transport = booking.transport_type ? transportConfig[booking.transport_type] : null;

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
      setTimeout(() => {
        setSuccess(false);
        setActiveTab("details");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyCustomerInfo = async () => {
    const guestsLine = booking.adult_count !== undefined && booking.adult_count !== null
      ? `Adults: ${booking.adult_count}${(booking.child_count ?? 0) > 0 ? `, Children: ${booking.child_count}` : ""}${booking.non_players > 0 ? ` + ${booking.non_players} non-players` : ""}`
      : `Guests: ${booking.guest_count}${booking.non_players > 0 ? ` + ${booking.non_players} non-players` : ""}`;

    const text = `Customer: ${booking.customer_name}
Email: ${booking.customer_email}
${booking.customer_phone ? `Phone: ${booking.customer_country_code ? `+${booking.customer_country_code} ` : ""}${booking.customer_phone}` : ""}
Booking: ${booking.booking_ref}
Package: ${booking.package_name}
Date: ${new Date(booking.activity_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
Time: ${booking.time_slot}
${guestsLine}
${booking.hotel_name ? `Hotel: ${booking.hotel_name}${booking.room_number ? ` (Room ${booking.room_number})` : ""}` : ""}`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="xl:col-span-2 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#1a237e] to-[#3949ab] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold">{booking.booking_ref}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text} border ${status.border}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`}></span>
                  {booking.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <p className="text-white/80 flex items-center gap-2">
                <GlobeIcon className="w-4 h-4" />
                {booking.website?.name || booking.website_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Total Amount</p>
              <p className="text-3xl font-bold">
                {booking.currency} {booking.total_amount.toLocaleString()}
              </p>
              {booking.discount_amount > 0 && (
                <p className="text-emerald-300 text-sm flex items-center justify-end gap-1">
                  <TagIcon className="w-3.5 h-3.5" />
                  Saved {booking.currency} {booking.discount_amount.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Play Date</p>
              <p className="font-semibold">
                {new Date(booking.activity_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Time Slot</p>
              <p className="font-semibold">{booking.time_slot}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                {booking.adult_count !== undefined && booking.adult_count !== null ? "Guests" : "Players"}
              </p>
              <p className="font-semibold">
                {booking.adult_count !== undefined && booking.adult_count !== null ? (
                  <>
                    {booking.adult_count} adults
                    {(booking.child_count ?? 0) > 0 && <span className="text-white/80"> + {booking.child_count} children</span>}
                    {booking.non_players > 0 && <span className="text-white/60"> + {booking.non_players} non-players</span>}
                  </>
                ) : (
                  <>
                    {booking.guest_count}
                    {booking.non_players > 0 && <span className="text-white/60"> +{booking.non_players}</span>}
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Pickup Time</p>
              <p className="font-semibold">{booking.pickup_time || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              { id: "details", label: "Details" },
              { id: "edit", label: "Edit Booking" },
              { id: "history", label: "Sync History" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-[#1a237e] bg-slate-50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a237e]" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Package Info */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Package</h4>
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
                    <p className="text-xl font-semibold text-slate-900">{booking.package_name}</p>
                    <p className="text-slate-500 mt-1">
                      {booking.currency} {booking.package_price?.toLocaleString() || "0"} per person
                    </p>
                  </div>
                </div>

                {/* Transport & Add-ons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transport && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Transport</h4>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${transport.bgColor}`}>
                          <transport.Icon className={`w-6 h-6 ${transport.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{transport.label}</p>
                          {booking.hotel_name && (
                            <p className="text-sm text-slate-500">
                              {booking.hotel_name}
                              {booking.room_number && ` • Room ${booking.room_number}`}
                            </p>
                          )}
                          {booking.transport_cost > 0 && (
                            <p className="text-sm text-slate-600 mt-1">
                              {booking.currency} {booking.transport_cost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {booking.addons && booking.addons.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Add-ons</h4>
                      <div className="space-y-2">
                        {booking.addons.map((addon, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GiftIcon className="w-4 h-4 text-orange-500" />
                              <span className="text-slate-700">
                                {addon.quantity > 1 && `${addon.quantity}x `}{addon.name}
                              </span>
                            </div>
                            <span className="font-medium text-slate-900">
                              {booking.currency} {(addon.unit_price * addon.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Special Requests */}
                {booking.special_requests && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Special Requests</h4>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{booking.special_requests}</p>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {booking.admin_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Admin Notes</h4>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{booking.admin_notes}</p>
                    </div>
                  </div>
                )}

                {/* IDs */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Reference IDs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Booking Ref</p>
                      <p className="font-mono text-sm font-medium text-slate-900">{booking.booking_ref}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Source ID</p>
                      <p className="font-mono text-xs text-slate-700 truncate">{booking.source_booking_id}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">OneBooking ID</p>
                      <p className="font-mono text-xs text-slate-700 truncate">{booking.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "edit" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    Booking updated successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <StatusSelect
                      value={formData.status}
                      onChange={(value) => setFormData({ ...formData, status: value as BookingStatus })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.guest_count}
                      onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Activity Date</label>
                    <input
                      type="date"
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Time Slot</label>
                    <input
                      type="text"
                      value={formData.time_slot}
                      onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hotel Name</label>
                    <input
                      type="text"
                      value={formData.hotel_name}
                      onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                      placeholder="Enter hotel name"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Room Number</label>
                    <input
                      type="text"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      placeholder="Enter room number"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Special Requests</label>
                    <textarea
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                    <textarea
                      value={formData.admin_notes}
                      onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                      rows={3}
                      placeholder="Internal notes (not sent to customer)"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab("details")}
                    className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1a237e] text-white rounded-xl font-medium hover:bg-[#1a237e]/90 disabled:opacity-50 transition-all shadow-lg shadow-[#1a237e]/25"
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
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                {syncLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClockIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No sync history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {syncLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-xl border ${
                          log.status === "success"
                            ? "bg-emerald-50 border-emerald-200"
                            : log.status === "failed"
                            ? "bg-red-50 border-red-200"
                            : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                log.direction === "inbound"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}>
                                {log.direction}
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {log.event_type}
                              </span>
                            </div>
                            {log.error_message && (
                              <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Customer Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Customer</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1a237e]/10 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-[#1a237e]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{booking.customer_name}</p>
                <p className="text-sm text-slate-500">Customer</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={`mailto:${booking.customer_email}`}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <EnvelopeIcon className="w-5 h-5 text-slate-400 group-hover:text-[#1a237e]" />
                <span className="text-sm text-slate-700 group-hover:text-[#1a237e] truncate">
                  {booking.customer_email}
                </span>
              </a>

              {booking.customer_phone && (
                <a
                  href={`tel:${booking.customer_phone}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <PhoneIcon className="w-5 h-5 text-slate-400 group-hover:text-[#1a237e]" />
                  <span className="text-sm text-slate-700 group-hover:text-[#1a237e]">
                    {booking.customer_country_code && `+${booking.customer_country_code} `}
                    {booking.customer_phone}
                  </span>
                </a>
              )}
            </div>

            <button
              onClick={copyCustomerInfo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  Copy Info
                </>
              )}
            </button>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Payment Summary</h3>
          </div>
          <div className="p-6 space-y-3">
            {booking.adult_count !== undefined && booking.adult_count !== null ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Adults ({booking.adult_count}x)</span>
                  <span className="text-slate-900">
                    {booking.currency} {((booking.package_price || 0) * booking.adult_count).toLocaleString()}
                  </span>
                </div>
                {(booking.child_count ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Children ({booking.child_count}x)</span>
                    <span className="text-slate-900 text-xs italic">Included</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Package ({booking.guest_count}x)</span>
                <span className="text-slate-900">
                  {booking.currency} {((booking.package_price || 0) * booking.guest_count).toLocaleString()}
                </span>
              </div>
            )}

            {booking.transport_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Transport</span>
                <span className="text-slate-900">
                  {booking.currency} {booking.transport_cost.toLocaleString()}
                </span>
              </div>
            )}

            {booking.addons && booking.addons.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Add-ons</span>
                <span className="text-slate-900">
                  {booking.currency}{" "}
                  {booking.addons.reduce((sum, a) => sum + a.unit_price * a.quantity, 0).toLocaleString()}
                </span>
              </div>
            )}

            {booking.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>-{booking.currency} {booking.discount_amount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-xl font-bold text-[#1a237e]">
                  {booking.currency} {booking.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {booking.stripe_payment_intent_id && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Stripe Payment ID</p>
                <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg break-all">
                  {booking.stripe_payment_intent_id}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Timeline</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Booked</p>
                  <p className="text-xs text-slate-500">
                    {booking.source_created_at
                      ? new Date(booking.source_created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Synced to OneBooking</p>
                  <p className="text-xs text-slate-500">
                    {new Date(booking.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Last Updated</p>
                  <p className="text-xs text-slate-500">
                    {new Date(booking.updated_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
