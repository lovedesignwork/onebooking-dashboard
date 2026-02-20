import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GlobeIcon, PlusIcon, EyeIcon } from "@/components/ui/icons";
import type { Website } from "@/types";

async function getWebsites() {
  const supabase = await createClient();

  const { data: websites } = await supabase
    .from("websites")
    .select("*")
    .order("name");

  return (websites || []) as Website[];
}

async function getBookingCounts() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bookings")
    .select("website_id");

  const counts: Record<string, number> = {};
  data?.forEach((booking) => {
    counts[booking.website_id] = (counts[booking.website_id] || 0) + 1;
  });

  return counts;
}

export default async function WebsitesPage() {
  const [websites, bookingCounts] = await Promise.all([
    getWebsites(),
    getBookingCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
          <p className="text-gray-500 mt-1">
            Manage your connected source websites
          </p>
        </div>
        <Link
          href="/websites/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Website
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((website) => (
          <div
            key={website.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    {website.logo_url ? (
                      <img
                        src={website.logo_url}
                        alt={website.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <GlobeIcon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {website.name}
                    </h3>
                    <p className="text-sm text-gray-500">{website.domain}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    website.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {website.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Bookings</span>
                  <span className="font-semibold text-gray-900">
                    {(bookingCounts[website.id] || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/websites/${website.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  View Details
                </Link>
                <Link
                  href={`/bookings?website_id=${website.id}`}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  View Bookings
                </Link>
              </div>
            </div>
          </div>
        ))}

        {websites.length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <GlobeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No websites connected
            </h3>
            <p className="text-gray-500 mb-4">
              Add your first source website to start receiving bookings
            </p>
            <Link
              href="/websites/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Add Website
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
