import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  const { data: comments } = await admin
    .from("comments")
    .select("id, body, created_at, user_id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const userIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  let usernames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username")
      .in("id", userIds);
    usernames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
  }

  return NextResponse.json({
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      username: usernames[c.user_id] ?? "istifadəçi",
    })),
  });
}

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
  const { body } = await req.json();
  if (typeof body !== "string" || !body.trim() || body.trim().length > 1000) {
    return NextResponse.json({ error: "Şərh 1-1000 simvol olmalıdır" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });
  }

  const { data: comment, error } = await admin
    .from("comments")
    .insert({ project_id: project.id, user_id: user.id, body: body.trim() })
    .select("id, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    comment: { ...comment, username: profile?.username ?? "istifadəçi" },
  });
}
