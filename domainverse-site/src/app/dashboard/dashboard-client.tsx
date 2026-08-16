"use client";

import JSZip from "jszip";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; slug: string; title: string; description?: string | null; view_count?: number; created_at: string };
type DeployFile = { file: File; path: string };
type DirectoryInputProps = React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string };
const directoryInputProps: DirectoryInputProps = { webkitdirectory: "" };
const bucket = "projects";

function validPath(path: string) {
  return path && !path.startsWith("/") && !path.includes("\\") && !path.split("/").some((part) => !part || part === "." || part === "..");
}

function stripCommonRoot(items: DeployFile[]) {
  const roots = items.map((item) => item.path.split("/")[0]);
  const shouldStrip = items.length > 0 && roots.every((root) => root === roots[0]) && items.every((item) => item.path.includes("/"));
  return shouldStrip ? items.map((item) => ({ ...item, path: item.path.slice(roots[0].length + 1) })) : items;
}

function contentType(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  return ({ html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", css: "text/css", js: "application/javascript", json: "application/json", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", ico: "image/x-icon", woff2: "font/woff2" } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream";
}

async function responseError(response: Response) {
  const body = await response.text();
  try { return JSON.parse(body).error || "Sorğu uğursuz oldu"; } catch { return body.includes("Too Large") ? "Fayl Vercel limitinə düşdü. Səhifəni yeniləyib yenidən cəhd edin." : "Server cavabı oxuna bilmədi"; }
}

export default function DashboardClient({ email, username, initialProjects }: { email: string; username: string; initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<DeployFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function chooseFiles(input: FileList | null) {
    if (!input?.length) return;
    setError(null);
    const selected = Array.from(input);
    if (selected.length === 1 && selected[0].name.toLowerCase().endsWith(".zip")) {
      const archive = await JSZip.loadAsync(await selected[0].arrayBuffer());
      const entries = Object.values(archive.files).filter((entry) => !entry.dir);
      const firstFolders = entries.map((entry) => entry.name.split("/")[0]);
      const hasCommonRoot = entries.length > 0 && firstFolders.every((folder) => folder === firstFolders[0]) && entries.every((entry) => entry.name.includes("/"));
      const converted = await Promise.all(entries.map(async (entry) => {
        const path = hasCommonRoot ? entry.name.slice(firstFolders[0].length + 1) : entry.name;
        return { path, file: new File([await entry.async("blob")], path.split("/").pop() || "file") };
      }));
      setFiles(stripCommonRoot(converted.filter((item) => validPath(item.path))));
    } else {
      setFiles(stripCommonRoot(selected.map((file) => ({ file, path: file.webkitRelativePath || file.name })).filter((item) => validPath(item.path))));
    }
  }

  async function deploy() {
    if (!title.trim() || !files.length) return;
    const entryFile = files.find((item) => item.path.toLowerCase() === "index.html") ?? files.find((item) => item.path.toLowerCase().endsWith(".html") || item.path.toLowerCase().endsWith(".htm"));
    if (!entryFile) return setError("Qovluqda ən azı bir HTML faylı olmalıdır (məsələn, sayt.html).");
    const deployFiles = entryFile.path.toLowerCase() === "index.html" ? files : [...files, { file: entryFile.file, path: "index.html" }];
    if (deployFiles.length > 500) return setError("Bir deploy üçün ən çox 500 fayl seçin.");
    setUploading(true); setProgress(0); setError(null);
    try {
      const created = await fetch("/api/projects/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), description: description.trim() }) });
      if (!created.ok) throw new Error(await responseError(created));
      const { project } = await created.json() as { project: Project };
      const supabase = createClient();
      let uploaded = 0;
      for (let offset = 0; offset < deployFiles.length; offset += 50) {
        const batch = deployFiles.slice(offset, offset + 50);
        const signed = await fetch("/api/projects/signed-uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: project.slug, paths: batch.map((item) => item.path) }) });
        if (!signed.ok) throw new Error(await responseError(signed));
        const { uploads } = await signed.json() as { uploads: { relativePath: string; path: string; token: string }[] };
        await Promise.all(uploads.map(async (upload) => {
          const source = batch.find((item) => item.path === upload.relativePath);
          if (!source) return;
          const { error: uploadError } = await supabase.storage.from(bucket).uploadToSignedUrl(upload.path, upload.token, source.file, { contentType: contentType(source.path), upsert: true });
          if (uploadError) throw new Error(`${source.path}: ${uploadError.message}`);
          uploaded += 1; setProgress(Math.round((uploaded / deployFiles.length) * 100));
        }));
      }
      setProjects((current) => [project, ...current]);
      setTitle(""); setDescription(""); setFiles([]); if (zipInput.current) zipInput.current.value = ""; if (folderInput.current) folderInput.current.value = "";
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Deploy uğursuz oldu"); }
    finally { setUploading(false); }
  }

  async function logout() { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }
  const fileSummary = files.length ? `${files.length} fayl seçildi` : "Qovluğu seçin və ya ZIP faylını sürükləyin";

  return <div className="min-h-screen grain"><header className="border-b border-ink-line bg-ink/80"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/dashboard" className="font-display text-lg font-semibold">domainverse</Link><div className="flex items-center gap-3 text-sm"><Link href={`/u/${username}`} className="hidden text-violet-soft hover:underline sm:inline">@{username}</Link><span className="hidden text-mist sm:inline">{email}</span><button onClick={logout} className="rounded-full border border-ink-line px-3 py-1.5 text-mist hover:text-paper">Çıxış</button></div></div></header><main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[190px_1fr]"><aside className="flex gap-2 overflow-x-auto md:block md:space-y-2"><Link href="/dashboard" className="whitespace-nowrap rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-ink">Layihələr</Link><a href="#new-project" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">Yeni layihə</a><Link href="/explore" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">Kəşf et</Link><Link href={`/u/${username}`} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">İctimai profil</Link><Link href="/dashboard/settings" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-mist hover:text-paper">Settings</Link></aside><section className="space-y-8"><div><p className="mb-2 text-xs uppercase tracking-[.25em] text-amber">Project hub</p><h1 className="font-display text-3xl font-semibold">Layihələriniz</h1><p className="mt-2 text-sm text-mist">Fayllar birbaşa Storage-a yüklənir — Vercel limitinə düşmür.</p></div><section id="new-project" className="rounded-2xl border border-ink-line bg-ink-raised p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Yeni layihə</h2><span className="text-xs text-mist">index.html tələb olunur</span></div><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Layihənin adı" className="mb-3 w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet" /><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Qısa təsvir (istəyə bağlı)" maxLength={500} className="mb-3 w-full rounded-lg border border-ink-line bg-ink px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet" /><div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFiles(event.dataTransfer.files); }} className={`rounded-xl border border-dashed p-8 text-center ${dragging ? "border-violet bg-violet/10" : "border-ink-line bg-ink/40"}`}><p className="font-medium">{fileSummary}</p><p className="mt-1 text-xs text-mist">ZIP və ya HTML/CSS/JS/şəkillər olan qovluq</p><div className="mt-4 flex justify-center gap-2"><button type="button" onClick={() => zipInput.current?.click()} className="rounded-full border border-ink-line px-4 py-2 text-xs">ZIP seç</button><button type="button" onClick={() => folderInput.current?.click()} className="rounded-full border border-ink-line px-4 py-2 text-xs">Qovluq seç</button></div><input ref={zipInput} onChange={(event) => chooseFiles(event.target.files)} type="file" accept=".zip" className="hidden" /><input ref={folderInput} onChange={(event) => chooseFiles(event.target.files)} type="file" multiple className="hidden" {...directoryInputProps} /></div>{uploading && <p className="mt-3 text-sm text-violet-soft">Yüklənir: {progress}%</p>}{error && <p className="mt-3 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">{error}</p>}<button onClick={deploy} disabled={uploading || !title.trim() || !files.length} className="mt-4 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">{uploading ? "Deploy edilir…" : "Canlı link yarat"}</button></section><div className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Bütün layihələr</h2><span className="text-xs text-mist">{projects.length} layihə</span></div>{projects.map((project) => <article key={project.id} className="card-lift overflow-hidden rounded-2xl border border-ink-line bg-ink-raised"><div className="flex items-center gap-2 border-b border-ink-line px-5 py-2.5"><span className="chrome-dots"><span/><span/><span/></span><span className="ml-2 truncate font-mono text-[10px] text-mist">domainverse.store/links/{project.slug}</span><span className="ml-auto rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300 whitespace-nowrap">● Canlı</span></div><div className="p-5"><h3 className="font-display text-lg font-semibold">{project.title}</h3>{project.description && <p className="mt-1 text-sm text-mist">{project.description}</p>}<div className="mt-4 flex flex-wrap gap-2"><a href={`/links/${project.slug}`} target="_blank" className="rounded-full bg-violet px-3 py-2 text-xs font-semibold text-ink hover:bg-violet-soft transition-colors">Baxış</a><Link href={`/p/${project.slug}`} className="rounded-full border border-ink-line px-3 py-2 text-xs text-paper hover:border-violet transition-colors">İctimai səhifə</Link><a href={`/api/projects/${project.slug}/download`} className="rounded-full border border-ink-line px-3 py-2 text-xs text-paper hover:border-violet transition-colors">Endir</a><span className="rounded-full px-3 py-2 text-xs text-mist">👁 {project.view_count ?? 0} baxış</span></div></div></article>)}</div></section></main></div>;
}
