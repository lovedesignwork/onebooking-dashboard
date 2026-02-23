import { messagingApi } from "@line/bot-sdk";
import { getEmailConfig } from "@/lib/email/config";

const { MessagingApiClient } = messagingApi;

const lineClient =
  process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_GROUP_ID
    ? new MessagingApiClient({
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      })
    : null;

const LINE_GROUP_ID = process.env.LINE_GROUP_ID;

interface BookingNotificationData {
  websiteId: string;
  websiteName: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  packageName: string;
  activityDate: string;
  timeSlot: string;
  guestCount: number;
  adultCount?: number;
  childCount?: number;
  nonPlayers: number;
  transportType: string | null;
  hotelName: string | null;
  roomNumber: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  specialRequests: string | null;
}

/**
 * Format booking data into a LINE message
 */
function formatBookingMessage(data: BookingNotificationData): string {
  const brandConfig = getEmailConfig(data.websiteId);
  
  const formattedDate = new Date(data.activityDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let guestInfo: string;
  if (data.adultCount !== undefined && data.adultCount !== null) {
    guestInfo = `${data.adultCount} adults`;
    if (data.childCount && data.childCount > 0) {
      guestInfo += ` + ${data.childCount} children`;
    }
    if (data.nonPlayers > 0) {
      guestInfo += ` + ${data.nonPlayers} non-players`;
    }
  } else {
    guestInfo = data.nonPlayers > 0
      ? `${data.guestCount} guests + ${data.nonPlayers} non-players`
      : `${data.guestCount} guests`;
  }

  let transportInfo = "";
  if (data.transportType && data.transportType !== "self_arrange") {
    const transportLabel =
      data.transportType === "hotel_pickup"
        ? "Hotel Pickup"
        : data.transportType === "private"
        ? "Private Transfer"
        : data.transportType;
    transportInfo = `\n🚐 ${transportLabel}`;
    if (data.hotelName) {
      transportInfo += `\n🏨 ${data.hotelName}`;
      if (data.roomNumber) {
        transportInfo += ` (Room ${data.roomNumber})`;
      }
    }
  }

  const statusEmoji =
    data.status === "confirmed"
      ? "✅"
      : data.status === "pending"
      ? "⏳"
      : data.status === "cancelled"
      ? "❌"
      : "📋";

  let message = `🎫 NEW BOOKING

📍 ${data.websiteName || brandConfig.senderName}
📋 ${data.bookingRef}
👤 ${data.customerName}
📧 ${data.customerEmail}`;

  if (data.customerPhone) {
    message += `\n📱 ${data.customerPhone}`;
  }

  message += `

📦 ${data.packageName}
📅 ${formattedDate}
⏰ ${data.timeSlot}
👥 ${guestInfo}`;

  if (transportInfo) {
    message += `\n${transportInfo}`;
  }

  message += `

💰 ${data.currency} ${data.totalAmount.toLocaleString()}
${statusEmoji} ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`;

  if (data.specialRequests) {
    message += `\n\n📝 Notes: ${data.specialRequests}`;
  }

  return message;
}

/**
 * Send booking notification to LINE group chat
 * This function is non-blocking and will not throw errors
 */
export async function sendBookingNotification(
  data: BookingNotificationData
): Promise<{ success: boolean; error?: string }> {
  if (!lineClient || !LINE_GROUP_ID) {
    console.log("[LINE] Notification skipped - LINE not configured");
    return {
      success: false,
      error: "LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID not configured",
    };
  }

  try {
    const message = formatBookingMessage(data);

    await lineClient.pushMessage({
      to: LINE_GROUP_ID,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    });

    console.log(`[LINE] Booking notification sent for ${data.bookingRef}`);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown LINE API error";
    console.error("[LINE] Failed to send notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
