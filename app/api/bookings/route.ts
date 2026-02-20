import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, PaginatedResponse, Booking, BookingFilters } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filters: BookingFilters = {
      website_id: searchParams.get("website_id") || undefined,
      status: searchParams.get("status") as BookingFilters["status"] || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      per_page: parseInt(searchParams.get("per_page") || "20"),
    };

    const page = filters.page || 1;
    const perPage = Math.min(filters.per_page || 20, 100);
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

    const { data: bookings, error, count } = await query;

    if (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / perPage);

    return NextResponse.json<ApiResponse<PaginatedResponse<Booking>>>({
      success: true,
      data: {
        data: bookings as Booking[],
        total: count || 0,
        page,
        per_page: perPage,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
