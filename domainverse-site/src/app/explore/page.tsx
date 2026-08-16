import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ExplorePage() {
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="min-h-screen grain relative overflow-hidden">
      <div className="glow-radial" />
      <header className="relative max-w-5xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          domainverse
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/explore" className="text-paper">
            Kəşf et
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-violet text-ink px-4 py-2 font-medium hover:bg-violet-soft transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-mist hover:text-paper transition-colors">
                Giriş
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-violet text-ink px-4 py-2 font-medium hover:bg-violet-soft transition-colors"
              >
                Qeydiyyat
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-amber mb-2">Buraxılış meydanı</p>
        <h1 className="font-display text-3xl font-semibold mb-8">Bütün layihələr</h1>

        {(!projects || projects.length === 0) && (
          <div className="border border-dashed border-ink-line rounded-2xl p-10 text-center">
            <p className="text-2xl mb-2 opacity-60">◌</p>
            <p className="text-sm text-mist">Hələ heç bir layihə buraxılmayıb — birinci ol.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          {(projects ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}`}
              className="card-lift block overflow-hidden rounded-2xl border border-ink-line bg-ink-raised"
            >
              <div className="flex items-center gap-2 border-b border-ink-line px-4 py-2.5">
                <span className="chrome-dots"><span/><span/><span/></span>
                <span className="ml-2 truncate font-mono text-[10px] text-mist">
                  domainverse.store/p/{p.slug}
                </span>
              </div>
              <div className="p-5">
                <p className="font-display text-lg font-semibold text-paper mb-1 truncate">{p.title}</p>
                {owners[p.user_id] && (
                  <p className="text-xs text-violet-soft mb-2">@{owners[p.user_id]}</p>
                )}
                {p.description && (
                  <p className="text-sm text-mist line-clamp-2 mb-3">{p.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-mist">
                  <span>♥ {likeCounts[p.id] ?? 0}</span>
                  <span>👁 {p.view_count ?? 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
