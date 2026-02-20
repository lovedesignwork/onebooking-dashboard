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
    date_type?: string;
    search?: string;
    page?: string;
    per_page?: string;
    sort_field?: string;
    sort_dir?: string;
  }>;
}

interface ExtendedFilters extends FiltersType {
  date_type?: "booking" | "play";
  sort_field?: string;
  sort_dir?: "asc" | "desc";
}

async function getBookings(filters: ExtendedFilters) {
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

  const dateField = filters.date_type === "booking" ? "created_at" : "activity_date";

  if (filters.date_from) {
    query = query.gte(dateField, filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte(dateField, filters.date_to);
  }

  if (filters.search) {
    query = query.or(
      `booking_ref.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
    );
  }

  const sortField = filters.sort_field || "created_at";
  const sortAscending = filters.sort_dir === "asc";
  query = query
    .order(sortField, { ascending: sortAscending })
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
  const perPage = parseInt(params.per_page || "20");
  
  const filters: ExtendedFilters = {
    website_id: params.website_id,
    status: params.status as FiltersType["status"],
    date_from: params.date_from,
    date_to: params.date_to,
    date_type: (params.date_type as "booking" | "play") || "play",
    search: params.search,
    page: parseInt(params.page || "1"),
    per_page: perPage,
    sort_field: params.sort_field,
    sort_dir: params.sort_dir as "asc" | "desc",
  };

  const [{ bookings, total, page, totalPages }, websites] =
    await Promise.all([getBookings(filters), getWebsites()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-slate-500 mt-1">
          Manage and view all bookings from your connected websites
        </p>
      </div>

      <Suspense fallback={<div className="h-16 bg-slate-100 rounded-xl animate-pulse" />}>
        <BookingFilters websites={websites} bookings={bookings} />
      </Suspense>

      <BookingsTable 
        bookings={bookings} 
        sortField={params.sort_field}
        sortDirection={params.sort_dir as "asc" | "desc"}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
      />
    </div>
  );
}
