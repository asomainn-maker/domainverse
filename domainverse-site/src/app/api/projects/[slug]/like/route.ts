import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  const { slug } = await params;
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });
  }

  const { data: existing } = await admin
    .from("likes")
    .select("project_id")
    .eq("project_id", project.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin.from("likes").delete().eq("project_id", project.id).eq("user_id", user.id);
  } else {
    await admin.from("likes").insert({ project_id: project.id, user_id: user.id });
  }

  const { count } = await admin
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  return NextResponse.json({ liked: !existing, likeCount: count ?? 0 });
}
