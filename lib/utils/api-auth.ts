import { createClient } from "@supabase/supabase-js";
import type { Website } from "@/types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function validateApiKey(
  apiKey: string | null
): Promise<Website | null> {
  if (!apiKey) {
    return null;
  }

  const { data: website, error } = await supabaseAdmin
    .from("websites")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single();

  if (error || !website) {
    return null;
  }

  return website as Website;
}

export function getApiKeyFromHeaders(headers: Headers): string | null {
  return headers.get("X-API-Key") || headers.get("x-api-key");
}
