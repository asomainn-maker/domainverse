"use client";

import { useState } from "react";
import Link from "next/link";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  username: string;
};

export default function ProjectDetailClient({
  slug,
  isLoggedIn,
  initialLiked,
  initialLikeCount,
  initialViewCount,
  initialComments,
}: {
  slug: string;
  isLoggedIn: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
  initialViewCount: number;
  initialComments: Comment[];
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleLike() {
    if (!isLoggedIn) {
      setError("Bəyənmək üçün giriş edin.");
      return;
    }
    setError(null);
    const res = await fetch(`/api/projects/${slug}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount(data.likeCount);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("Şərh yazmaq üçün giriş edin.");
      return;
    }
    if (!newComment.trim()) return;
    setPosting(true);
    setError(null);
    const res = await fetch(`/api/projects/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment.trim() }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setError(data.error || "Şərh göndərilmədi");
      return;
    }
    setComments((prev) => [...prev, data.comment]);
    setNewComment("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 text-sm text-mist">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 transition-colors ${
            liked ? "border-amber text-amber" : "border-ink-line hover:border-violet"
          }`}
        >
          <span>{liked ? "♥" : "♡"}</span> {likeCount}
        </button>
        <span>👁 {initialViewCount} baxış</span>
      </div>

      {error && (
        <p className="text-sm text-amber bg-amber/10 border border-amber/30 rounded-lg px-3 py-2">
          {error}{" "}
          {!isLoggedIn && (
            <Link href="/login" className="underline">
              Giriş et
            </Link>
          )}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink-line bg-ink-raised">
        <div className="flex items-center gap-2 border-b border-ink-line px-6 py-2.5">
          <span className="chrome-dots"><span/><span/><span/></span>
          <span className="ml-2 font-mono text-[10px] text-mist">şərhlər.log</span>
        </div>
        <div className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4">Şərhlər ({comments.length})</h2>

        <div className="space-y-4 mb-5">
          {comments.length === 0 && (
            <p className="text-sm text-mist">Hələ şərh yoxdur. İlk şərhi siz yazın.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="border-b border-ink-line pb-3 last:border-0 last:pb-0">
              <p className="text-xs text-violet-soft mb-1">@{c.username}</p>
              <p className="text-sm text-paper">{c.body}</p>
            </div>
          ))}
        </div>

        {isLoggedIn ? (
          <form onSubmit={submitComment} className="flex items-start gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Şərhinizi yazın…"
              rows={2}
              maxLength={1000}
              className="flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-violet resize-none"
            />
            <button
              type="submit"
              disabled={posting}
              className="rounded-full bg-violet text-ink font-semibold px-4 py-2 text-sm hover:bg-violet-soft transition disabled:opacity-50"
            >
              {posting ? "…" : "Göndər"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-mist">
            Şərh yazmaq üçün{" "}
            <Link href="/login" className="text-violet-soft underline">
              giriş edin
            </Link>
            .
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
