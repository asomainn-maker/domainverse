"use client";

import JSZip from "jszip";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; slug: string; title: string; created_at: string };
type DirectoryInputProps = React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string };
const directoryInputProps: DirectoryInputProps = { webkitdirectory: "" };

function projectUrl(slug: string) {
  return `${window.location.origin}/links/${slug}`;
}

export default function DashboardClient({ email, initialProjects }: { email: string; initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function packFolder(files: FileList | File[]) {
    const selected = Array.from(files);
    if (!selected.length) return;
    const zip = new JSZip();
    for (const item of selected) {
      const relativePath = item.webkitRelativePath || item.name;
      zip.file(relativePath, item);
    }
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    setFile(new File([blob], "domainverse-project.zip", { type: "application/zip" }));
  }

  async function selectFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
      setFile(files[0]);
      return;
    }
    await packFolder(files);
  }

  async function upload(project?: Project, suppliedFile?: File) {
    const activeFile = suppliedFile ?? file;
    if (!activeFile || (!project && !title.trim())) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", activeFile);
      if (project) formData.append("slug", project.slug);
      else formData.append("title", title.trim());
      const response = await fetch("/api/projects/upload", { method: project ? "PUT" : "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Yükləmə uğursuz oldu");
      if (!project) setProjects((current) => [data.project, ...current]);
      setTitle("");
      setFile(null);
      if (zipInputRef.current) zipInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Şəbəkə xətası baş verdi");
    } finally {
      setUploading(false);
    }
  }

  async function renameProject(project: Project) {
    if (!renameValue.trim()) return;
    const response = await fetch("/api/projects/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: project.id, title: renameValue.trim() }) });
    if (!response.ok) return setError((await response.json()).error || "Ad dəyişmədi");
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, title: renameValue.trim() } : item));
    setRenamingId(null);
  }

  async function deleteProject(project: Project) {
    if (!confirm(`“${project.title}” silinsin? Bu əməliyyat geri qaytarılmır.`)) return;
    const response = await fetch("/api/projects/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: project.id }) });
    if (!response.ok) return setError((await response.json()).error || "Silinmədi");
    setProjects((current) => current.filter((item) => item.id !== project.id));
  }

  async function copyLink(slug: string) {
    await navigator.clipboard.writeText(projectUrl(slug));
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <div className="min-h-screen grain">
    <header className="border-b border-ink-line bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="font-display text-lg font-semibold">domainverse</Link>
        <div className="flex items-center gap-3 text-sm"><span className="hidden text-mist sm:inline">{email}</span><button onClick={logout} className="rounded-full border border-ink-line px-3 py-1.5 text-mist hover:text-paper">Çıxış</button></div>
      </div>
    </header>
    <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[190px_1fr]">
      <aside className="flex gap-2 overflow-x-auto md:block md:space-y-2">
        <Link href="/dashboard" className="whitespace-nowrap rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-ink">Layihələr</Link>
        <a href="#new-project" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">Yeni layihə</a>
        <Link href="/dashboard/settings" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">Settings</Link>
      </aside>
      <section className="space-y-8">
        <div><p className="mb-2 text-xs uppercase tracking-[.25em] text-amber">Project hub</p><h1 className="font-display text-3xl font-semibold">Layihələriniz</h1><p className="mt-2 text-sm text-mist">Qovluğu seçin və ya ZIP faylını sürükləyin — birbaşa canlı link alın.</p></div>
        <form id="new-project" onSubmit={(event) => { event.preventDefault(); upload(); }} className="rounded-2xl border border-ink-line bg-ink-raised p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-display text-xl font-semibold">Yeni layihə</h2><span className="text-xs text-mist">index.html tələb olunur</span></div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Layihənin adı" className="mb-3 w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet" />
          <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={async (event) => { event.preventDefault(); setDragging(false); await selectFiles(event.dataTransfer.files); }} className={`rounded-xl border border-dashed p-8 text-center transition ${dragging ? "border-violet bg-violet/10" : "border-ink-line bg-ink/40"}`}>
            <p className="font-medium">{file ? file.name : "ZIP faylını buraya sürükləyin"}</p><p className="mt-1 text-xs text-mist">və ya kompüterinizdən qovluq seçin</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => zipInputRef.current?.click()} className="rounded-full border border-ink-line px-4 py-2 text-xs hover:border-violet">ZIP seç</button>
              <button type="button" onClick={() => folderInputRef.current?.click()} className="rounded-full border border-ink-line px-4 py-2 text-xs hover:border-violet">Qovluq seç</button>
            </div>
            <input ref={zipInputRef} onChange={(event) => selectFiles(event.target.files)} type="file" accept=".zip,application/zip" className="hidden" />
            <input ref={folderInputRef} onChange={(event) => selectFiles(event.target.files)} type="file" multiple className="hidden" {...directoryInputProps} />
          </div>
          {error && <p className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">{error}</p>}
          <button disabled={uploading || !file || !title.trim()} className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">{uploading ? "Yüklənir…" : "Canlı link yarat"}</button>
        </form>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Bütün layihələr</h2><span className="text-xs text-mist">{projects.length} layihə</span></div>
          {!projects.length && <div className="rounded-2xl border border-dashed border-ink-line p-10 text-center text-sm text-mist">İlk layihənizi buradan paylaşın.</div>}
          {projects.map((project) => <article key={project.id} className="rounded-2xl border border-ink-line bg-ink-raised p-5">
            {renamingId === project.id ? <div className="flex gap-2"><input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm" /><button onClick={() => renameProject(project)} className="rounded-lg bg-violet px-3 text-sm font-semibold text-ink">Saxla</button><button onClick={() => setRenamingId(null)} className="text-sm text-mist">İmtina</button></div> : <><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-lg font-semibold">{project.title}</h3><a href={`/links/${project.slug}`} target="_blank" className="font-mono text-xs text-violet-soft hover:underline">/links/{project.slug}</a></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">● Canlı</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><a href={`/links/${project.slug}`} target="_blank" className="rounded-full bg-violet px-3 py-2 font-semibold text-ink">Baxış</a><button onClick={() => copyLink(project.slug)} className="rounded-full border border-ink-line px-3 py-2 text-mist hover:text-paper">Linki kopyala</button><label className="cursor-pointer rounded-full border border-ink-line px-3 py-2 text-mist hover:text-paper">Yenilə<input type="file" accept=".zip" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) upload(project, selected); }} /></label><button onClick={() => { setRenamingId(project.id); setRenameValue(project.title); }} className="rounded-full border border-ink-line px-3 py-2 text-mist hover:text-paper">Adı dəyiş</button><button onClick={() => deleteProject(project)} className="rounded-full border border-amber/40 px-3 py-2 text-amber">Sil</button></div></>}
          </article>)}
        </div>
      </section>
    </main>
  </div>;
}
