"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Printer,
  Search,
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
  id_guru: string | null
}

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  mapel?: { nama_mapel: string }
  kelas?: { nama_kelas: string }
}

type Siswa = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nis: string | null
}

type SiswaKelas = {
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  siswa?: Siswa
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  deadline: string | null
  status: string | null
}

type PengumpulanTugas = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  status: string | null
  catatan_guru: string | null
  selesai_at: string | null
}

type NilaiKomponen = {
  id_komponen: string
  id_mengajar: string
  nama_komponen: string
  tipe: "otomatis_tugas" | "manual"
  bobot: number
  aktif: boolean
}

type NilaiSiswa = {
  id_nilai_siswa: string
  id_komponen: string
  id_siswa: string
  nilai: number
  catatan: string | null
}

type RowLaporan = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nis: string | null
  id_mengajar: string
  mapel: string
  kelas: string
  rata_tugas: number
  tugas_dinilai: number
  jumlah_tugas: number
  nilai_manual_rata: number
  nilai_akhir: number
}

type SortKey =
  | "nama_lengkap"
  | "nisn"
  | "mapel"
  | "kelas"
  | "rata_tugas"
  | "nilai_manual_rata"
  | "nilai_akhir"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function GuruLaporanPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [siswaKelasList, setSiswaKelasList] = useState<SiswaKelas[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>([])
  const [komponenList, setKomponenList] = useState<NilaiKomponen[]>([])
  const [nilaiSiswaList, setNilaiSiswaList] = useState<NilaiSiswa[]>([])

  const [search, setSearch] = useState("")
  const [filterMengajar, setFilterMengajar] = useState("")

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nama_lengkap",
    direction: "asc",
  })

  const [currentPage, setCurrentPage] = useState(1)

  const getData = async (userProfile: Profile) => {
    try {
      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")

      if (!idTahunAjaran) {
        router.replace("/login")
        return
      }

      if (!userProfile.id_guru) {
        router.replace("/guru/verifikasi-mengajar")
        return
      }

      const [
        mengajarData,
        siswaKelasData,
        tugasData,
        pengumpulanData,
        komponenData,
        nilaiSiswaData,
      ] = await Promise.all([
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
            kelas:id_kelas (
              nama_kelas
            )
          `
        ),

        fetchAll(
          "siswa_kelas",
          `
            id_siswa,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            siswa:id_siswa (
              id_siswa,
              nama_lengkap,
              nisn,
              nis
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
            status
          `
        ),

        fetchAll(
          "pengumpulan_tugas",
          `
            id_pengumpulan,
            id_tugas,
            id_siswa,
            nilai,
            status,
            catatan_guru,
            selesai_at
          `
        ),

        fetchAll(
          "nilai_komponen",
          `
            id_komponen,
            id_mengajar,
            nama_komponen,
            tipe,
            bobot,
            aktif
          `
        ),

        fetchAll(
          "nilai_siswa",
          `
            id_nilai_siswa,
            id_komponen,
            id_siswa,
            nilai,
            catatan
          `
        ),
      ])

      const mengajarGuru = (mengajarData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      const mengajarIds = mengajarGuru.map((item: any) => item.id_mengajar)
      const kelasIds = mengajarGuru.map((item: any) => item.id_kelas)

      const siswaKelasGuru = (siswaKelasData || []).filter(
        (item: any) =>
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true &&
          kelasIds.includes(item.id_kelas)
      )

      const tugasGuru = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugasGuru.map((item: any) => item.id_tugas)

      const pengumpulanGuru = (pengumpulanData || []).filter((item: any) =>
        tugasIds.includes(item.id_tugas)
      )

      const komponenGuru = (komponenData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const komponenIds = komponenGuru.map((item: any) => item.id_komponen)

      const nilaiSiswaGuru = (nilaiSiswaData || []).filter((item: any) =>
        komponenIds.includes(item.id_komponen)
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setSiswaKelasList(siswaKelasGuru as SiswaKelas[])
      setTugasList(tugasGuru as Tugas[])
      setPengumpulanList(pengumpulanGuru as PengumpulanTugas[])
      setKomponenList(komponenGuru as NilaiKomponen[])
      setNilaiSiswaList(nilaiSiswaGuru as NilaiSiswa[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data laporan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["guru"], router)
      if (!userProfile) return

      setProfile(userProfile as Profile)
      await getData(userProfile as Profile)
    }

    check()
  }, [router])

  const hitungRataTugas = (idSiswa: string, idMengajar: string) => {
    const tugasMengajar = tugasList.filter(
      (tugas) => tugas.id_mengajar === idMengajar
    )

    const nilaiTugas = pengumpulanList
      .filter(
        (p) =>
          p.id_siswa === idSiswa &&
          tugasMengajar.some((t) => t.id_tugas === p.id_tugas) &&
          p.nilai !== null &&
          p.nilai !== undefined
      )
      .map((p) => Number(p.nilai || 0))

    const rata =
      nilaiTugas.length > 0
        ? Math.round(
            nilaiTugas.reduce((total, item) => total + item, 0) /
              nilaiTugas.length
          )
        : 0

    return {
      rata,
      jumlahTugas: tugasMengajar.length,
      tugasDinilai: nilaiTugas.length,
    }
  }

  const hitungNilaiManualRata = (idSiswa: string, idMengajar: string) => {
    const komponenManual = komponenList.filter(
      (k) =>
        k.id_mengajar === idMengajar &&
        k.tipe === "manual" &&
        k.aktif === true
    )

    const nilaiManual = komponenManual
      .map((komponen) => {
        const nilai = nilaiSiswaList.find(
          (n) =>
            n.id_komponen === komponen.id_komponen && n.id_siswa === idSiswa
        )

        return nilai ? Number(nilai.nilai || 0) : null
      })
      .filter((nilai) => nilai !== null) as number[]

    return nilaiManual.length > 0
      ? Math.round(
          nilaiManual.reduce((total, item) => total + item, 0) /
            nilaiManual.length
        )
      : 0
  }

  const hitungNilaiAkhir = (idSiswa: string, idMengajar: string) => {
    const komponen = komponenList.filter(
      (k) => k.id_mengajar === idMengajar && k.aktif === true
    )

    if (komponen.length === 0) return 0

    let totalBobot = 0
    let totalNilai = 0

    komponen.forEach((k) => {
      const bobot = Number(k.bobot || 0)
      if (bobot <= 0) return

      let nilai = 0

      if (k.tipe === "otomatis_tugas") {
        nilai = hitungRataTugas(idSiswa, idMengajar).rata
      } else {
        const nilaiSiswa = nilaiSiswaList.find(
          (n) => n.id_komponen === k.id_komponen && n.id_siswa === idSiswa
        )

        nilai = Number(nilaiSiswa?.nilai || 0)
      }

      totalBobot += bobot
      totalNilai += nilai * bobot
    })

    return totalBobot > 0 ? Math.round(totalNilai / totalBobot) : 0
  }

  const rows = useMemo<RowLaporan[]>(() => {
    const result: RowLaporan[] = []

    mengajarList.forEach((mengajar) => {
      const siswaDiKelas = siswaKelasList.filter(
        (sk) => sk.id_kelas === mengajar.id_kelas
      )

      siswaDiKelas.forEach((sk) => {
        if (!sk.siswa) return

        const tugasInfo = hitungRataTugas(sk.id_siswa, mengajar.id_mengajar)
        const nilaiManualRata = hitungNilaiManualRata(
          sk.id_siswa,
          mengajar.id_mengajar
        )
        const nilaiAkhir = hitungNilaiAkhir(
          sk.id_siswa,
          mengajar.id_mengajar
        )

        result.push({
          id_siswa: sk.id_siswa,
          nama_lengkap: sk.siswa.nama_lengkap,
          nisn: sk.siswa.nisn,
          nis: sk.siswa.nis,
          id_mengajar: mengajar.id_mengajar,
          mapel: mengajar.mapel?.nama_mapel || "-",
          kelas: mengajar.kelas?.nama_kelas || "-",
          rata_tugas: tugasInfo.rata,
          jumlah_tugas: tugasInfo.jumlahTugas,
          tugas_dinilai: tugasInfo.tugasDinilai,
          nilai_manual_rata: nilaiManualRata,
          nilai_akhir: nilaiAkhir,
        })
      })
    })

    return result
  }, [
    mengajarList,
    siswaKelasList,
    tugasList,
    pengumpulanList,
    komponenList,
    nilaiSiswaList,
  ])

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = rows.filter((item) => {
      const matchSearch =
        item.nama_lengkap.toLowerCase().includes(keyword) ||
        (item.nisn || "").toLowerCase().includes(keyword) ||
        (item.nis || "").toLowerCase().includes(keyword) ||
        item.mapel.toLowerCase().includes(keyword) ||
        item.kelas.toLowerCase().includes(keyword)

      const matchMengajar = filterMengajar
        ? item.id_mengajar === filterMengajar
        : true

      return matchSearch && matchMengajar
    })

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue
      }

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

    return filtered
  }, [rows, search, filterMengajar, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterMengajar])

  const handleSort = (key: SortKey) => {
    setCurrentPage(1)
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        }
      }

      return { key, direction: "asc" }
    })
  }

  const SortButton = ({
    label,
    sortKey,
  }: {
    label: string
    sortKey: SortKey
  }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium hover:text-blue-600"
    >
      {label}
      <ChevronsUpDown size={14} />
    </button>
  )

  const getDetailTugas = (row: RowLaporan) => {
    const tugasMengajar = tugasList.filter(
      (tugas) => tugas.id_mengajar === row.id_mengajar
    )

    return tugasMengajar.map((tugas) => {
      const pengumpulan = pengumpulanList.find(
        (p) => p.id_tugas === tugas.id_tugas && p.id_siswa === row.id_siswa
      )

      return {
        judul: tugas.judul,
        nilai: pengumpulan?.nilai ?? "-",
        status: pengumpulan?.status || "belum",
        catatan: pengumpulan?.catatan_guru || "-",
      }
    })
  }

  const getDetailKomponen = (row: RowLaporan) => {
    const komponen = komponenList.filter(
      (k) => k.id_mengajar === row.id_mengajar && k.aktif
    )

    return komponen.map((k) => {
      if (k.tipe === "otomatis_tugas") {
        return {
          nama: k.nama_komponen,
          tipe: "Otomatis",
          bobot: k.bobot,
          nilai: row.rata_tugas,
          catatan: "Rata-rata tugas online",
        }
      }

      const nilai = nilaiSiswaList.find(
        (n) => n.id_komponen === k.id_komponen && n.id_siswa === row.id_siswa
      )

      return {
        nama: k.nama_komponen,
        tipe: "Manual",
        bobot: k.bobot,
        nilai: nilai?.nilai ?? "-",
        catatan: nilai?.catatan || "-",
      }
    })
  }

  const printPdfSiswa = (row: RowLaporan) => {
    const tugasDetail = getDetailTugas(row)
    const komponenDetail = getDetailKomponen(row)

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Nilai - ${row.nama_lengkap}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            padding: 32px;
            color: #111827;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          .header h1 {
            margin: 0;
            font-size: 22px;
          }

          .header p {
            margin: 6px 0 0;
            font-size: 13px;
            color: #4b5563;
          }

          .info {
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: 160px 1fr;
            gap: 8px;
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
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

          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .card {
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
          }

          .card p {
            margin: 0;
            font-size: 11px;
            color: #6b7280;
          }

          .card h2 {
            margin: 6px 0 0;
            font-size: 22px;
          }

          .footer {
            margin-top: 48px;
            display: flex;
            justify-content: flex-end;
            font-size: 13px;
          }

          .signature {
            text-align: center;
            width: 220px;
          }

          .space {
            height: 72px;
          }

          @media print {
            button {
              display: none;
            }

            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN NILAI SISWA</h1>
          <p>Portal Sakuci</p>
        </div>

        <div class="info">
          <div>Nama Siswa</div><div>: ${row.nama_lengkap}</div>
          <div>NISN / NIS</div><div>: ${row.nisn || row.nis || "-"}</div>
          <div>Kelas</div><div>: ${row.kelas}</div>
          <div>Mapel</div><div>: ${row.mapel}</div>
          <div>Guru</div><div>: ${profile?.nama_lengkap || "-"}</div>
          <div>Tanggal Cetak</div><div>: ${new Date().toLocaleDateString("id-ID")}</div>
        </div>

        <div class="summary">
          <div class="card">
            <p>Rata Tugas</p>
            <h2>${row.rata_tugas}</h2>
          </div>
          <div class="card">
            <p>Tugas Dinilai</p>
            <h2>${row.tugas_dinilai}/${row.jumlah_tugas}</h2>
          </div>
          <div class="card">
            <p>Rata Manual</p>
            <h2>${row.nilai_manual_rata}</h2>
          </div>
          <div class="card">
            <p>Nilai Akhir</p>
            <h2>${row.nilai_akhir}</h2>
          </div>
        </div>

        <h3>Detail Tugas</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Tugas</th>
              <th>Status</th>
              <th>Nilai</th>
              <th>Catatan Guru</th>
            </tr>
          </thead>
          <tbody>
            ${
              tugasDetail.length > 0
                ? tugasDetail
                    .map(
                      (item, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.judul}</td>
                          <td>${item.status}</td>
                          <td>${item.nilai}</td>
                          <td>${item.catatan}</td>
                        </tr>
                      `
                    )
                    .join("")
                : `<tr><td colspan="5">Belum ada tugas.</td></tr>`
            }
          </tbody>
        </table>

        <h3>Komponen Nilai</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Komponen</th>
              <th>Tipe</th>
              <th>Bobot</th>
              <th>Nilai</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${
              komponenDetail.length > 0
                ? komponenDetail
                    .map(
                      (item, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.nama}</td>
                          <td>${item.tipe}</td>
                          <td>${item.bobot}%</td>
                          <td>${item.nilai}</td>
                          <td>${item.catatan}</td>
                        </tr>
                      `
                    )
                    .join("")
                : `<tr><td colspan="6">Belum ada komponen nilai.</td></tr>`
            }
          </tbody>
        </table>

        <div class="footer">
          <div class="signature">
            <p>Guru Mata Pelajaran</p>
            <div class="space"></div>
            <p><b>${profile?.nama_lengkap || "-"}</b></p>
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

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Laporan" role="guru" nama={profile?.nama_lengkap}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Laporan Nilai Siswa</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Laporan semua siswa yang Anda ajar, lengkap dengan tugas dan nilai.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Data</p>
          <h2 className="mt-2 text-3xl font-bold">{rows.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Mapel/Kelas</p>
          <h2 className="mt-2 text-3xl font-bold">{mengajarList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Tugas</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Rata Akhir</p>
          <h2 className="mt-2 text-3xl font-bold">
            {rows.length
              ? Math.round(
                  rows.reduce((sum, item) => sum + item.nilai_akhir, 0) /
                    rows.length
                )
              : 0}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Laporan</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {paginatedData.length} dari{" "}
              {filteredAndSortedData.length} data
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterMengajar}
              onChange={(e) => setFilterMengajar(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Semua Mapel/Kelas</option>
              {mengajarList.map((item) => (
                <option key={item.id_mengajar} value={item.id_mengajar}>
                  {item.mapel?.nama_mapel || "-"} -{" "}
                  {item.kelas?.nama_kelas || "-"}
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
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Cari siswa / mapel / kelas..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950">
                  <th className="p-4">No</th>
                  <th className="p-4">
                    <SortButton label="Nama" sortKey="nama_lengkap" />
                  </th>
                  <th className="p-4">
                    <SortButton label="NISN" sortKey="nisn" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Mapel" sortKey="mapel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kelas" sortKey="kelas" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Rata Tugas" sortKey="rata_tugas" />
                  </th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">
                    <SortButton
                      label="Manual"
                      sortKey="nilai_manual_rata"
                    />
                  </th>
                  <th className="p-4">
                    <SortButton label="Akhir" sortKey="nilai_akhir" />
                  </th>
                  <th className="p-4 text-right">PDF</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={`${item.id_siswa}-${item.id_mengajar}`}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4 font-medium">{item.nama_lengkap}</td>
                    <td className="p-4">{item.nisn || item.nis || "-"}</td>
                    <td className="p-4">{item.mapel}</td>

                    <td className="p-4">
                      <span className="rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {item.kelas}
                      </span>
                    </td>

                    <td className="p-4">{item.rata_tugas}</td>
                    <td className="p-4">
                      {item.tugas_dinilai}/{item.jumlah_tugas} tugas
                    </td>
                    <td className="p-4">{item.nilai_manual_rata}</td>

                    <td className="p-4">
                      <span
                        className={
                          item.nilai_akhir >= 75
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                        }
                      >
                        {item.nilai_akhir}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => printPdfSiswa(item)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Printer size={14} />
                        Print
                      </button>
                    </td>
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Data laporan tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-sm text-slate-500">
            Halaman {totalPages === 0 ? 0 : currentPage} dari {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700"
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}