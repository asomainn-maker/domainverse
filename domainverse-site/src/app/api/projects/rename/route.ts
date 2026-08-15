import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  const { id, title } = await req.json();
  if (!id || !title?.trim()) {
    return NextResponse.json({ error: "id və title tələb olunur" }, { status: 400 });
  }

  // RLS on the projects table should restrict updates to rows where user_id = auth.uid().
  const { error } = await supabase
    .from("projects")
    .update({ title: title.trim() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
