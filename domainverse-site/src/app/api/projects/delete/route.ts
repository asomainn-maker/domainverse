import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "projects";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id tələb olunur" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("id, slug, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });
  }

  const { data: list } = await admin.storage
    .from(BUCKET)
    .list(project.slug, { limit: 1000 });
  if (list && list.length > 0) {
    await admin.storage
      .from(BUCKET)
      .remove(list.map((f) => `${project.slug}/${f.name}`));
  }

  const { error } = await admin.from("projects").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
