import { getUser } from "@/lib/auth/get-user";
import { Cog6ToothIcon } from "@/components/ui/icons";

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {user?.full_name || "User"}
              </p>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm text-blue-600 capitalize mt-1">
                {user?.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ""}
                disabled
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 capitalize"
              />
            </div>
          </div>

          {user?.allowed_websites && user.allowed_websites.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Websites
              </label>
              <div className="flex flex-wrap gap-2">
                {user.allowed_websites.map((website) => (
                  <span
                    key={website}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {website}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Account</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Member since</p>
            <p className="text-gray-900">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex gap-4">
          <Cog6ToothIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800">Account Management</h4>
            <p className="text-sm text-yellow-700 mt-1">
              To change your password or update your profile, please contact
              your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
