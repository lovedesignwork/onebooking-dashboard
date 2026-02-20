"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, DownloadIcon } from "@/components/ui/icons";
import type { Website, Booking } from "@/types";

interface BookingFiltersProps {
  websites: Website[];
  bookings?: Booking[];
}

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "no_show", label: "No Show" },
];

export function BookingFilters({ websites, bookings = [] }: BookingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExporting, startExport] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [websiteId, setWebsiteId] = useState(searchParams.get("website_id") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const [dateFilterType, setDateFilterType] = useState<"booking" | "play">(
    (searchParams.get("date_type") as "booking" | "play") || "play"
  );
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = websiteId || status || dateFrom || dateTo;

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page");

    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParams, router]);

  const clearFilters = () => {
    setSearch("");
    setWebsiteId("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    router.push("/bookings");
  };

  const handleExport = () => {
    startExport(() => {
      if (bookings.length === 0) {
        alert("No bookings to export");
        return;
      }

      const headers = [
        "Booking Ref",
        "Booked On",
        "Customer Name",
        "Customer Email",
        "Package",
        "Play Date",
        "Time Slot",
        "Players",
        "Non-Players",
        "Transport",
        "Hotel",
        "Room",
        "Amount",
        "Currency",
        "Status",
      ];

      const rows = bookings.map((booking) => [
        booking.booking_ref,
        new Date(booking.created_at).toISOString(),
        booking.customer_name,
        booking.customer_email,
        booking.package_name,
        booking.activity_date,
        booking.time_slot,
        booking.guest_count,
        booking.non_players,
        booking.transport_type || "",
        booking.hotel_name || "",
        booking.room_number || "",
        booking.total_amount,
        booking.currency,
        booking.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bookings-export-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by booking ref, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
            hasFilters
              ? "border-[#1a237e] bg-[#1a237e]/5 text-[#1a237e]"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {hasFilters && (
            <span className="bg-[#1a237e] text-white text-xs px-1.5 py-0.5 rounded-full">
              {[websiteId, status, dateFrom || dateTo].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-800"
          >
            <XMarkIcon className="w-5 h-5" />
            Clear
          </button>
        )}

        <button
          onClick={handleExport}
          disabled={isExporting || bookings.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a237e] text-white rounded-xl font-medium hover:bg-[#1a237e]/90 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <DownloadIcon className="w-5 h-5" />
          )}
          Export
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Website
              </label>
              <select
                value={websiteId}
                onChange={(e) => {
                  setWebsiteId(e.target.value);
                  updateFilters({ website_id: e.target.value });
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
              >
                <option value="">All Websites</option>
                {websites.map((website) => (
                  <option key={website.id} value={website.id}>
                    {website.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  updateFilters({ status: e.target.value });
                }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => {
                      setDateFilterType("booking");
                      updateFilters({ date_type: "booking" });
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      dateFilterType === "booking"
                        ? "bg-[#1a237e] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Booking Date
                  </button>
                  <button
                    onClick={() => {
                      setDateFilterType("play");
                      updateFilters({ date_type: "play" });
                    }}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      dateFilterType === "play"
                        ? "bg-[#1a237e] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Play Date
                  </button>
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    updateFilters({ date_from: e.target.value });
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    updateFilters({ date_to: e.target.value });
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      updateFilters({ date_from: "", date_to: "" });
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
