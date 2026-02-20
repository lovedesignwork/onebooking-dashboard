import type { SyncLog } from "@/types";
import { CheckIcon, XMarkIcon, ArrowPathIcon } from "@/components/ui/icons";

interface SyncHistoryProps {
  logs: SyncLog[];
}

const statusIcons = {
  success: <CheckIcon className="w-4 h-4 text-green-600" />,
  failed: <XMarkIcon className="w-4 h-4 text-red-600" />,
  pending: <ArrowPathIcon className="w-4 h-4 text-yellow-600 animate-spin" />,
};

const statusColors = {
  success: "bg-green-100 border-green-200",
  failed: "bg-red-100 border-red-200",
  pending: "bg-yellow-100 border-yellow-200",
};

export function SyncHistory({ logs }: SyncHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h3>
        <p className="text-gray-500 text-sm">No sync events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Sync History</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {logs.map((log) => (
          <div key={log.id} className="px-6 py-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full border ${
                  statusColors[log.status]
                }`}
              >
                {statusIcons[log.status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {log.event_type.replace("_", " ")}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      log.direction === "inbound"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {log.direction}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                {log.error_message && (
                  <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
