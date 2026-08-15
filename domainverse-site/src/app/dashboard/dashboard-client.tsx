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

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", file);

    const res = await fetch("/api/projects/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error || "Yükləmə uğursuz oldu");
      return;
    }

    setProjects((prev) => [data.project, ...prev]);
    setTitle("");
    setFile(null);
    (document.getElementById("file-input") as HTMLInputElement).value = "";
  }

  async function handleUpdate(project: Project, newFile: File) {
    const formData = new FormData();
    formData.append("slug", project.slug);
    formData.append("file", newFile);

    const res = await fetch("/api/projects/upload", {
      method: "PUT",
      body: formData,
    });
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
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span>{email}</span>
          <button onClick={handleLogout} className="underline">
            Çıxış
          </button>
        </div>
      </div>

      <form onSubmit={handleUpload} className="border rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Yeni layihə yüklə</h2>
        <input
          type="text"
          placeholder="Layihə adı"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <input
          id="file-input"
          type="file"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className="w-full text-sm"
        />
        <p className="text-xs text-neutral-500">
          Qovluğunuzu (HTML + şəkillər) .zip formatında sıxıb yükləyin. İçində index.html olmalıdır.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="bg-black text-white rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {uploading ? "Yüklənir..." : "Yüklə"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-medium">Layihələriniz</h2>
        {projects.length === 0 && (
          <p className="text-sm text-neutral-500">Hələ heç bir layihə yoxdur.</p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {renamingId === p.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="border rounded-md px-2 py-1 text-sm"
                  />
                  <button onClick={() => handleRename(p)} className="text-sm underline">
                    Saxla
                  </button>
                  <button onClick={() => setRenamingId(null)} className="text-sm text-neutral-500">
                    İmtina
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-medium truncate">{p.title}</p>
                  <a
                    href={`/links/${p.slug}`}
                    target="_blank"
                    className="text-sm text-blue-600 underline break-all"
                  >
                    /links/{p.slug}
                  </a>
                </>
              )}
            </div>
            {renamingId !== p.id && (
              <div className="flex items-center gap-3 text-sm shrink-0">
                <label className="underline cursor-pointer">
                  Yenilə
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpdate(p, f);
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    setRenamingId(p.id);
                    setRenameValue(p.title);
                  }}
                  className="underline"
                >
                  Adını dəyiş
                </button>
                <button onClick={() => handleDelete(p)} className="underline text-red-600">
                  Sil
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
