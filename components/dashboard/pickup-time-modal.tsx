"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  ClockIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";
import type { Booking } from "@/types";

interface PickupTimeModalProps {
  booking: Booking;
  onClose: () => void;
}

interface TimeDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
}

function TimeDropdown({ value, options, onChange, label }: TimeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-24 h-16 bg-slate-100 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-2xl font-bold text-center text-slate-800 cursor-pointer transition-all hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-1"
      >
        {value}
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <span className="absolute -bottom-5 left-0 right-0 text-center text-xs text-slate-400">{label}</span>
      
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-10 w-[200px] max-h-[240px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                  value === opt
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PickupTimeModal({ booking, onClose }: PickupTimeModalProps) {
  const router = useRouter();
  const [hours, setHours] = useState(booking.pickup_time?.split(":")[0] || "08");
  const [minutes, setMinutes] = useState(booking.pickup_time?.split(":")[1] || "00");
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickupTime = `${hours}:${minutes}`;

  const handleSave = async (sendEmail: boolean = false) => {
    if (sendEmail) {
      setSendingEmail(true);
    } else {
      setSaving(true);
    }
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/pickup-time`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_time: pickupTime,
          send_email: sendEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save pickup time");
      }

      setSuccess(
        sendEmail
          ? "Pickup time saved and email sent to customer!"
          : "Pickup time saved successfully!"
      );
      router.refresh();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
      setSendingEmail(false);
    }
  };

  const generateEmailText = () => {
    const activityDate = new Date(booking.activity_date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return `Dear ${booking.customer_name},

Thank you for booking with us!

Your pickup details for your upcoming tour:

📅 Date: ${activityDate}
⏰ Pickup Time: ${pickupTime}
📍 Pickup Location: ${booking.hotel_name || "Your hotel"}${booking.room_number ? ` (Room: ${booking.room_number})` : ""}

Booking Reference: ${booking.booking_ref}
Package: ${booking.package_name}
Number of Guests: ${booking.guest_count}${booking.non_players > 0 ? ` + ${booking.non_players} non-players` : ""}

Please be ready at the lobby 5-10 minutes before the pickup time.

If you have any questions, please don't hesitate to contact us.

Best regards,
The Team`;
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(generateEmailText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minuteOptions = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Set Pickup Time
              </h2>
              <p className="text-sm text-slate-500">{booking.booking_ref}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-medium text-slate-800">{booking.customer_name}</p>
                <p className="text-xs text-slate-500">{booking.customer_email}</p>
              </div>
              <div>
                <p className="text-slate-500">Activity Date</p>
                <p className="font-medium text-slate-800">
                  {new Date(booking.activity_date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-slate-500">{booking.time_slot}</p>
              </div>
              <div>
                <p className="text-slate-500">Hotel</p>
                <p className="font-medium text-slate-800">
                  {booking.hotel_name || "Not specified"}
                </p>
                {booking.room_number && (
                  <p className="text-xs text-slate-500">Room: {booking.room_number}</p>
                )}
              </div>
              <div>
                <p className="text-slate-500">Guests</p>
                <p className="font-medium text-slate-800">
                  {booking.guest_count} players
                  {booking.non_players > 0 && ` + ${booking.non_players} non-players`}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Pickup Time
            </label>
            <div className="flex items-center justify-center gap-2">
              <TimeDropdown
                value={hours}
                options={hourOptions}
                onChange={setHours}
                label="Hour"
              />
              <span className="text-3xl font-bold text-slate-300 mx-1">:</span>
              <TimeDropdown
                value={minutes}
                options={minuteOptions}
                onChange={setMinutes}
                label="Minute"
              />
            </div>
            <div className="mt-8 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <ClockIcon className="w-4 h-4" />
                Pickup at {pickupTime}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              {success}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || sendingEmail}
              className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Only"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || sendingEmail}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              {sendingEmail ? "Sending..." : "Save & Send Email"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-slate-50 text-slate-500">or</span>
            </div>
          </div>

          <button
            onClick={handleCopyEmail}
            className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-4 h-4" />
                Copy Email Text for Messenger
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
