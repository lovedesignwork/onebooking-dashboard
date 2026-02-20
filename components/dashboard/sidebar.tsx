"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  HomeIcon,
  CalendarIcon,
  GlobeIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@/components/ui/icons";
import { signOut } from "@/lib/auth/actions";

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
];

const bookingLinks = [
  { name: "All Bookings", href: "/bookings", websiteId: null },
  { name: "HW Bookings", href: "/bookings?website_id=hanuman-world", websiteId: "hanuman-world", color: "bg-green-500" },
  { name: "FH Bookings", href: "/bookings?website_id=flying-hanuman", websiteId: "flying-hanuman", color: "bg-orange-500" },
  { name: "HL Bookings", href: "/bookings?website_id=hanuman-luge", websiteId: "hanuman-luge", color: "bg-purple-500" },
];

const bottomNavigation = [
  { name: "Websites", href: "/websites", icon: GlobeIcon },
  { name: "Sync Logs", href: "/sync-logs", icon: ArrowPathIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentWebsiteId = searchParams.get("website_id");

  const isBookingActive = (link: typeof bookingLinks[0]) => {
    if (pathname !== "/bookings") return false;
    if (link.websiteId === null) return !currentWebsiteId;
    return currentWebsiteId === link.websiteId;
  };

  return (
    <aside className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
            OB
          </div>
          <span className="text-lg font-semibold">OneBooking</span>
        </Link>
      </div>

      <nav className="flex flex-col h-[calc(100%-4rem)] py-4 overflow-y-auto">
        <div className="flex-1 space-y-1 px-3">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Bookings
            </p>
          </div>

          {bookingLinks.map((link) => {
            const isActive = isBookingActive(link);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.websiteId ? (
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white ${link.color}`}>
                    {link.name.substring(0, 2)}
                  </span>
                ) : (
                  <CalendarIcon className="w-5 h-5" />
                )}
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Management
            </p>
          </div>

          {bottomNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="px-3 pt-4 border-t border-gray-800">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
}
