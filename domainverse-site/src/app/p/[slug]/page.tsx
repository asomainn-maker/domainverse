import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProjectDetailClient from "./project-detail-client";

export const revalidate = 0;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("id, slug, title, description, view_count, created_at, user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  // Fire-and-forget view increment.
  admin
    .from("projects")
    .update({ view_count: (project.view_count ?? 0) + 1 })
    .eq("id", project.id)
    .then(() => {});

  const { data: owner } = await admin
    .from("profiles")
    .select("username")
    .eq("id", project.user_id)
    .maybeSingle();

  const { count: likeCount } = await admin
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("project_id", project.id);

  const { data: comments } = await admin
    .from("comments")
    .select("id, body, created_at, user_id")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const commentUserIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  let commentUsernames: Record<string, string> = {};
  if (commentUserIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username")
      .in("id", commentUserIds);
    commentUsernames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let liked = false;
  if (user) {
    const { data: myLike } = await admin
      .from("likes")
      .select("project_id")
      .eq("project_id", project.id)
      .eq("user_id", user.id)
      .maybeSingle();
    liked = !!myLike;
  }

  return (
    <div className="min-h-screen grain">
      <header className="max-w-3xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          domainverse
        </Link>
        <Link href="/explore" className="text-sm text-mist hover:text-paper">
          ← Kəşf et
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-ink-line bg-ink-raised p-8 mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-amber mb-2">Layihə</p>
          <h1 className="font-display text-3xl font-semibold mb-2">{project.title}</h1>
          {owner?.username && (
            <Link href={`/u/${owner.username}`} className="text-sm text-violet-soft hover:underline">
              @{owner.username}
            </Link>
          )}
          {project.description && (
            <p className="text-mist mt-4 leading-relaxed">{project.description}</p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <a
              href={`/links/${project.slug}`}
              target="_blank"
              className="rounded-full bg-amber text-ink font-semibold px-5 py-2.5 text-sm hover:brightness-95 transition"
            >
              Canlı bax
            </a>
            <a
              href={`/api/projects/${project.slug}/download`}
              className="rounded-full border border-ink-line text-paper px-5 py-2.5 text-sm hover:border-violet transition"
            >
              Endir (.zip)
            </a>
          </div>
        </div>

        <ProjectDetailClient
          slug={project.slug}
          isLoggedIn={!!user}
          initialLiked={liked}
          initialLikeCount={likeCount ?? 0}
          initialViewCount={(project.view_count ?? 0) + 1}
          initialComments={(comments ?? []).map((c) => ({
            id: c.id,
            body: c.body,
            created_at: c.created_at,
            username: commentUsernames[c.user_id] ?? "istifadəçi",
          }))}
        />
      </main>
    </div>
  );
}
