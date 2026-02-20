export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded" />
          <div className="w-24 h-10 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="h-6 bg-gray-100 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
