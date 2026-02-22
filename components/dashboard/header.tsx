"use client";

import { useState } from "react";
import { Bars3Icon, ChevronDownIcon, ArrowRightOnRectangleIcon } from "@/components/ui/icons";
import { signOut } from "@/lib/auth/actions";
import type { AdminUser } from "@/types";

interface HeaderProps {
  user: AdminUser | null;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 px-4 lg:px-8">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || user?.email || "User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
