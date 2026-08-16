import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, randomSuffix } from "@/lib/project-utils";

export async function ensureProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string
): Promise<string> {
  const { data: existing } = await admin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing.username;

  const base = slugify(email.split("@")[0] || "user").slice(0, 20) || "user";
  let username = base;

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!taken) break;
    username = `${base}-${randomSuffix()}`;
  }

  const { data: created, error } = await admin
    .from("profiles")
    .insert({ id: userId, username })
    .select("username")
    .single();

  if (error) {
    // Race condition fallback: someone else created it between check and insert.
    const { data: retry } = await admin
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();
    if (retry) return retry.username;
    throw error;
  }

  return created.username;
}
