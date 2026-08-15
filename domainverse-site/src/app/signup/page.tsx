"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setDone(true);
      }
    } catch {
      setError("Şəbəkə xətası. Bir az sonra yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grain flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-sm text-mist hover:text-paper mb-8 inline-block">
          ← domainverse
        </Link>

        {done ? (
          <div className="rounded-2xl border border-ink-line bg-ink-raised p-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-amber mb-3">Bir addım qalıb</p>
            <h1 className="font-display text-xl font-semibold mb-3">Emailinizi yoxlayın</h1>
            <p className="text-sm text-mist leading-relaxed">
              <span className="font-mono text-paper">{email}</span> ünvanına göndərilən
              linkə klikləyərək hesabınızı aktivləşdirin.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-line bg-ink-raised p-8 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber mb-2">Qeydiyyat</p>
              <h1 className="font-display text-2xl font-semibold">Buraxılışa başla</h1>
            </div>

            <div className="space-y-3 pt-2">
              <input
                type="email"
                required
                placeholder="email@nümunə.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-paper placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-violet"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Şifrə (min 6 simvol)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-paper placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-violet"
              />
            </div>

            {error && (
              <p className="text-sm text-amber bg-amber/10 border border-amber/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-violet text-ink font-semibold px-4 py-3 text-sm hover:bg-violet-soft transition disabled:opacity-50"
            >
              {loading ? "Göndərilir…" : "Qeydiyyatdan keç"}
            </button>

            <p className="text-sm text-mist text-center pt-1">
              Artıq hesabınız var?{" "}
              <Link href="/login" className="text-violet-soft underline underline-offset-4">
                Giriş
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
