import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BookingFilters } from "@/components/dashboard/booking-filters";
import { BookingsTable } from "@/components/dashboard/bookings-table";
import { Pagination } from "@/components/dashboard/pagination";
import type { Booking, Website, BookingFilters as FiltersType } from "@/types";

interface PageProps {
  searchParams: Promise<{
    website_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: string;
  }>;
}

async function getBookings(filters: FiltersType) {
  const supabase = await createClient();

  const page = filters.page || 1;
  const perPage = filters.per_page || 20;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("bookings")
    .select("*, website:websites(*)", { count: "exact" });

  if (filters.website_id) {
    query = query.eq("website_id", filters.website_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.date_from) {
    query = query.gte("activity_date", filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte("activity_date", filters.date_to);
  }

  if (filters.search) {
    query = query.or(
      `booking_ref.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data: bookings, count } = await query;

  return {
    bookings: (bookings || []) as Booking[],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  };
}

async function getWebsites() {
  const supabase = await createClient();
  const { data } = await supabase.from("websites").select("*").order("name");
  return (data || []) as Website[];
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const filters: FiltersType = {
    website_id: params.website_id,
    status: params.status as FiltersType["status"],
    date_from: params.date_from,
    date_to: params.date_to,
    search: params.search,
    page: parseInt(params.page || "1"),
    per_page: 20,
  };

  const [{ bookings, total, page, perPage, totalPages }, websites] =
    await Promise.all([getBookings(filters), getWebsites()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">
          Manage and view all bookings from your connected websites
        </p>
      </div>

      <Suspense fallback={<div className="h-16 bg-gray-100 rounded-xl animate-pulse" />}>
        <BookingFilters websites={websites} />
      </Suspense>

      <BookingsTable bookings={bookings} />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
      />
    </div>
  );
}
