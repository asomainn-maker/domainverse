"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
};

function ProjectTicket({
  project,
  onUpdate,
  onRename,
  onDelete,
}: {
  project: Project;
  onUpdate: (file: File) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-stretch rounded-2xl overflow-hidden border border-ink-line bg-ink-raised">
      <div className="flex-1 p-5 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.2em] text-mist mb-2">Layihə</p>
        <p className="font-display text-lg font-semibold text-paper truncate mb-1">{project.title}</p>
        <a
          href={`/links/${project.slug}`}
          target="_blank"
          className="font-mono text-xs text-violet-soft break-all hover:underline"
        >
          domainverse.store/links/{project.slug}
        </a>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-mist">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          Canlı
        </div>
      </div>
      <div className="w-px border-l border-dashed border-ink-line ticket-notch" />
      <div className="w-36 flex flex-col justify-center gap-2 p-4 bg-ink text-xs">
        <label className="text-mist hover:text-paper cursor-pointer transition-colors">
          Yenilə
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpdate(f);
            }}
          />
        </label>
        <button onClick={onRename} className="text-left text-mist hover:text-paper transition-colors">
          Adını dəyiş
        </button>
        <button onClick={onDelete} className="text-left text-amber/80 hover:text-amber transition-colors">
          Sil
        </button>
      </div>
    </div>
  );
}

export default function DashboardClient({
  email,
  initialProjects,
}: {
  email: string;
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("file", file);

      const res = await fetch("/api/projects/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Yükləmə uğursuz oldu");
        return;
      }

      setProjects((prev) => [data.project, ...prev]);
      setTitle("");
      setFile(null);
      const input = document.getElementById("file-input") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch {
      setError("Şəbəkə xətası. Bir az sonra yenidən cəhd edin.");
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdate(project: Project, newFile: File) {
    const formData = new FormData();
    formData.append("slug", project.slug);
    formData.append("file", newFile);
    const res = await fetch("/api/projects/upload", { method: "PUT", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Yeniləmə uğursuz oldu");
    }
  }

  async function handleRename(project: Project) {
    if (!renameValue.trim()) return;
    const res = await fetch("/api/projects/rename", {
      method: "POST",
      body: JSON.stringify({ id: project.id, title: renameValue.trim() }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Adı dəyişmək uğursuz oldu");
      return;
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, title: renameValue.trim() } : p))
    );
    setRenamingId(null);
  }

  async function handleDelete(project: Project) {
    if (!confirm(`"${project.title}" silinsin?`)) return;
    const res = await fetch("/api/projects/delete", {
      method: "POST",
      body: JSON.stringify({ id: project.id }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Silmək uğursuz oldu");
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
  }

  return (
    <div className="min-h-screen grain">
      <header className="max-w-4xl mx-auto px-6 pt-8 flex items-center justify-between">
        <span className="font-display text-lg font-semibold tracking-tight">domainverse</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-mist">{email}</span>
          <button onClick={handleLogout} className="text-mist hover:text-paper underline underline-offset-4">
            Çıxış
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber mb-2">Buraxılış meydanı</p>
          <h1 className="font-display text-3xl font-semibold">Sizin layihələriniz</h1>
        </div>

        <form onSubmit={handleUpload} className="rounded-2xl border border-ink-line bg-ink-raised p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Yeni layihə buraxın</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Layihə adı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-violet"
            />
            <input
              id="file-input"
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm text-mist file:mr-3 file:rounded-full file:border-0 file:bg-violet file:text-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold"
            />
          </div>
          <p className="text-xs text-mist">
            Qovluğunuzu (HTML + şəkillər) .zip formatında sıxıb yükləyin. İçində index.html olmalıdır.
          </p>
          {error && (
            <p className="text-sm text-amber bg-amber/10 border border-amber/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={uploading}
            className="rounded-full bg-amber text-ink font-semibold px-5 py-2.5 text-sm hover:brightness-95 transition disabled:opacity-50"
          >
            {uploading ? "Buraxılır…" : "Buraxılışa göndər"}
          </button>
        </form>

        <div className="space-y-4">
          {projects.length === 0 && (
            <p className="text-sm text-mist border border-dashed border-ink-line rounded-2xl p-8 text-center">
              Hələ heç bir layihə buraxılmayıb.
            </p>
          )}
          {renamingId &&
            (() => {
              const p = projects.find((x) => x.id === renamingId);
              if (!p) return null;
              return (
                <div className="rounded-2xl border border-violet bg-ink-raised p-5 flex items-center gap-3">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet"
                  />
                  <button
                    onClick={() => handleRename(p)}
                    className="rounded-full bg-violet text-ink text-xs font-semibold px-4 py-2"
                  >
                    Saxla
                  </button>
                  <button onClick={() => setRenamingId(null)} className="text-xs text-mist">
                    İmtina
                  </button>
                </div>
              );
            })()}
          {projects
            .filter((p) => p.id !== renamingId)
            .map((p) => (
              <ProjectTicket
                key={p.id}
                project={p}
                onUpdate={(f) => handleUpdate(p, f)}
                onRename={() => {
                  setRenamingId(p.id);
                  setRenameValue(p.title);
                }}
                onDelete={() => handleDelete(p)}
              />
            ))}
        </div>
      </main>
    </div>
  );
}
