import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verifikasi user via server client
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Kode undangan wajib diisi" },
        { status: 400 },
      );
    }

    // Pakai admin client agar bisa baca invitation tanpa jadi member dulu
    const admin = createAdminClient();

    // Ensure profile exists
    await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name ?? null,
        },
        { onConflict: "id" },
      );

    // Find valid invitation
    const { data: invitation, error: invError } = await admin
      .from("family_invitations")
      .select("*, families(name)")
      .eq("code", code.trim().toUpperCase())
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (invError || !invitation) {
      return NextResponse.json(
        { error: "Kode undangan tidak valid atau sudah kadaluarsa" },
        { status: 404 },
      );
    }

    // Check if already a member
    const { data: existingMember } = await admin
      .from("family_members")
      .select("id")
      .eq("family_id", invitation.family_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "Anda sudah menjadi anggota keluarga ini" },
        { status: 409 },
      );
    }

    // Add as member
    const { error: memberError } = await admin.from("family_members").insert({
      family_id: invitation.family_id,
      user_id: user.id,
      role: "member",
    });

    if (memberError) {
      return NextResponse.json({ error: "Gagal bergabung" }, { status: 500 });
    }

    // Mark invitation as used
    await admin
      .from("family_invitations")
      .update({ used_at: new Date().toISOString(), used_by: user.id })
      .eq("id", invitation.id);

    const families = invitation.families as { name: string } | null;
    return NextResponse.json({
      message: "Berhasil bergabung",
      family_id: invitation.family_id,
      family_name: families?.name ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
