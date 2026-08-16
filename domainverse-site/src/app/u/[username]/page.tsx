import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 0;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, username, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: projects } = await admin
    .from("projects")
    .select("id, slug, title, description, view_count, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((p) => p.id);
  let likeCounts: Record<string, number> = {};
  if (projectIds.length > 0) {
    const { data: likes } = await admin.from("likes").select("project_id").in("project_id", projectIds);
    likeCounts = (likes ?? []).reduce<Record<string, number>>((acc, l) => {
      acc[l.project_id] = (acc[l.project_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (
    <div className="min-h-screen grain">
      <header className="max-w-4xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          domainverse
        </Link>
        <Link href="/explore" className="text-sm text-mist hover:text-paper">
          ← Kəşf et
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber mb-2">Profil</p>
          <h1 className="font-display text-3xl font-semibold">@{profile.username}</h1>
          <p className="text-sm text-mist mt-1">{projects?.length ?? 0} layihə</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {(projects ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}`}
              className="block rounded-2xl border border-ink-line bg-ink-raised p-5 hover:border-violet transition-colors"
            >
              <p className="font-display text-lg font-semibold text-paper mb-1 truncate">{p.title}</p>
              {p.description && (
                <p className="text-sm text-mist line-clamp-2 mb-3">{p.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-mist">
                <span>♥ {likeCounts[p.id] ?? 0}</span>
                <span>👁 {p.view_count ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
