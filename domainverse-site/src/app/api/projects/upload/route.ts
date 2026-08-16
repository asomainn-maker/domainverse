import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify, randomSuffix, contentTypeFor, stripCommonRoot } from "@/lib/project-utils";

const BUCKET = "projects";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 300;

function safeProjectPath(path: string) {
  return path && !path.startsWith("/") && !path.includes("\\") && !path.split("/").some((part) => !part || part === "." || part === "..");
}

async function extractAndUpload(
  admin: ReturnType<typeof createAdminClient>,
  zipFile: File,
  slug: string
) {
  const buffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const entries = Object.values(zip.files).filter((f) => !f.dir);
  if (entries.length === 0) {
    throw new Error("Zip faylı boşdur");
  }
  if (entries.length > MAX_FILES) {
    throw new Error(`Zip faylında ən çox ${MAX_FILES} fayl ola bilər`);
  }

  const stripRoot = stripCommonRoot(entries.map((e) => e.name));
  const normalizedPaths = entries.map((e) => stripRoot(e.name));
  if (normalizedPaths.some((path) => !safeProjectPath(path))) {
    throw new Error("Zip faylında təhlükəsiz olmayan fayl adı var");
  }

  const hasIndex = normalizedPaths.some(
    (p) => p.toLowerCase() === "index.html"
  );
  if (!hasIndex) {
    throw new Error("Zip faylının kökündə index.html tapılmadı");
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const relPath = normalizedPaths[i];
    const content = await entry.async("arraybuffer");
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(`${slug}/${relPath}`, content, {
        contentType: contentTypeFor(relPath),
        upsert: true,
      });
    if (error) {
      throw new Error(`Yükləmə xətası (${relPath}): ${error.message}`);
    }
  }
}

async function clearFolder(admin: ReturnType<typeof createAdminClient>, slug: string) {
  const paths: string[] = [];
  async function visit(prefix: string) {
    const { data: list } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
    for (const item of list ?? []) {
      const path = `${prefix}/${item.name}`;
      if (item.id) paths.push(path);
      else await visit(path);
    }
  }
  await visit(slug);
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  const formData = await req.formData();
  const title = (formData.get("title") as string | null)?.trim();
  const description = ((formData.get("description") as string | null) ?? "").trim().slice(0, 500);
  const file = formData.get("file") as File | null;

  if (!title || !file) {
    return NextResponse.json({ error: "Ad və fayl tələb olunur" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "ZIP faylı 25 MB-dan böyük ola bilməz" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure a unique slug.
  let slug = slugify(title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${slugify(title)}-${randomSuffix()}`;
  }

  try {
    await extractAndUpload(admin, file, slug);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Yükləmə uğursuz oldu" },
      { status: 400 }
    );
  }

  const { data: project, error: insertError } = await admin
    .from("projects")
    .insert({ user_id: user.id, slug, title, description: description || null })
    .select("id, slug, title, description, view_count, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ project });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  const formData = await req.formData();
  const slug = formData.get("slug") as string | null;
  const file = formData.get("file") as File | null;

  if (!slug || !file) {
    return NextResponse.json({ error: "slug və fayl tələb olunur" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "ZIP faylı 25 MB-dan böyük ola bilməz" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("id, user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });
  }

  try {
    await clearFolder(admin, slug);
    await extractAndUpload(admin, file, slug);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Yeniləmə uğursuz oldu" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
