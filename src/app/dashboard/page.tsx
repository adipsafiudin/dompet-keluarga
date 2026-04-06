import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: member } = await supabase
    .from("family_members")
    .select("family_id, families(name)")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/setup");

  const family = member.families as unknown as { name: string };

  return (
    <DashboardClient
      userName={profile?.full_name || "Pengguna"}
      familyName={family.name}
      familyId={member.family_id}
    />
  );
}
