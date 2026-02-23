/**
 * Email configuration for each brand/website
 * Each brand has its own sender email for customer communications
 */

export interface BrandEmailConfig {
  senderEmail: string;
  senderName: string;
  supportEmail: string;
  brandColor: string;
}

/**
 * Brand email configurations
 * Maps website_id to email sender details
 */
export const brandEmailConfigs: Record<string, BrandEmailConfig> = {
  "hanuman-world": {
    senderEmail: "support@hanumanworldphuket.com",
    senderName: "Hanuman World Phuket",
    supportEmail: "support@hanumanworldphuket.com",
    brandColor: "#16a34a", // green-600
  },
  "flying-hanuman": {
    senderEmail: "support@flyinghanuman.com",
    senderName: "Flying Hanuman",
    supportEmail: "support@flyinghanuman.com",
    brandColor: "#ea580c", // orange-600
  },
  "sky-rock": {
    senderEmail: "support@skyrock.app",
    senderName: "Sky Rock Khao Lak",
    supportEmail: "support@skyrock.app",
    brandColor: "#0ea5e9", // sky-500
  },
  "hanuman-luge": {
    senderEmail: "support@hanumanluge.com",
    senderName: "Hanuman Luge",
    supportEmail: "support@hanumanluge.com",
    brandColor: "#9333ea", // purple-600
  },
  "banana-beach": {
    senderEmail: "support@bananabeach.app",
    senderName: "Banana Beach",
    supportEmail: "support@bananabeach.app",
    brandColor: "#eab308", // yellow-500
  },
};

/**
 * Default email configuration for unknown websites
 */
export const defaultEmailConfig: BrandEmailConfig = {
  senderEmail: "noreply@onebooking.co",
  senderName: "OneBooking",
  supportEmail: "support@onebooking.co",
  brandColor: "#1a237e", // indigo
};

/**
 * Get email configuration for a specific website
 * @param websiteId - The website ID (e.g., "hanuman-world")
 * @returns BrandEmailConfig for the website or default config
 */
export function getEmailConfig(websiteId: string | null | undefined): BrandEmailConfig {
  if (!websiteId) {
    return defaultEmailConfig;
  }
  return brandEmailConfigs[websiteId] || defaultEmailConfig;
}

/**
 * Get the formatted "from" address for Resend
 * @param websiteId - The website ID
 * @param customName - Optional custom sender name override
 * @returns Formatted email string like "Hanuman World <support@hanumanworldphuket.com>"
 */
export function getFromAddress(websiteId: string | null | undefined, customName?: string): string {
  const config = getEmailConfig(websiteId);
  const name = customName || config.senderName;
  return `${name} <${config.senderEmail}>`;
}
