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

  const paths: string[] = [];
  async function visit(prefix: string) {
    const { data: list } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
    for (const item of list ?? []) {
      const path = `${prefix}/${item.name}`;
      if (item.id) paths.push(path);
      else await visit(path);
    }
  }
  await visit(project.slug);
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);

  const { error } = await admin.from("projects").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
