import type { SyncLog } from "@/types";
import { CheckIcon, XMarkIcon, ArrowPathIcon } from "@/components/ui/icons";

interface SyncHistoryProps {
  logs: SyncLog[];
}

const statusIcons = {
  success: <CheckIcon className="w-4 h-4 text-green-600" />,
  failed: <XMarkIcon className="w-4 h-4 text-red-600" />,
  pending: <ArrowPathIcon className="w-4 h-4 text-amber-600 animate-spin" />,
};

const statusColors = {
  success: "bg-green-100 border-green-200",
  failed: "bg-red-100 border-red-200",
  pending: "bg-amber-100 border-amber-200",
};

export function SyncHistory({ logs }: SyncHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Sync History</h3>
        <p className="text-slate-500 text-sm">No sync events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Sync History</h3>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full border ${
                  statusColors[log.status]
                }`}
              >
                {statusIcons[log.status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900">
                    {log.event_type.split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      log.direction === "inbound"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {log.direction === "inbound" ? "Received" : "Sent"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(log.created_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Bangkok",
                  })}
                </p>
                {log.error_message && (
                  <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
                    {log.error_message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
