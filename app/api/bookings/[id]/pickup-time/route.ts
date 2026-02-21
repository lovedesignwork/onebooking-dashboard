import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getFromAddress, getEmailConfig } from "@/lib/email/config";
import type { ApiResponse } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { pickup_time, send_email } = body;

    if (!pickup_time || !/^\d{2}:\d{2}$/.test(pickup_time)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid pickup time format. Use HH:MM" },
        { status: 400 }
      );
    }

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, website:websites(*)")
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ pickup_time, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("[Pickup Time] Update error:", updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to update pickup time" },
        { status: 500 }
      );
    }

    if (send_email) {
      if (!resend) {
        return NextResponse.json<ApiResponse>(
          {
            success: true,
            message: "Pickup time saved but email not sent (RESEND_API_KEY not configured)",
            data: { pickup_time, email_sent: false },
          },
          { status: 200 }
        );
      }

      const activityDate = new Date(booking.activity_date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const emailConfig = getEmailConfig(booking.website_id);
      const websiteName = booking.website?.name || emailConfig.senderName;
      const fromAddress = getFromAddress(booking.website_id, websiteName);

      try {
        await resend.emails.send({
          from: fromAddress,
          to: booking.customer_email,
          subject: `Your Pickup Time Confirmed - ${booking.booking_ref}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: ${emailConfig.brandColor}; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Pickup Time Confirmed</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your transport is scheduled!</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${booking.customer_name}</strong>,
              </p>
              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                Great news! Your pickup time has been confirmed for your upcoming tour. Please find the details below:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date</span><br>
                          <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${activityDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">⏰ Pickup Time</span><br>
                          <span style="color: ${emailConfig.brandColor}; font-size: 24px; font-weight: 700;">${pickup_time}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📍 Pickup Location</span><br>
                          <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${booking.hotel_name || "Your hotel"}</span>
                          ${booking.room_number ? `<br><span style="color: #64748b; font-size: 14px;">Room: ${booking.room_number}</span>` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">🎫 Booking Reference</span><br>
                          <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${booking.booking_ref}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                      <strong>⚠️ Important:</strong> Please be ready at the hotel lobby <strong>5-10 minutes before</strong> the pickup time. Our driver will be waiting for you.
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Your Booking Summary:</p>
                    <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.8;">
                      📦 Package: <strong>${booking.package_name}</strong><br>
                      👥 Guests: <strong>${booking.guest_count} player${booking.guest_count > 1 ? "s" : ""}${booking.non_players > 0 ? ` + ${booking.non_players} non-player${booking.non_players > 1 ? "s" : ""}` : ""}</strong><br>
                      🕐 Time Slot: <strong>${booking.time_slot}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">
                If you have any questions or need to make changes, please don't hesitate to contact us.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 13px; margin: 0;">
                Thank you for choosing ${websiteName}!<br>
                We look forward to seeing you soon.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });

        await supabase.from("sync_logs").insert({
          booking_id: id,
          website_id: booking.website_id,
          direction: "outbound",
          event_type: "pickup_time_notification",
          payload: { pickup_time, customer_email: booking.customer_email },
          status: "success",
        });

        return NextResponse.json<ApiResponse>({
          success: true,
          message: "Pickup time saved and email sent successfully",
          data: { pickup_time, email_sent: true },
        });
      } catch (emailError) {
        console.error("[Pickup Time] Email error:", emailError);

        await supabase.from("sync_logs").insert({
          booking_id: id,
          website_id: booking.website_id,
          direction: "outbound",
          event_type: "pickup_time_notification",
          payload: { pickup_time, customer_email: booking.customer_email },
          status: "failed",
          error_message: emailError instanceof Error ? emailError.message : "Unknown email error",
        });

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            message: "Pickup time saved but email failed to send",
            data: { pickup_time, email_sent: false },
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Pickup time saved successfully",
      data: { pickup_time, email_sent: false },
    });
  } catch (error) {
    console.error("[Pickup Time] Error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
