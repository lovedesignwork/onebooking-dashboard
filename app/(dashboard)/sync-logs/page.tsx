import { createClient } from "@/lib/supabase/server";
import { ArrowPathIcon, CheckIcon, XMarkIcon } from "@/components/ui/icons";
import type { SyncLog, Website } from "@/types";

interface PageProps {
  searchParams: Promise<{
    website_id?: string;
    status?: string;
    direction?: string;
    page?: string;
  }>;
}

async function getSyncLogs(filters: {
  website_id?: string;
  status?: string;
  direction?: string;
  page?: number;
}) {
  const supabase = await createClient();

  const perPage = 25;
  const page = filters.page || 1;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("sync_logs")
    .select("*, website:websites(name), booking:bookings(booking_ref)", {
      count: "exact",
    });

  if (filters.website_id) {
    query = query.eq("website_id", filters.website_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.direction) {
    query = query.eq("direction", filters.direction);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data: logs, count } = await query;

  return {
    logs: (logs || []) as (SyncLog & {
      website: { name: string } | null;
      booking: { booking_ref: string } | null;
    })[],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  };
}

async function getWebsites() {
  const supabase = await createClient();
  const { data } = await supabase.from("websites").select("id, name").order("name");
  return (data || []) as Pick<Website, "id" | "name">[];
}

const statusIcons = {
  success: <CheckIcon className="w-4 h-4 text-green-600" />,
  failed: <XMarkIcon className="w-4 h-4 text-red-600" />,
  pending: <ArrowPathIcon className="w-4 h-4 text-yellow-600" />,
};

const statusColors = {
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export default async function SyncLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters = {
    website_id: params.website_id,
    status: params.status,
    direction: params.direction,
    page: parseInt(params.page || "1"),
  };

  const [{ logs, total, page, totalPages }, websites] = await Promise.all([
    getSyncLogs(filters),
    getWebsites(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sync Logs</h1>
        <p className="text-gray-500 mt-1">
          Monitor booking sync events between OneBooking and source websites
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <form className="flex flex-wrap gap-4">
          <select
            name="website_id"
            defaultValue={filters.website_id || ""}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Websites</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.name}
              </option>
            ))}
          </select>

          <select
            name="direction"
            defaultValue={filters.direction || ""}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>

          <select
            name="status"
            defaultValue={filters.status || ""}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowPathIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sync logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Direction</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Website</th>
                  <th className="px-6 py-4">Booking</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          log.direction === "inbound"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {log.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 capitalize">
                        {log.event_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {log.website?.name || log.website_id || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.booking?.booking_ref ? (
                        <a
                          href={`/bookings/${log.booking_id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {log.booking.booking_ref}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[log.status]
                        }`}
                      >
                        {statusIcons[log.status]}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.error_message ? (
                        <span className="text-xs text-red-600 max-w-xs truncate block">
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, total)} of{" "}
              {total} logs
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?${new URLSearchParams({
                    ...filters,
                    page: String(page - 1),
                  } as Record<string, string>)}`}
                  className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?${new URLSearchParams({
                    ...filters,
                    page: String(page + 1),
                  } as Record<string, string>)}`}
                  className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
