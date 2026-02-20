import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingDetailHeader } from "@/components/dashboard/booking-detail-header";
import { BookingDetailInfo } from "@/components/dashboard/booking-detail-info";
import { BookingEditForm } from "@/components/dashboard/booking-edit-form";
import { SyncHistory } from "@/components/dashboard/sync-history";
import { ChevronLeftIcon } from "@/components/ui/icons";
import type { Booking, SyncLog } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBooking(id: string) {
  const supabase = await createClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, website:websites(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return null;
  }

  return booking as Booking;
}

async function getSyncLogs(bookingId: string) {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("sync_logs")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (logs || []) as SyncLog[];
}

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [booking, syncLogs] = await Promise.all([
    getBooking(id),
    getSyncLogs(id),
  ]);

  if (!booking) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    refunded: "bg-purple-100 text-purple-800 border-purple-200",
    no_show: "bg-orange-100 text-orange-800 border-orange-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bookings"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {booking.booking_ref}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${
                  statusColors[booking.status] || "bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                {booking.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-slate-500 mt-0.5">
              {booking.website?.name || booking.website_id} • Booked{" "}
              {new Date(booking.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BookingDetailHeader booking={booking} />
          <BookingDetailInfo booking={booking} />
          <BookingEditForm booking={booking} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Customer
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="text-slate-900 font-medium">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <a
                  href={`mailto:${booking.customer_email}`}
                  className="text-[#1a237e] hover:underline"
                >
                  {booking.customer_email}
                </a>
              </div>
              {booking.customer_phone && (
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <a
                    href={`tel:${booking.customer_phone}`}
                    className="text-[#1a237e] hover:underline"
                  >
                    {booking.customer_country_code && `+${booking.customer_country_code} `}
                    {booking.customer_phone}
                  </a>
                </div>
              )}
              {booking.special_requests && (
                <div>
                  <p className="text-sm text-slate-500">Special Requests</p>
                  <p className="text-slate-700 text-sm mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl">
                    {booking.special_requests}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Payment
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Package Price</span>
                <span className="text-slate-900">
                  {booking.currency} {booking.package_price?.toLocaleString() || "0"}
                </span>
              </div>
              {booking.transport_cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transport</span>
                  <span className="text-slate-900">
                    {booking.currency} {booking.transport_cost.toLocaleString()}
                  </span>
                </div>
              )}
              {booking.addons && booking.addons.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Add-ons</span>
                  <span className="text-slate-900">
                    {booking.currency}{" "}
                    {booking.addons
                      .reduce((sum, a) => sum + a.unit_price * a.quantity, 0)
                      .toLocaleString()}
                  </span>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{booking.currency} {booking.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3 flex justify-between font-semibold text-lg">
                <span className="text-slate-900">Total</span>
                <span className="text-[#1a237e]">
                  {booking.currency} {booking.total_amount.toLocaleString()}
                </span>
              </div>
              {booking.stripe_payment_intent_id && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Stripe Payment ID</p>
                  <p className="text-xs text-slate-700 font-mono break-all">
                    {booking.stripe_payment_intent_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {booking.admin_notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Admin Notes
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-amber-50 border border-amber-100 p-3 rounded-xl">
                {booking.admin_notes}
              </p>
            </div>
          )}

          <SyncHistory logs={syncLogs} />

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Timestamps
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Booked On (Source)</p>
                <p className="text-slate-900">
                  {booking.source_created_at
                    ? new Date(booking.source_created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Bangkok",
                      }) + " (GMT+7)"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Synced to OneBooking</p>
                <p className="text-slate-900">
                  {new Date(booking.created_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Bangkok",
                  })} (GMT+7)
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last Updated</p>
                <p className="text-slate-900">
                  {new Date(booking.updated_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Bangkok",
                  })} (GMT+7)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
