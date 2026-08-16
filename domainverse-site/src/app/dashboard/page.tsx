import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/profile-utils";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const username = await ensureProfile(admin, user.id, user.email ?? "user");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug, title, description, view_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardClient
      email={user.email ?? ""}
      username={username}
      initialProjects={projects ?? []}
    />
  );
}
