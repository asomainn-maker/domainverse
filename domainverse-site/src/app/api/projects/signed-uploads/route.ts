import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "projects";
const MAX_BATCH = 50;

function isSafePath(path: unknown): path is string {
  return typeof path === "string" && path.length > 0 && path.length <= 240 && !path.startsWith("/") && !path.includes("\\") && !path.split("/").some((part) => !part || part === "." || part === "..");
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });

  const { slug, paths } = await req.json();
  if (typeof slug !== "string" || !Array.isArray(paths) || !paths.length || paths.length > MAX_BATCH || !paths.every(isSafePath)) {
    return NextResponse.json({ error: "Yanlış upload sorğusu" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("user_id").eq("slug", slug).maybeSingle();
  if (!project || project.user_id !== user.id) return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });

  try {
    const uploads = await Promise.all(paths.map(async (path) => {
      const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(`${slug}/${path}`);
      if (error || !data) throw new Error(error?.message ?? "Upload link yaradıla bilmədi");
      return { relativePath: path, path: data.path, token: data.token };
    }));
    return NextResponse.json({ uploads });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload link yaradıla bilmədi" }, { status: 400 });
  }
}
