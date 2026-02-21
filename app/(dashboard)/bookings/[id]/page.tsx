import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingDetailClient } from "@/components/dashboard/booking-detail-client";
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
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Booking Details</h1>
          <p className="text-slate-500 text-sm">
            Manage booking {booking.booking_ref}
          </p>
        </div>
      </div>

      <BookingDetailClient booking={booking} syncLogs={syncLogs} />
    </div>
  );
}
