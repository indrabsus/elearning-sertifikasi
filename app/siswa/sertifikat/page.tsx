"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Award,
  CheckCircle,
  Download,
  FileCheck,
  Search,
  ShieldCheck,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Profile = {
  id_profile: string
  nama_lengkap: string
  nama_role: string
  id_siswa: string | null
}

type Kompetensi = {
  id_kompetensi: string
  judul: string
  deskripsi: string | null
  tingkat: number | null
  syarat_lulus: number | null
  aktif: boolean
  jurusan?: {
    kode_jurusan: string
    nama_jurusan: string
  }
}

type PengumpulanKompetensi = {
  id_pengumpulan_kompetensi: string
  id_kompetensi_tugas: string
  id_siswa: string
  nilai: number | null
  status: string
  catatan_kajur: string | null
  kompetensi_tugas?: {
    id_kompetensi_tugas: string
    judul: string
    id_kompetensi: string
  }
}

type Sertifikat = {
  id_sertifikat: string
  nomor_sertifikat: string
  id_siswa: string
  id_kompetensi: string
  nilai: number | null
  qr_code: string | null
  kode_verifikasi: string | null
  tanggal_terbit: string | null
  file_url: string | null
  status: string | null
  kompetensi?: {
    judul: string
  }
}

export default function SiswaSertifikatPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [kompetensiList, setKompetensiList] = useState<Kompetensi[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<
    PengumpulanKompetensi[]
  >([])
  const [sertifikatList, setSertifikatList] = useState<Sertifikat[]>([])

  const [search, setSearch] = useState("")

  const getData = async (userProfile: Profile) => {
    try {
      if (!userProfile.id_siswa) {
        router.replace("/login")
        return
      }

      const [kompetensiData, pengumpulanData, sertifikatData] =
        await Promise.all([
          fetchAll(
            "kompetensi",
            `
              id_kompetensi,
              judul,
              deskripsi,
              tingkat,
              syarat_lulus,
              aktif,
              jurusan:id_jurusan (
                kode_jurusan,
                nama_jurusan
              )
            `,
            "urutan"
          ),

          fetchAll(
            "pengumpulan_kompetensi",
            `
              id_pengumpulan_kompetensi,
              id_kompetensi_tugas,
              id_siswa,
              nilai,
              status,
              catatan_kajur,
              kompetensi_tugas:id_kompetensi_tugas (
                id_kompetensi_tugas,
                judul,
                id_kompetensi
              )
            `
          ),

          fetchAll(
            "sertifikat",
            `
              id_sertifikat,
              nomor_sertifikat,
              id_siswa,
              id_kompetensi,
              nilai,
              qr_code,
              kode_verifikasi,
              tanggal_terbit,
              file_url,
              status,
              kompetensi:id_kompetensi (
                judul
              )
            `,
            "created_at",
            false
          ),
        ])

      setKompetensiList(
        ((kompetensiData || []) as Kompetensi[]).filter((item) => item.aktif)
      )

      setPengumpulanList(
        ((pengumpulanData || []) as PengumpulanKompetensi[]).filter(
          (item) => item.id_siswa === userProfile.id_siswa
        )
      )

      setSertifikatList(
        ((sertifikatData || []) as Sertifikat[]).filter(
          (item) =>
            item.id_siswa === userProfile.id_siswa &&
            item.status !== "dicabut"
        )
      )
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data sertifikat")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["siswa"], router)
      if (!userProfile) return

      setProfile(userProfile as Profile)
      await getData(userProfile as Profile)
    }

    check()
  }, [router])

  const rows = useMemo(() => {
    return kompetensiList.map((kompetensi) => {
      const pengumpulanKompetensi = pengumpulanList.filter(
        (item) =>
          item.kompetensi_tugas?.id_kompetensi === kompetensi.id_kompetensi
      )

      const sertifikat = sertifikatList.find(
        (item) => item.id_kompetensi === kompetensi.id_kompetensi
      )

      const nilaiTerbaik =
        pengumpulanKompetensi.length > 0
          ? Math.max(
              ...pengumpulanKompetensi.map((item) => Number(item.nilai || 0))
            )
          : 0

      const status =
        sertifikat
          ? "sertifikat"
          : pengumpulanKompetensi.some((item) => item.status === "lulus")
          ? "lulus"
          : pengumpulanKompetensi.some(
              (item) => item.status === "menunggu_acc"
            )
          ? "menunggu_acc"
          : pengumpulanKompetensi.some((item) => item.status === "tidak_lulus")
          ? "tidak_lulus"
          : pengumpulanKompetensi.some((item) => item.status === "dinilai")
          ? "dinilai"
          : pengumpulanKompetensi.some((item) => item.status === "selesai")
          ? "selesai"
          : pengumpulanKompetensi.some((item) => item.status === "dikerjakan")
          ? "dikerjakan"
          : "belum"

      return {
        kompetensi,
        sertifikat,
        nilaiTerbaik,
        status,
        totalPercobaan: pengumpulanKompetensi.length,
      }
    })
  }, [kompetensiList, pengumpulanList, sertifikatList])

  const filteredRows = useMemo(() => {
    const keyword = search.toLowerCase()

    return rows.filter((item) => {
      return (
        item.kompetensi.judul.toLowerCase().includes(keyword) ||
        (item.kompetensi.deskripsi || "").toLowerCase().includes(keyword) ||
        (item.kompetensi.jurusan?.kode_jurusan || "")
          .toLowerCase()
          .includes(keyword)
      )
    })
  }, [rows, search])

  const getStatusBadge = (status: string) => {
    if (status === "sertifikat") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Sertifikat Terbit
        </span>
      )
    }

    if (status === "menunggu_acc") {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Menunggu ACC
        </span>
      )
    }

    if (status === "lulus" || status === "dinilai") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Lulus
        </span>
      )
    }

    if (status === "tidak_lulus") {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
          Tidak Lulus
        </span>
      )
    }

    if (status === "selesai") {
      return (
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          Selesai
        </span>
      )
    }

    if (status === "dikerjakan") {
      return (
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
          Dikerjakan
        </span>
      )
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Belum
      </span>
    )
  }

  const printSertifikat = (item: Sertifikat) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sertifikat ${item.nomor_sertifikat}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #111827;
          }

          .certificate {
            border: 8px solid #1d4ed8;
            padding: 48px;
            min-height: 620px;
            text-align: center;
          }

          h1 {
            font-size: 40px;
            margin: 0;
            letter-spacing: 2px;
          }

          h2 {
            font-size: 28px;
            margin-top: 36px;
          }

          .subtitle {
            margin-top: 12px;
            font-size: 15px;
            color: #4b5563;
          }

          .name {
            margin: 36px 0 12px;
            font-size: 34px;
            font-weight: bold;
          }

          .competency {
            font-size: 24px;
            font-weight: bold;
            color: #1d4ed8;
          }

          .meta {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 14px;
          }

          .footer {
            margin-top: 64px;
            display: flex;
            justify-content: space-between;
            align-items: end;
            font-size: 13px;
          }

          .sign {
            width: 230px;
            text-align: center;
          }

          .space {
            height: 70px;
          }

          @media print {
            body {
              padding: 0;
            }

            .certificate {
              border: 8px solid #1d4ed8;
              min-height: 95vh;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>SERTIFIKAT KOMPETENSI</h1>
          <p class="subtitle">E-Learning dan Sertifikasi Kompetensi Jurusan</p>

          <h2>Diberikan kepada:</h2>
          <div class="name">${profile?.nama_lengkap || "-"}</div>

          <p>Telah dinyatakan kompeten pada kompetensi:</p>
          <div class="competency">${item.kompetensi?.judul || "-"}</div>

          <div class="meta">
            <div>
              <b>Nomor Sertifikat</b><br/>
              ${item.nomor_sertifikat}
            </div>
            <div>
              <b>Nilai</b><br/>
              ${item.nilai || "-"}
            </div>
            <div>
              <b>Tanggal Terbit</b><br/>
              ${
                item.tanggal_terbit
                  ? new Date(item.tanggal_terbit).toLocaleDateString("id-ID")
                  : "-"
              }
            </div>
            <div>
              <b>Kode Verifikasi</b><br/>
              ${item.kode_verifikasi || item.qr_code || "-"}
            </div>
          </div>

          <div class="footer">
            <div>
              Scan/verifikasi menggunakan kode:<br/>
              <b>${item.kode_verifikasi || item.qr_code || "-"}</b>
            </div>

            <div class="sign">
              <p>Kepala Jurusan</p>
              <div class="space"></div>
              <p><b>Kajur PPLG</b></p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print()
          }
        </script>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank", "width=1000,height=700")
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Sertifikat"
      role="siswa"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sertifikat Kompetensi</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Lihat progres kompetensi dan download sertifikat yang sudah disetujui
          Kajur.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Kompetensi</p>
          <h2 className="mt-2 text-3xl font-bold">{kompetensiList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Dikerjakan</p>
          <h2 className="mt-2 text-3xl font-bold">
            {pengumpulanList.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Sertifikat</p>
          <h2 className="mt-2 text-3xl font-bold">{sertifikatList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Nilai Terbaik</p>
          <h2 className="mt-2 text-3xl font-bold">
            {pengumpulanList.length
              ? Math.max(
                  ...pengumpulanList.map((item) => Number(item.nilai || 0))
                )
              : 0}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Daftar Kompetensi</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {filteredRows.length} kompetensi
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Cari kompetensi..."
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map(({ kompetensi, sertifikat, nilaiTerbaik, status }) => (
            <div
              key={kompetensi.id_kompetensi}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {sertifikat ? <Award size={24} /> : <FileCheck size={24} />}
                </div>

                {getStatusBadge(status)}
              </div>

              <h3 className="font-semibold">{kompetensi.judul}</h3>

              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {kompetensi.deskripsi || "Tidak ada deskripsi."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Jurusan</p>
                  <p className="font-semibold">
                    {kompetensi.jurusan?.kode_jurusan || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Nilai</p>
                  <p className="font-semibold">{nilaiTerbaik}</p>
                </div>
              </div>

              {sertifikat ? (
                <button
                  onClick={() => printSertifikat(sertifikat)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Download size={16} />
                  Download Sertifikat
                </button>
              ) : status === "menunggu_acc" ? (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <ShieldCheck size={16} />
                  Menunggu ACC Kajur
                </div>
              ) : status === "lulus" ? (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                  <CheckCircle size={16} />
                  Lulus, menunggu sertifikat
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-2.5 text-center text-sm text-slate-500 dark:bg-slate-900">
                  Belum tersedia sertifikat
                </div>
              )}
            </div>
          ))}

          {filteredRows.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
              Data kompetensi tidak ditemukan.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}