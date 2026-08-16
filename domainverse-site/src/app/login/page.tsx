"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Şəbəkə xətası. Bir az sonra yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grain relative overflow-hidden flex items-center justify-center p-6">
      <div className="glow-radial" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="font-display text-sm text-mist hover:text-paper mb-8 inline-block">
          ← domainverse
        </Link>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-line bg-ink-raised p-8 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber mb-2">Xoş gəldiniz</p>
            <h1 className="font-display text-2xl font-semibold">Giriş edin</h1>
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
              placeholder="Şifrə"
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
            {loading ? "Yoxlanılır…" : "Daxil ol"}
          </button>

          <div className="flex items-center gap-3 py-1 text-xs text-mist">
            <span className="h-px flex-1 bg-ink-line" /> və ya <span className="h-px flex-1 bg-ink-line" />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-full border border-ink-line bg-ink px-4 py-3 text-sm font-medium hover:border-violet transition disabled:opacity-50"
          >
            Google ilə davam et
          </button>

          <p className="text-sm text-mist text-center pt-1">
            Hesabınız yoxdur?{" "}
            <Link href="/signup" className="text-violet-soft underline underline-offset-4">
              Qeydiyyat
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
