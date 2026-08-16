"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.username) setUsername(data.username);
      })
      .catch(() => {});
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const { error } = await createClient().auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    setMessage(error ? error.message : "Profil yeniləndi.");
  }

  async function saveUsername(event: React.FormEvent) {
    event.preventDefault();
    if (!username.trim()) return;
    setUsernameSaving(true);
    setUsernameMessage(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    const data = await res.json();
    setUsernameSaving(false);
    if (!res.ok) {
      setUsernameMessage(data.error || "İstifadəçi adı yenilənmədi");
      return;
    }
    setUsername(data.username);
    setUsernameMessage("İstifadəçi adı yeniləndi.");
  }

  return (
    <div className="min-h-screen grain">
      <header className="border-b border-ink-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-display text-lg font-semibold">domainverse</Link>
          <Link href="/dashboard" className="text-sm text-mist hover:text-paper">← Dashboard</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs uppercase tracking-[.25em] text-amber">Account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Settings</h1>

        <form onSubmit={saveUsername} className="mt-8 rounded-2xl border border-ink-line bg-ink-raised p-6">
          <h2 className="font-display text-xl font-semibold">İstifadəçi adı</h2>
          <p className="mt-1 text-sm text-mist">İctimai profiliniz: domainverse.store/u/{username || "..."}</p>
          <label className="mt-5 block text-sm text-mist">
            İstifadəçi adı
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="istifadeciadi"
              className="mt-2 w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-paper outline-none focus:ring-2 focus:ring-violet"
            />
          </label>
          <button disabled={usernameSaving} className="mt-4 rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">
            {usernameSaving ? "Saxlanır…" : "Dəyişiklikləri saxla"}
          </button>
          {usernameMessage && <p className="mt-3 text-sm text-mist">{usernameMessage}</p>}
        </form>

        <form onSubmit={saveProfile} className="mt-5 rounded-2xl border border-ink-line bg-ink-raised p-6">
          <h2 className="font-display text-xl font-semibold">Profil</h2>
          <label className="mt-5 block text-sm text-mist">
            Göstərilən ad
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Adınız"
              className="mt-2 w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-paper outline-none focus:ring-2 focus:ring-violet"
            />
          </label>
          <button disabled={saving} className="mt-4 rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">
            {saving ? "Saxlanır…" : "Dəyişiklikləri saxla"}
          </button>
          {message && <p className="mt-3 text-sm text-mist">{message}</p>}
        </form>

        <div className="mt-5 rounded-2xl border border-ink-line p-6 text-sm text-mist">
          <h2 className="font-display text-lg text-paper">Deploy qaydaları</h2>
          <p className="mt-2">Hər layihə 25 MB və 300 fayla qədərdir. Başlanğıc fayl olaraq <code>index.html</code> olmalıdır.</p>
        </div>
      </main>
    </div>
  );
}
