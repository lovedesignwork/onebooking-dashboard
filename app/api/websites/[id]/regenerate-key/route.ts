import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

function generateApiKey(websiteId: string): string {
  const prefix = websiteId
    .split("-")
    .map((word) => word[0])
    .join("")
    .toLowerCase();
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `${prefix}_sk_live_${randomBytes}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verify user is authenticated
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if website exists
    const { data: website, error: fetchError } = await supabaseAdmin
      .from("websites")
      .select("id, name")
      .eq("id", id)
      .single();

    if (fetchError || !website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404 }
      );
    }

    // Generate new API key
    const newApiKey = generateApiKey(id);

    // Update the website with new key
    const { error: updateError } = await supabaseAdmin
      .from("websites")
      .update({
        api_key: newApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Regenerate Key] Update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key regenerated successfully",
    });
  } catch (error) {
    console.error("[Regenerate Key] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
