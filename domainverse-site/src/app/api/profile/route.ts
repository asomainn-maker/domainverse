import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/project-utils";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json({ username: profile?.username ?? null });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  const { username } = await req.json();
  if (typeof username !== "string" || !username.trim()) {
    return NextResponse.json({ error: "İstifadəçi adı tələb olunur" }, { status: 400 });
  }

  const clean = slugify(username.trim()).slice(0, 30);
  if (!clean) {
    return NextResponse.json({ error: "Etibarsız istifadəçi adı" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .maybeSingle();
  if (taken && taken.id !== user.id) {
    return NextResponse.json({ error: "Bu istifadəçi adı artıq götürülüb" }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ username: clean })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ username: clean });
}
