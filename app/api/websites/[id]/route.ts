import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ApiResponse, Website } from "@/types";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: website, error } = await supabase
      .from("websites")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !website) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Website not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Website>>({
      success: true,
      data: website as Website,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const allowedFields = [
      "name",
      "domain",
      "webhook_url",
      "logo_url",
      "is_active",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No valid fields to update", code: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const { data: website, error } = await supabaseAdmin
      .from("websites")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json<ApiResponse<Website>>({
      success: true,
      data: website as Website,
      message: "Website updated successfully",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
