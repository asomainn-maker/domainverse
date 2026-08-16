import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "projects";

async function collectFiles(
  admin: ReturnType<typeof createAdminClient>,
  prefix: string
): Promise<string[]> {
  const files: string[] = [];
  const { data: list } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000 });
  for (const item of list ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id) {
      files.push(path);
    } else {
      files.push(...(await collectFiles(admin, path)));
    }
  }
  return files;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("id, title")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }

  const paths = await collectFiles(admin, slug);
  if (paths.length === 0) {
    return new NextResponse("Empty project", { status: 404 });
  }

  const zip = new JSZip();
  for (const path of paths) {
    const { data, error } = await admin.storage.from(BUCKET).download(path);
    if (error || !data) continue;
    const relPath = path.slice(slug.length + 1);
    zip.file(relPath, await data.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
    },
  });
}
