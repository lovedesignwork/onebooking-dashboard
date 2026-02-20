import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateApiKey, generateWebhookSecret } from "@/lib/utils/signature";
import type { ApiResponse, Website } from "@/types";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    const { data: websites, error } = await supabase
      .from("websites")
      .select("*")
      .order("name");

    if (error) {
      throw error;
    }

    return NextResponse.json<ApiResponse<Website[]>>({
      success: true,
      data: websites as Website[],
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized", code: "AUTH_FAILED" },
        { status: 401 }
      );
    }

    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminUser || !["superadmin", "admin"].includes(adminUser.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.id || !body.name || !body.domain) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: id, name, domain",
          code: "INVALID_PAYLOAD",
        },
        { status: 400 }
      );
    }

    const prefix = body.id.substring(0, 2);
    const apiKey = generateApiKey(prefix);
    const webhookSecret = generateWebhookSecret();

    const websiteData = {
      id: body.id,
      name: body.name,
      domain: body.domain,
      api_key: apiKey,
      webhook_url: body.webhook_url || null,
      webhook_secret: webhookSecret,
      logo_url: body.logo_url || null,
      is_active: true,
    };

    const { data: website, error } = await supabaseAdmin
      .from("websites")
      .insert(websiteData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Website with this ID already exists",
            code: "DUPLICATE",
          },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json<ApiResponse<Website>>(
      {
        success: true,
        data: website as Website,
        message: "Website registered successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
