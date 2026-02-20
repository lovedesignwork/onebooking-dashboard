import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentBookings } from "@/components/dashboard/recent-bookings";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  GlobeIcon,
} from "@/components/ui/icons";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = await createClient();

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    { count: totalBookings },
    { count: monthBookings },
    { count: lastMonthBookings },
    { data: revenueData },
    { data: lastMonthRevenueData },
    { count: totalGuests },
    { count: activeWebsites },
    { data: recentBookings },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfLastMonth.toISOString())
      .lte("created_at", endOfLastMonth.toISOString()),
    supabase
      .from("bookings")
      .select("total_amount")
      .gte("created_at", startOfMonth.toISOString())
      .in("status", ["confirmed", "completed"]),
    supabase
      .from("bookings")
      .select("total_amount")
      .gte("created_at", startOfLastMonth.toISOString())
      .lte("created_at", endOfLastMonth.toISOString())
      .in("status", ["confirmed", "completed"]),
    supabase
      .from("bookings")
      .select("guest_count")
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("websites")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("bookings")
      .select("*, website:websites(*)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthRevenue = revenueData?.reduce((sum, b) => sum + b.total_amount, 0) || 0;
  const lastMonthRevenue =
    lastMonthRevenueData?.reduce((sum, b) => sum + b.total_amount, 0) || 0;

  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

  const bookingChange =
    (lastMonthBookings || 0) > 0
      ? Math.round(
          (((monthBookings || 0) - (lastMonthBookings || 0)) /
            (lastMonthBookings || 1)) *
            100
        )
      : 0;

  return {
    totalBookings: totalBookings || 0,
    monthBookings: monthBookings || 0,
    bookingChange,
    monthRevenue,
    revenueChange,
    totalGuests: totalGuests || 0,
    activeWebsites: activeWebsites || 0,
    recentBookings: (recentBookings || []) as Booking[],
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your booking operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          icon={<CalendarIcon className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="This Month"
          value={stats.monthBookings.toLocaleString()}
          change={stats.bookingChange}
          changeLabel="vs last month"
          icon={<CalendarIcon className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="Month Revenue"
          value={`฿${stats.monthRevenue.toLocaleString()}`}
          change={stats.revenueChange}
          changeLabel="vs last month"
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Active Websites"
          value={stats.activeWebsites}
          icon={<GlobeIcon className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      <RecentBookings bookings={stats.recentBookings} />
    </div>
  );
}
