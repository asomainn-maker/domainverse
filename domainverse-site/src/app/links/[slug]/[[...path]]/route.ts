import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { contentTypeFor } from "@/lib/project-utils";

const BUCKET = "projects";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; path?: string[] }> }
) {
  const { slug, path } = await params;
  const relPath = path && path.length > 0 ? path.join("/") : "index.html";

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .download(`${slug}/${relPath}`);

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await data.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentTypeFor(relPath),
      "Cache-Control": "public, max-age=60",
    },
  });
}
