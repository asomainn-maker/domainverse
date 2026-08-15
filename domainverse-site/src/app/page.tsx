import Link from "next/link";

function LaunchTicket() {
  return (
    <div className="flex items-stretch rounded-2xl overflow-hidden border border-ink-line bg-ink-raised shadow-[0_30px_80px_-30px_rgba(139,124,255,0.35)]">
      <div className="flex-1 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-mist mb-3">Layihə</p>
        <p className="font-display text-2xl font-semibold text-paper mb-1">meselcun-portfolio</p>
        <p className="font-mono text-sm text-violet-soft break-all">domainverse.store/links/meselcun-portfolio</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-mist">
          <span className="h-2 w-2 rounded-full bg-amber" />
          Canlı · SSL aktiv
        </div>
      </div>
      <div className="w-px border-l border-dashed border-ink-line ticket-notch" />
      <div className="w-28 flex flex-col items-center justify-center gap-2 p-4 bg-ink">
        <span className="font-display text-3xl text-amber">→</span>
        <span className="text-[10px] uppercase tracking-widest text-mist text-center">Baxış üçün</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen grain">
      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <span className="font-display text-lg font-semibold tracking-tight">domainverse</span>
        <nav className="flex items-center gap-3 text-sm">
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

      <main className="max-w-6xl mx-auto px-6 pt-20 pb-28 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber mb-5">Şəxsi buraxılış meydanı</p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] mb-6">
            Layihəni yüklə.
            <br />
            Link al.
            <br />
            <span className="text-violet-soft">Dünyaya göstər.</span>
          </h1>
          <p className="text-mist text-lg leading-relaxed max-w-md mb-8">
            Qovluğunu zip et, yüklə — sistem sənə paylaşıla bilən link versin.
            Sonra istədiyin an yenilə, adını dəyiş, ya da sil.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-amber text-ink px-6 py-3 font-semibold hover:brightness-95 transition"
            >
              İndi başla
            </Link>
            <Link href="/login" className="text-paper/80 hover:text-paper underline underline-offset-4 text-sm">
              Artıq hesabım var
            </Link>
          </div>
        </div>

        <LaunchTicket />
      </main>

      <footer className="border-t border-ink-line">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-mist flex justify-between">
          <span>domainverse.store</span>
          <span>Layihələr üçün buraxılış meydanı</span>
        </div>
      </footer>
    </div>
  );
}
