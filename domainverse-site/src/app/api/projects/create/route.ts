import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomSuffix, slugify } from "@/lib/project-utils";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { title } = await req.json();
  if (typeof title !== "string" || !title.trim() || title.trim().length > 80) {
    return NextResponse.json({ error: "Layihə adı 1-80 simvol olmalıdır" }, { status: 400 });
  }

  const admin = createAdminClient();
  let slug = slugify(title);
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data: existing } = await admin.from("projects").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${slugify(title)}-${randomSuffix()}`;
  }

  const { data: project, error } = await admin
    .from("projects")
    .insert({ user_id: user.id, slug, title: title.trim() })
    .select("id, slug, title, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ project });
}
