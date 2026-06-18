"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  Printer,
  Search,
  Trophy,
} from "lucide-react"

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

type TahunAjaranStorage = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
}

type SiswaKelas = {
  id_siswa_kelas: string
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  kelas?: {
    id_kelas: string
    nama_kelas: string
    tingkat: number
    jurusan?: {
      kode_jurusan: string
      nama_jurusan: string
    }
  }
}

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  mapel?: {
    nama_mapel: string
  }
  guru?: {
    nama_lengkap: string
  }
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  deadline: string | null
  status: string | null
  created_at: string | null
  mengajar?: Mengajar
}

type PengumpulanTugas = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  catatan_guru: string | null
  status: string | null
  selesai_at: string | null
}

type RowNilai = {
  id_tugas: string
  judul: string
  mapel: string
  guru: string
  deadline: string | null
  status: string
  nilai: number | null
  catatan_guru: string | null
  selesai_at: string | null
}

type RekapMapel = {
  mapel: string
  guru: string
  jumlah_tugas: number
  jumlah_dinilai: number
  rata_rata: number
}

export default function SiswaNilaiPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranStorage | null>(
    null
  )

  const [siswaKelas, setSiswaKelas] = useState<SiswaKelas | null>(null)
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>([])

  const [search, setSearch] = useState("")
  const [filterMapel, setFilterMapel] = useState("")

  const getData = async (userProfile: Profile) => {
    try {
      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")
      const tahunRaw = localStorage.getItem("tahun_ajaran")

      if (!idTahunAjaran) {
        router.replace("/login")
        return
      }

      if (!userProfile.id_siswa) {
        router.replace("/login")
        return
      }

      if (tahunRaw) {
        try {
          setTahunAjaran(JSON.parse(tahunRaw))
        } catch {
          setTahunAjaran(null)
        }
      }

      const [siswaKelasData, mengajarData, tugasData, pengumpulanData] =
        await Promise.all([
          fetchAll(
            "siswa_kelas",
            `
              id_siswa_kelas,
              id_siswa,
              id_kelas,
              id_tahun_ajaran,
              aktif,
              kelas:id_kelas (
                id_kelas,
                nama_kelas,
                tingkat,
                jurusan:id_jurusan (
                  kode_jurusan,
                  nama_jurusan
                )
              )
            `
          ),

          fetchAll(
            "mengajar",
            `
              id_mengajar,
              id_guru,
              id_mapel,
              id_kelas,
              id_tahun_ajaran,
              aktif,
              mapel:id_mapel (
                nama_mapel
              ),
              guru:id_guru (
                nama_lengkap
              )
            `
          ),

          fetchAll(
            "tugas",
            `
              id_tugas,
              id_mengajar,
              judul,
              deadline,
              status,
              created_at,
              mengajar:id_mengajar (
                id_mengajar,
                id_guru,
                id_mapel,
                id_kelas,
                id_tahun_ajaran,
                aktif,
                mapel:id_mapel (
                  nama_mapel
                ),
                guru:id_guru (
                  nama_lengkap
                )
              )
            `,
            "created_at",
            false
          ),

          fetchAll(
            "pengumpulan_tugas",
            `
              id_pengumpulan,
              id_tugas,
              id_siswa,
              nilai,
              catatan_guru,
              status,
              selesai_at
            `
          ),
        ])

      const kelasAktif = (siswaKelasData || []).find(
        (item: any) =>
          item.id_siswa === userProfile.id_siswa &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      if (!kelasAktif) {
        router.replace("/siswa/verifikasi-kelas")
        return
      }

      const mengajarSiswa = (mengajarData || []).filter(
        (item: any) =>
          item.id_kelas === kelasAktif.id_kelas &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      const mengajarIds = mengajarSiswa.map((item: any) => item.id_mengajar)

      const tugasSiswa = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugasSiswa.map((item: any) => item.id_tugas)

      const pengumpulanSiswa = (pengumpulanData || []).filter(
        (item: any) =>
          item.id_siswa === userProfile.id_siswa &&
          tugasIds.includes(item.id_tugas)
      )

      setSiswaKelas(kelasAktif as SiswaKelas)
      setTugasList(tugasSiswa as Tugas[])
      setPengumpulanList(pengumpulanSiswa as PengumpulanTugas[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data nilai")
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

  const rowsNilai = useMemo<RowNilai[]>(() => {
    return tugasList.map((tugas) => {
      const pengumpulan = pengumpulanList.find(
        (item) => item.id_tugas === tugas.id_tugas
      )

      return {
        id_tugas: tugas.id_tugas,
        judul: tugas.judul,
        mapel: tugas.mengajar?.mapel?.nama_mapel || "-",
        guru: tugas.mengajar?.guru?.nama_lengkap || "-",
        deadline: tugas.deadline,
        status: pengumpulan?.status || "belum",
        nilai:
          pengumpulan?.nilai !== null && pengumpulan?.nilai !== undefined
            ? Number(pengumpulan.nilai)
            : null,
        catatan_guru: pengumpulan?.catatan_guru || null,
        selesai_at: pengumpulan?.selesai_at || null,
      }
    })
  }, [tugasList, pengumpulanList])

  const mapelOptions = useMemo(() => {
    return Array.from(new Set(rowsNilai.map((item) => item.mapel))).filter(
      Boolean
    )
  }, [rowsNilai])

  const filteredRows = useMemo(() => {
    const keyword = search.toLowerCase()

    return rowsNilai.filter((item) => {
      const matchSearch =
        item.judul.toLowerCase().includes(keyword) ||
        item.mapel.toLowerCase().includes(keyword) ||
        item.guru.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword)

      const matchMapel = filterMapel ? item.mapel === filterMapel : true

      return matchSearch && matchMapel
    })
  }, [rowsNilai, search, filterMapel])

  const rekapMapel = useMemo<RekapMapel[]>(() => {
    const map = new Map<string, RowNilai[]>()

    rowsNilai.forEach((item) => {
      if (!map.has(item.mapel)) map.set(item.mapel, [])
      map.get(item.mapel)?.push(item)
    })

    return Array.from(map.entries()).map(([mapel, items]) => {
      const nilaiValid = items
        .filter((item) => item.nilai !== null && item.nilai !== undefined)
        .map((item) => Number(item.nilai || 0))

      const rata =
        nilaiValid.length > 0
          ? Math.round(
              nilaiValid.reduce((sum, item) => sum + item, 0) /
                nilaiValid.length
            )
          : 0

      return {
        mapel,
        guru: items[0]?.guru || "-",
        jumlah_tugas: items.length,
        jumlah_dinilai: nilaiValid.length,
        rata_rata: rata,
      }
    })
  }, [rowsNilai])

  const nilaiValidSemua = rowsNilai
    .filter((item) => item.nilai !== null && item.nilai !== undefined)
    .map((item) => Number(item.nilai || 0))

  const rataKeseluruhan =
    nilaiValidSemua.length > 0
      ? Math.round(
          nilaiValidSemua.reduce((sum, item) => sum + item, 0) /
            nilaiValidSemua.length
        )
      : 0

  const tugasDinilai = rowsNilai.filter(
    (item) => item.nilai !== null && item.nilai !== undefined
  ).length

  const tugasBelumDinilai = rowsNilai.length - tugasDinilai

  const getPredikat = (nilai: number) => {
    if (nilai >= 90) return "Sangat Baik"
    if (nilai >= 80) return "Baik"
    if (nilai >= 70) return "Cukup"
    return "Perlu Bimbingan"
  }

  const getStatusBadge = (status: string) => {
    if (status === "dinilai") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Dinilai
        </span>
      )
    }

    if (status === "selesai") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Menunggu Nilai
        </span>
      )
    }

    if (status === "dikerjakan") {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
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

  const handlePrint = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Nilai ${profile?.nama_lengkap || ""}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            padding: 32px;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          h1 {
            margin: 0;
            font-size: 22px;
            text-transform: uppercase;
          }

          .subtitle {
            margin-top: 6px;
            font-size: 13px;
            color: #4b5563;
          }

          .info {
            display: grid;
            grid-template-columns: 160px 1fr;
            gap: 6px;
            font-size: 13px;
            margin-bottom: 24px;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .card {
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 12px;
          }

          .card p {
            margin: 0;
            font-size: 12px;
            color: #6b7280;
          }

          .card h2 {
            margin: 6px 0 0;
            font-size: 24px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 12px;
          }

          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            vertical-align: top;
          }

          th {
            background: #f3f4f6;
            text-align: left;
          }

          .section-title {
            margin-top: 24px;
            font-size: 16px;
            font-weight: bold;
          }

          .footer {
            margin-top: 48px;
            display: flex;
            justify-content: flex-end;
            font-size: 13px;
          }

          .sign {
            width: 240px;
            text-align: center;
          }

          .space {
            height: 72px;
          }

          @media print {
            body {
              padding: 16px;
            }

            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Nilai Siswa</h1>
          <div class="subtitle">E-Learning Sekolah</div>
        </div>

        <div class="info">
          <div>Nama Siswa</div>
          <div>: ${profile?.nama_lengkap || "-"}</div>

          <div>Kelas</div>
          <div>: ${siswaKelas?.kelas?.nama_kelas || "-"}</div>

          <div>Jurusan</div>
          <div>: ${
            siswaKelas?.kelas?.jurusan?.nama_jurusan ||
            siswaKelas?.kelas?.jurusan?.kode_jurusan ||
            "-"
          }</div>

          <div>Tahun Ajaran</div>
          <div>: ${tahunAjaran?.nama_tahun_ajaran || "-"} ${
      tahunAjaran?.semester ? `- ${tahunAjaran.semester}` : ""
    }</div>

          <div>Tanggal Cetak</div>
          <div>: ${new Date().toLocaleDateString("id-ID")}</div>
        </div>

        <div class="summary">
          <div class="card">
            <p>Total Tugas</p>
            <h2>${rowsNilai.length}</h2>
          </div>

          <div class="card">
            <p>Sudah Dinilai</p>
            <h2>${tugasDinilai}</h2>
          </div>

          <div class="card">
            <p>Rata-rata</p>
            <h2>${rataKeseluruhan}</h2>
          </div>

          <div class="card">
            <p>Predikat</p>
            <h2 style="font-size:18px">${getPredikat(rataKeseluruhan)}</h2>
          </div>
        </div>

        <div class="section-title">Rekap Nilai per Mapel</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Mapel</th>
              <th>Guru</th>
              <th>Jumlah Tugas</th>
              <th>Dinilai</th>
              <th>Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            ${rekapMapel
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.mapel}</td>
                <td>${item.guru}</td>
                <td>${item.jumlah_tugas}</td>
                <td>${item.jumlah_dinilai}</td>
                <td><b>${item.rata_rata}</b></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="section-title">Detail Nilai Tugas</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Mapel</th>
              <th>Tugas</th>
              <th>Status</th>
              <th>Nilai</th>
              <th>Catatan Guru</th>
            </tr>
          </thead>
          <tbody>
            ${rowsNilai
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.mapel}</td>
                <td>${item.judul}</td>
                <td>${item.status}</td>
                <td>${item.nilai ?? "-"}</td>
                <td>${item.catatan_guru || "-"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <div class="sign">
            <p>Wali Kelas / Guru</p>
            <div class="space"></div>
            <p>________________________</p>
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
      title="Nilai Saya"
      role="siswa"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Laporan Nilai
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Rekap nilai semua mapel berdasarkan tugas yang sudah dinilai guru.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Printer size={17} />
          Print Laporan
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ClipboardList size={22} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Tugas
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {rowsNilai.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
            <Award size={22} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sudah Dinilai
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {tugasDinilai}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <FileText size={22} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Belum Dinilai
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {tugasBelumDinilai}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Trophy size={22} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rata-rata
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {rataKeseluruhan}
          </h2>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Identitas Siswa
        </h2>

        <div className="mt-4 grid gap-4 text-sm md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-slate-500 dark:text-slate-400">Nama</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {profile?.nama_lengkap || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-slate-500 dark:text-slate-400">Kelas</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {siswaKelas?.kelas?.nama_kelas || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-slate-500 dark:text-slate-400">Jurusan</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {siswaKelas?.kelas?.jurusan?.kode_jurusan || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <p className="text-slate-500 dark:text-slate-400">Predikat</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {getPredikat(rataKeseluruhan)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-600" size={20} />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Rekap per Mapel
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rekapMapel.map((item) => (
            <div
              key={item.mapel}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="font-semibold text-slate-900 dark:text-white">
                {item.mapel}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {item.guru}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {item.jumlah_tugas}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tugas
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-3 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <p className="font-bold">{item.jumlah_dinilai}</p>
                  <p className="text-xs">Dinilai</p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <p className="font-bold">{item.rata_rata}</p>
                  <p className="text-xs">Rata</p>
                </div>
              </div>
            </div>
          ))}

          {rekapMapel.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Belum ada nilai mapel.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Detail Nilai Tugas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {filteredRows.length} dari {rowsNilai.length} tugas
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Semua Mapel</option>
              {mapelOptions.map((mapel) => (
                <option key={mapel} value={mapel}>
                  {mapel}
                </option>
              ))}
            </select>

            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Cari tugas/mapel/guru..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">Mapel</th>
                  <th className="p-4">Tugas</th>
                  <th className="p-4">Guru</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Nilai</th>
                  <th className="p-4">Catatan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRows.map((item, index) => (
                  <tr
                    key={item.id_tugas}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>

                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {item.mapel}
                    </td>

                    <td className="p-4">{item.judul}</td>

                    <td className="p-4">{item.guru}</td>

                    <td className="p-4">{getStatusBadge(item.status)}</td>

                    <td className="p-4">
                      {item.nilai !== null ? (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.nilai}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {item.catatan_guru || "-"}
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data nilai tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}