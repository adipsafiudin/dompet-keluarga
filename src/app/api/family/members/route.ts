import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Auth check — must be a logged-in user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current user's family_id
  const { data: mem } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .single();
  if (!mem) {
    return NextResponse.json({ members: [] });
  }

  // Use admin client to bypass RLS on profiles
  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("family_members")
    .select("*, user:profiles(*)")
    .eq("family_id", mem.family_id)
    .order("joined_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}
