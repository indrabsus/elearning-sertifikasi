import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function upsertTable(table: string, rows: any[], conflict: string) {
  if (!rows || rows.length === 0) return

  const { error } = await supabaseAdmin.from(table).upsert(rows, {
    onConflict: conflict,
  })

  if (error) throw error
}

export async function POST(req: Request) {
  try {
    const backup = await req.json()

    if (!backup?.data) {
      return NextResponse.json(
        { message: "File backup tidak valid" },
        { status: 400 }
      )
    }

    const data = backup.data

    await upsertTable("tahun_ajaran", [data.tahun_ajaran], "id_tahun_ajaran")
    await upsertTable("kelas", data.kelas || [], "id_kelas")
    await upsertTable("siswa", data.siswa || [], "id_siswa")
    await upsertTable("siswa_kelas", data.siswa_kelas || [], "id_siswa_kelas")
    await upsertTable("mengajar", data.mengajar || [], "id_mengajar")
    await upsertTable("materi", data.materi || [], "id_materi")
    await upsertTable("tugas", data.tugas || [], "id_tugas")
    await upsertTable("pengumpulan_tugas", data.pengumpulan_tugas || [], "id_pengumpulan")
    await upsertTable("bank_soal", data.bank_soal || [], "id_soal")
    await upsertTable("nilai", data.nilai || [], "id_nilai")

    return NextResponse.json({
      message: "Restore berhasil",
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Gagal restore backup" },
      { status: 500 }
    )
  }
}