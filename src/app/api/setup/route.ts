import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { seedDefaultData } from "@/lib/seed";

export async function POST(request: NextRequest) {
  try {
    // 1. Verifikasi siapa yang login via server client (baca cookie)
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    const { family_name } = await request.json();
    if (!family_name?.trim()) {
      return NextResponse.json(
        { error: "Nama keluarga wajib diisi" },
        { status: 400 },
      );
    }

    // 2. Pakai service role key untuk bypass RLS
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || serviceKey === "your_service_role_key_here") {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local" },
        { status: 500 },
      );
    }

    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 3. Upsert profile
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name ?? null,
        },
        { onConflict: "id" },
      );
    if (profileError) {
      return NextResponse.json(
        { error: `Gagal buat profil: ${profileError.message}` },
        { status: 500 },
      );
    }

    // 4. Create family
    const { data: family, error: famError } = await admin
      .from("families")
      .insert({ name: family_name.trim(), owner_id: user.id })
      .select()
      .single();

    if (famError) {
      return NextResponse.json(
        { error: `Gagal buat keluarga: ${famError.message}` },
        { status: 500 },
      );
    }

    // 5. Add as owner member
    const { error: memError } = await admin
      .from("family_members")
      .insert({ family_id: family.id, user_id: user.id, role: "owner" });

    if (memError) {
      return NextResponse.json(
        { error: `Gagal tambah anggota: ${memError.message}` },
        { status: 500 },
      );
    }

    // 6. Seed default data
    await seedDefaultData(admin, family.id, user.id);

    return NextResponse.json({ family_id: family.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
