"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CalendarClock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Search,
  Users,
} from "lucide-react"

import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Profile = {
  id_profile: string
  nama_lengkap: string
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

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  status: string | null
  created_at: string | null
  mengajar?: Mengajar
}

type SiswaKelas = {
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
}

type Pengumpulan = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  status: string | null
}

const ITEMS_PER_PAGE = 10

export default function GuruPengumpulanTugasPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [siswaKelasList, setSiswaKelasList] = useState<SiswaKelas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>([])

  const [search, setSearch] = useState("")
  const [filterMengajar, setFilterMengajar] = useState("")
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

      const [mengajarData, tugasData, siswaKelasData, pengumpulanData] =
        await Promise.all([
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
            "tugas",
            `
              id_tugas,
              id_mengajar,
              judul,
              deskripsi,
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
                kelas:id_kelas (
                  nama_kelas
                )
              )
            `,
            "created_at",
            false
          ),

          fetchAll(
            "siswa_kelas",
            `
              id_siswa,
              id_kelas,
              id_tahun_ajaran,
              aktif
            `
          ),

          fetchAll(
            "pengumpulan_tugas",
            `
              id_pengumpulan,
              id_tugas,
              id_siswa,
              nilai,
              status
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

      const tugasGuru = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugasGuru.map((item: any) => item.id_tugas)

      const siswaKelasGuru = (siswaKelasData || []).filter(
        (item: any) =>
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true &&
          kelasIds.includes(item.id_kelas)
      )

      const pengumpulanGuru = (pengumpulanData || []).filter((item: any) =>
        tugasIds.includes(item.id_tugas)
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setTugasList(tugasGuru as Tugas[])
      setSiswaKelasList(siswaKelasGuru as SiswaKelas[])
      setPengumpulanList(pengumpulanGuru as Pengumpulan[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data pengumpulan tugas")
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

  const rows = useMemo(() => {
    return tugasList.map((tugas) => {
      const idKelas = tugas.mengajar?.id_kelas

      const totalSiswa = siswaKelasList.filter(
        (item) => item.id_kelas === idKelas
      ).length

      const pengumpulanTugas = pengumpulanList.filter(
        (item) => item.id_tugas === tugas.id_tugas
      )

      const selesai = pengumpulanTugas.filter((item) =>
        ["selesai", "dinilai", "terlambat"].includes(item.status || "")
      ).length

      const dinilai = pengumpulanTugas.filter(
        (item) => item.nilai !== null && item.nilai !== undefined
      ).length

      return {
        ...tugas,
        total_siswa: totalSiswa,
        total_pengumpulan: pengumpulanTugas.length,
        selesai,
        dinilai,
        belum: Math.max(totalSiswa - selesai, 0),
      }
    })
  }, [tugasList, siswaKelasList, pengumpulanList])

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase()

    return rows.filter((item) => {
      const matchSearch =
        item.judul.toLowerCase().includes(keyword) ||
        (item.deskripsi || "").toLowerCase().includes(keyword) ||
        (item.mengajar?.mapel?.nama_mapel || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.mengajar?.kelas?.nama_kelas || "")
          .toLowerCase()
          .includes(keyword)

      const matchMengajar = filterMengajar
        ? item.id_mengajar === filterMengajar
        : true

      return matchSearch && matchMengajar
    })
  }, [rows, search, filterMengajar])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterMengajar])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Pengumpulan Tugas"
      role="guru"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pengumpulan Tugas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau jawaban siswa, koreksi essay, dan input nilai tugas.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Tugas</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Pengumpulan</p>
          <h2 className="mt-2 text-3xl font-bold">
            {pengumpulanList.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Sudah Dinilai</p>
          <h2 className="mt-2 text-3xl font-bold">
            {
              pengumpulanList.filter(
                (item) => item.nilai !== null && item.nilai !== undefined
              ).length
            }
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Menunggu Nilai</p>
          <h2 className="mt-2 text-3xl font-bold">
            {
              pengumpulanList.filter((item) => item.status === "selesai")
                .length
            }
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Daftar Tugas</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {paginatedData.length} dari {filteredData.length} data
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
                placeholder="Cari tugas..."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedData.map((item) => (
            <div
              key={item.id_tugas}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <ClipboardList size={24} />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {item.status}
                </span>
              </div>

              <h3 className="line-clamp-2 text-lg font-bold">{item.judul}</h3>

              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {item.deskripsi || "Tidak ada deskripsi."}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <b>Mapel:</b> {item.mengajar?.mapel?.nama_mapel || "-"}
                </p>
                <p>
                  <b>Kelas:</b> {item.mengajar?.kelas?.nama_kelas || "-"}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarClock size={15} />
                  {item.deadline
                    ? new Date(item.deadline).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Tanpa deadline"}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <Users size={16} className="mx-auto mb-1" />
                  <p className="font-bold">{item.total_siswa}</p>
                  <p className="text-xs text-slate-500">Siswa</p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <CheckCircle size={16} className="mx-auto mb-1" />
                  <p className="font-bold">{item.selesai}</p>
                  <p className="text-xs">Kumpul</p>
                </div>

                <div className="rounded-2xl bg-green-50 p-3 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <CheckCircle size={16} className="mx-auto mb-1" />
                  <p className="font-bold">{item.dinilai}</p>
                  <p className="text-xs">Dinilai</p>
                </div>
              </div>

              <Link
                href={`/guru/pengumpulan-tugas/${item.id_tugas}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Eye size={16} />
                Lihat Pengumpulan
              </Link>
            </div>
          ))}

          {paginatedData.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
              Data tugas tidak ditemukan.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 md:flex-row">
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