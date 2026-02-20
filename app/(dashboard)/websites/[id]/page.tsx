import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeftIcon, GlobeIcon } from "@/components/ui/icons";
import { WebsiteEditForm } from "@/components/dashboard/website-edit-form";
import type { Website } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getWebsite(id: string) {
  const supabase = await createClient();

  const { data: website, error } = await supabase
    .from("websites")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !website) {
    return null;
  }

  return website as Website;
}

async function getBookingStats(websiteId: string) {
  const supabase = await createClient();

  const [{ count: total }, { count: thisMonth }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("website_id", websiteId),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("website_id", websiteId)
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
  ]);

  return {
    total: total || 0,
    thisMonth: thisMonth || 0,
  };
}

export default async function WebsiteDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [website, stats] = await Promise.all([
    getWebsite(id),
    getBookingStats(id),
  ]);

  if (!website) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/websites"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
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
            <h1 className="text-2xl font-bold text-gray-900">{website.name}</h1>
            <p className="text-gray-500">{website.domain}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WebsiteEditForm website={website} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                API Credentials
              </h3>
              <p className="text-sm text-gray-500">
                Use these credentials to connect your website
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto">
                    {website.api_key}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(website.api_key)}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {website.webhook_secret && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook Secret
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto">
                      {website.webhook_secret}
                    </code>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(website.webhook_secret!)
                      }
                      className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Bookings</span>
                <span className="text-xl font-bold text-gray-900">
                  {stats.total.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">This Month</span>
                <span className="text-xl font-bold text-blue-600">
                  {stats.thisMonth.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/bookings?website_id=${website.id}`}
                className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                View All Bookings
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Integration Status
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    website.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {website.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Webhook</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    website.webhook_url
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {website.webhook_url ? "Configured" : "Not configured"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created</span>
                <p className="text-gray-900">
                  {new Date(website.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
