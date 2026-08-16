import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 0;

export default async function ExplorePage() {
  const admin = createAdminClient();

  const { data: projects } = await admin
    .from("projects")
    .select("id, slug, title, description, view_count, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(60);

  const ownerIds = [...new Set((projects ?? []).map((p) => p.user_id))];
  let owners: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username")
      .in("id", ownerIds);
    owners = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.username]));
  }

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
      <header className="max-w-5xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          domainverse
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/explore" className="text-paper">
            Kəşf et
          </Link>
          <Link href="/login" className="text-mist hover:text-paper transition-colors">
            Giriş
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-violet text-ink px-4 py-2 font-medium hover:bg-violet-soft transition-colors"
          >
            Qeydiyyat
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-amber mb-2">Buraxılış meydanı</p>
        <h1 className="font-display text-3xl font-semibold mb-8">Bütün layihələr</h1>

        {(!projects || projects.length === 0) && (
          <p className="text-sm text-mist border border-dashed border-ink-line rounded-2xl p-8 text-center">
            Hələ heç bir layihə buraxılmayıb.
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          {(projects ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}`}
              className="block rounded-2xl border border-ink-line bg-ink-raised p-5 hover:border-violet transition-colors"
            >
              <p className="font-display text-lg font-semibold text-paper mb-1 truncate">{p.title}</p>
              {owners[p.user_id] && (
                <p className="text-xs text-mist mb-2">@{owners[p.user_id]}</p>
              )}
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
