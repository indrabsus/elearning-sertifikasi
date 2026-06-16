import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_SUPABASE_URL belum terbaca" },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      return NextResponse.json(
        { message: "SUPABASE_SERVICE_ROLE_KEY belum terbaca" },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const { id_tahun_ajaran } = await req.json()

    if (!id_tahun_ajaran) {
      return NextResponse.json(
        { message: "id_tahun_ajaran wajib diisi" },
        { status: 400 }
      )
    }

    const { data: tahunAjaran, error: tahunError } = await supabaseAdmin
      .from("tahun_ajaran")
      .select("*")
      .eq("id_tahun_ajaran", id_tahun_ajaran)
      .maybeSingle()

    if (tahunError) {
      return NextResponse.json(
        { message: tahunError.message },
        { status: 400 }
      )
    }

    if (!tahunAjaran) {
      return NextResponse.json(
        { message: "Tahun ajaran tidak ditemukan" },
        { status: 404 }
      )
    }

    const { data: jurusan } = await supabaseAdmin
      .from("jurusan")
      .select("*")

    const { data: mapel } = await supabaseAdmin
      .from("mapel")
      .select("*")

    const { data: guru } = await supabaseAdmin
      .from("guru")
      .select("*")

    const { data: kelas } = await supabaseAdmin
      .from("kelas")
      .select("*")
      .eq("id_tahun_ajaran", id_tahun_ajaran)

    const { data: siswaKelas } = await supabaseAdmin
      .from("siswa_kelas")
      .select("*")
      .eq("id_tahun_ajaran", id_tahun_ajaran)

    const siswaIds = [
      ...new Set((siswaKelas || []).map((item) => item.id_siswa)),
    ]

    const { data: siswa } = siswaIds.length
      ? await supabaseAdmin
          .from("siswa")
          .select("*")
          .in("id_siswa", siswaIds)
      : { data: [] }

    const { data: mengajar } = await supabaseAdmin
      .from("mengajar")
      .select("*")
      .eq("id_tahun_ajaran", id_tahun_ajaran)

    const mengajarIds = (mengajar || []).map((item) => item.id_mengajar)

    const { data: materi } = mengajarIds.length
      ? await supabaseAdmin
          .from("materi")
          .select("*")
          .in("id_mengajar", mengajarIds)
      : { data: [] }

    const { data: tugas } = mengajarIds.length
      ? await supabaseAdmin
          .from("tugas")
          .select("*")
          .in("id_mengajar", mengajarIds)
      : { data: [] }

    const tugasIds = (tugas || []).map((item) => item.id_tugas)

    const { data: pengumpulanTugas } = tugasIds.length
      ? await supabaseAdmin
          .from("pengumpulan_tugas")
          .select("*")
          .in("id_tugas", tugasIds)
      : { data: [] }

    const { data: bankSoal } = mengajarIds.length
      ? await supabaseAdmin
          .from("bank_soal")
          .select("*")
          .in("id_mengajar", mengajarIds)
      : { data: [] }

    const { data: nilai } = mengajarIds.length
      ? await supabaseAdmin
          .from("nilai")
          .select("*")
          .in("id_mengajar", mengajarIds)
      : { data: [] }

    const backup = {
      app: "elearning-sekolah",
      version: 1,
      backup_at: new Date().toISOString(),
      id_tahun_ajaran,
      data: {
        tahun_ajaran: tahunAjaran,

        jurusan: jurusan || [],
        mapel: mapel || [],
        guru: guru || [],

        kelas: kelas || [],
        siswa: siswa || [],
        siswa_kelas: siswaKelas || [],

        mengajar: mengajar || [],
        materi: materi || [],
        tugas: tugas || [],
        pengumpulan_tugas: pengumpulanTugas || [],
        bank_soal: bankSoal || [],
        nilai: nilai || [],
      },
    }

    return NextResponse.json(backup)
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Gagal membuat backup" },
      { status: 500 }
    )
  }
}