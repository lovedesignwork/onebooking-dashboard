import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingDetailCard } from "@/components/dashboard/booking-detail-card";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/bookings"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking {booking.booking_ref}
          </h1>
          <p className="text-gray-500">
            {booking.website?.name || booking.website_id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BookingDetailCard booking={booking} />
          <BookingEditForm booking={booking} />
        </div>

        <div className="space-y-6">
          <SyncHistory logs={syncLogs} />

          {booking.admin_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Admin Notes
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {booking.admin_notes}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Timestamps
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Created (Source)</p>
                <p className="text-gray-900">
                  {booking.source_created_at
                    ? new Date(booking.source_created_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Synced to OneBooking</p>
                <p className="text-gray-900">
                  {new Date(booking.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-900">
                  {new Date(booking.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
