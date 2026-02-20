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
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@/components/ui/icons";
import { signOut } from "@/lib/auth/actions";
import { useSidebar } from "./sidebar-context";

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
];

const bookingLinks = [
  { name: "All Bookings", href: "/bookings", websiteId: null, shortName: "All" },
  { name: "HW Bookings", href: "/bookings?website_id=hanuman-world", websiteId: "hanuman-world", color: "bg-green-500", shortName: "HW" },
  { name: "FH Bookings", href: "/bookings?website_id=flying-hanuman", websiteId: "flying-hanuman", color: "bg-orange-500", shortName: "FH" },
  { name: "HL Bookings", href: "/bookings?website_id=hanuman-luge", websiteId: "hanuman-luge", color: "bg-purple-500", shortName: "HL" },
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
  const { isCollapsed, toggleSidebar } = useSidebar();

  const isBookingActive = (link: typeof bookingLinks[0]) => {
    if (pathname !== "/bookings") return false;
    if (link.websiteId === null) return !currentWebsiteId;
    return currentWebsiteId === link.websiteId;
  };

  return (
    <aside
      className={`hidden lg:block fixed inset-y-0 left-0 z-50 bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`flex h-16 items-center border-b border-gray-800 ${isCollapsed ? "justify-center px-2" : "px-6"}`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
            OB
          </div>
          {!isCollapsed && <span className="text-lg font-semibold">OneBooking</span>}
        </Link>
      </div>

      <nav className="flex flex-col h-[calc(100%-4rem)] py-4 overflow-y-auto">
        <div className={`flex-1 space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}>
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}

          {!isCollapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Bookings
              </p>
            </div>
          )}

          {isCollapsed && <div className="pt-4 border-t border-gray-800 mt-2" />}

          {bookingLinks.map((link) => {
            const isActive = isBookingActive(link);
            return (
              <Link
                key={link.name}
                href={link.href}
                title={isCollapsed ? link.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {link.websiteId ? (
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${link.color}`}>
                    {link.shortName}
                  </span>
                ) : (
                  <CalendarIcon className="w-5 h-5 flex-shrink-0" />
                )}
                {!isCollapsed && link.name}
              </Link>
            );
          })}

          {!isCollapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Management
              </p>
            </div>
          )}

          {isCollapsed && <div className="pt-4 border-t border-gray-800 mt-2" />}

          {bottomNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </div>

        <div className={`pt-4 border-t border-gray-800 ${isCollapsed ? "px-2" : "px-3"}`}>
          <button
            onClick={toggleSidebar}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="w-5 h-5 flex-shrink-0" />
                Collapse
              </>
            )}
          </button>

          <button
            onClick={() => signOut()}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && "Sign Out"}
          </button>
        </div>
      </nav>
    </aside>
  );
}
