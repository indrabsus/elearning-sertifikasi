import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function normalizeHp(value: string) {
  return String(value || "").replace(/\D/g, "")
}

function normalize(value: any) {
  return String(value || "").trim()
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { message: "Konfigurasi Supabase belum lengkap" },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await req.json()

    const role = normalize(body.role).toLowerCase()
    const email = normalize(body.email).toLowerCase()
    const password = normalize(body.password)

    const uid_fp = normalize(body.uid_fp)
    const no_hp = normalize(body.no_hp)

    const nisn = normalize(body.nisn)
    const nis = normalize(body.nis)
    const tanggal_lahir = normalize(body.tanggal_lahir)

    if (!role || !email || !password) {
      return NextResponse.json(
        { message: "Role, email, dan password wajib diisi" },
        { status: 400 }
      )
    }

    if (!["guru", "siswa"].includes(role)) {
      return NextResponse.json(
        { message: "Aktivasi hanya untuk guru atau siswa" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("id_role, nama_role")
      .ilike("nama_role", role)
      .maybeSingle()

    if (roleError || !roleData) {
      return NextResponse.json(
        { message: `Role ${role} tidak ditemukan` },
        { status: 400 }
      )
    }

    let targetId: string | null = null
    let namaLengkap = ""
    let existingIdProfile: string | null = null

    if (role === "guru") {
      if (!uid_fp || !no_hp) {
        return NextResponse.json(
          { message: "UID fingerprint dan no HP wajib diisi" },
          { status: 400 }
        )
      }

      const { data: guru, error: guruError } = await supabaseAdmin
        .from("guru")
        .select("id_guru, uid_fp, nama_lengkap, no_hp")
        .eq("uid_fp", uid_fp)
        .maybeSingle()

      if (guruError || !guru) {
        return NextResponse.json(
          { message: "Data guru tidak ditemukan" },
          { status: 404 }
        )
      }

      if (normalizeHp(guru.no_hp || "") !== normalizeHp(no_hp)) {
        return NextResponse.json(
          { message: "UID fingerprint dan no HP tidak cocok" },
          { status: 400 }
        )
      }

      const { data: akunGuru } = await supabaseAdmin
        .from("akun_guru")
        .select("id_profile, id_guru")
        .eq("id_guru", guru.id_guru)
        .maybeSingle()

      targetId = guru.id_guru
      namaLengkap = guru.nama_lengkap
      existingIdProfile = akunGuru?.id_profile || null
    }

    if (role === "siswa") {
      if ((!nisn && !nis) || !tanggal_lahir) {
        return NextResponse.json(
          { message: "NISN/NIS dan tanggal lahir wajib diisi" },
          { status: 400 }
        )
      }

      let siswaQuery = supabaseAdmin
        .from("siswa")
        .select("id_siswa, nisn, nis, nama_lengkap, tanggal_lahir")
        .eq("tanggal_lahir", tanggal_lahir)

      if (nisn) {
        siswaQuery = siswaQuery.eq("nisn", nisn)
      } else {
        siswaQuery = siswaQuery.eq("nis", nis)
      }

      const { data: siswa, error: siswaError } = await siswaQuery.maybeSingle()

      if (siswaError || !siswa) {
        return NextResponse.json(
          { message: "Data siswa tidak ditemukan atau tidak cocok" },
          { status: 404 }
        )
      }

      const { data: akunSiswa } = await supabaseAdmin
        .from("akun_siswa")
        .select("id_profile, id_siswa")
        .eq("id_siswa", siswa.id_siswa)
        .maybeSingle()

      targetId = siswa.id_siswa
      namaLengkap = siswa.nama_lengkap
      existingIdProfile = akunSiswa?.id_profile || null
    }

    if (!targetId) {
      return NextResponse.json(
        { message: "Data target tidak ditemukan" },
        { status: 400 }
      )
    }

    if (existingIdProfile) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id_profile, email, nama_lengkap")
        .eq("id_profile", existingIdProfile)
        .maybeSingle()

      return NextResponse.json({
        message: "Akun sudah aktif, silakan login",
        already_active: true,
        role,
        email: existingProfile?.email || email,
      })
    }

    const { data: profileByEmail } = await supabaseAdmin
      .from("profiles")
      .select("id_profile, email")
      .eq("email", email)
      .maybeSingle()

    if (profileByEmail) {
      return NextResponse.json(
        { message: "Email sudah terdaftar di profiles" },
        { status: 400 }
      )
    }

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createUserError || !createdUser?.user) {
      return NextResponse.json(
        {
          message:
            createUserError?.message ||
            "Gagal membuat user auth. Kemungkinan email sudah digunakan.",
        },
        { status: 400 }
      )
    }

    const idProfile = createdUser.user.id

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id_profile: idProfile,
        email,
        nama_lengkap: namaLengkap,
        id_role: roleData.id_role,
        aktif: true,
      },
      {
        onConflict: "id_profile",
      }
    )

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(idProfile)

      return NextResponse.json(
        { message: `Gagal upsert profiles: ${profileError.message}` },
        { status: 400 }
      )
    }

    if (role === "guru") {
      const { error: akunGuruError } = await supabaseAdmin
        .from("akun_guru")
        .upsert(
          {
            id_profile: idProfile,
            id_guru: targetId,
          },
          {
            onConflict: "id_guru",
          }
        )

      if (akunGuruError) {
        await supabaseAdmin.from("profiles").delete().eq("id_profile", idProfile)
        await supabaseAdmin.auth.admin.deleteUser(idProfile)

        return NextResponse.json(
          { message: `Gagal upsert akun_guru: ${akunGuruError.message}` },
          { status: 400 }
        )
      }
    }

    if (role === "siswa") {
      const { error: akunSiswaError } = await supabaseAdmin
        .from("akun_siswa")
        .upsert(
          {
            id_profile: idProfile,
            id_siswa: targetId,
          },
          {
            onConflict: "id_siswa",
          }
        )

      if (akunSiswaError) {
        await supabaseAdmin.from("profiles").delete().eq("id_profile", idProfile)
        await supabaseAdmin.auth.admin.deleteUser(idProfile)

        return NextResponse.json(
          { message: `Gagal upsert akun_siswa: ${akunSiswaError.message}` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      message: "Akun berhasil dibuat",
      already_active: false,
      role,
      email,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}