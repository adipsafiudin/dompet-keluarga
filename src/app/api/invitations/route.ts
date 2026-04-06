import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { family_id, email } = body;

    if (!family_id) {
      return NextResponse.json(
        { error: "family_id wajib diisi" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Verify user is member of the family
    const { data: member } = await admin
      .from("family_members")
      .select("id")
      .eq("family_id", family_id)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json(
        { error: "Anda bukan anggota keluarga ini" },
        { status: 403 },
      );
    }

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error } = await admin
      .from("family_invitations")
      .insert({
        family_id,
        code,
        email: email || null,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Gagal membuat undangan" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      code: invitation.code,
      expires_at: invitation.expires_at,
      invite_link: `/join/${invitation.code}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
