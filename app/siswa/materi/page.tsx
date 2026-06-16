"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  PlayCircle,
  Search,
  X,
} from "lucide-react"

import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"
import { protectPage } from "@/lib/protect"
import { fetchAll } from "@/lib/fetchAll"

type Profile = {
  id_profile: string
  nama_lengkap: string
  nama_role: string
  id_siswa: string | null
}

type SiswaKelas = {
  id_siswa_kelas: string
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  kelas?: {
    nama_kelas: string
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

type Materi = {
  id_materi: string
  id_mengajar: string
  judul: string
  isi: string | null
  file_url: string | null
  created_at: string | null
  mengajar?: Mengajar
}

const ITEMS_PER_PAGE = 9

export default function SiswaMateriPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [siswaKelas, setSiswaKelas] = useState<SiswaKelas | null>(null)
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])

  const [search, setSearch] = useState("")
  const [filterMapel, setFilterMapel] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedMateri, setSelectedMateri] = useState<Materi | null>(null)

  const getYoutubeId = (url: string) => {
    if (!url) return null

    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/embed\/([^?&]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) return match[1]
    }

    return null
  }

  const getYoutubeThumbnail = (url: string | null) => {
    if (!url) return null

    const videoId = getYoutubeId(url)
    if (!videoId) return null

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  }

  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null

    const videoId = getYoutubeId(url)
    if (!videoId) return null

    return `https://www.youtube.com/embed/${videoId}`
  }

  const isYoutubeUrl = (url: string | null) => {
    if (!url) return false
    return Boolean(getYoutubeId(url))
  }

  const getData = async (userProfile: Profile) => {
    try {
      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")

      if (!idTahunAjaran) {
        router.replace("/login")
        return
      }

      if (!userProfile.id_siswa) {
        router.replace("/login")
        return
      }

      const [siswaKelasData, mengajarData, materiData] = await Promise.all([
        fetchAll(
          "siswa_kelas",
          `
            id_siswa_kelas,
            id_siswa,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            kelas:id_kelas (
              nama_kelas
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
          "materi",
          `
            id_materi,
            id_mengajar,
            judul,
            isi,
            file_url,
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

      const materiSiswa = (materiData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      setSiswaKelas(kelasAktif as SiswaKelas)
      setMengajarList(mengajarSiswa as Mengajar[])
      setMateriList(materiSiswa as Materi[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data materi")
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

  const mapelOptions = useMemo(() => {
    const map = new Map<string, string>()

    mengajarList.forEach((item) => {
      if (item.id_mapel) {
        map.set(item.id_mapel, item.mapel?.nama_mapel || "-")
      }
    })

    return Array.from(map.entries()).map(([id_mapel, nama_mapel]) => ({
      id_mapel,
      nama_mapel,
    }))
  }, [mengajarList])

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase()

    return materiList.filter((item) => {
      const matchSearch =
        item.judul.toLowerCase().includes(keyword) ||
        (item.isi || "").toLowerCase().includes(keyword) ||
        (item.mengajar?.mapel?.nama_mapel || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.mengajar?.guru?.nama_lengkap || "")
          .toLowerCase()
          .includes(keyword)

      const matchMapel = filterMapel
        ? item.mengajar?.id_mapel === filterMapel
        : true

      return matchSearch && matchMapel
    })
  }, [materiList, search, filterMapel])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterMapel])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Materi"
      role="siswa"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Materi Pembelajaran</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Materi dari guru berdasarkan kelas kamu:{" "}
          <b>{siswaKelas?.kelas?.nama_kelas || "-"}</b>
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Materi</p>
          <h2 className="mt-2 text-3xl font-bold">{materiList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Mapel</p>
          <h2 className="mt-2 text-3xl font-bold">{mapelOptions.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Guru</p>
          <h2 className="mt-2 text-3xl font-bold">
            {new Set(mengajarList.map((item) => item.id_guru)).size}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Video YouTube</p>
          <h2 className="mt-2 text-3xl font-bold">
            {materiList.filter((item) => isYoutubeUrl(item.file_url)).length}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Daftar Materi</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {paginatedData.length} dari {filteredData.length}{" "}
              materi
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Semua Mapel</option>
              {mapelOptions.map((item) => (
                <option key={item.id_mapel} value={item.id_mapel}>
                  {item.nama_mapel}
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
                placeholder="Cari materi..."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paginatedData.map((materi) => {
            const thumbnail = getYoutubeThumbnail(materi.file_url)
            const youtube = isYoutubeUrl(materi.file_url)

            return (
              <div
                key={materi.id_materi}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={materi.judul}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen size={52} className="text-slate-400" />
                    </div>
                  )}

                  {youtube && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-xl">
                        <PlayCircle size={38} />
                      </div>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur dark:bg-slate-950/90 dark:text-slate-200">
                    {youtube ? "YouTube" : materi.file_url ? "Link/File" : "Materi"}
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {materi.mengajar?.mapel?.nama_mapel || "-"}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold">
                    {materi.judul}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                    {materi.isi || "Tidak ada deskripsi materi."}
                  </p>

                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <p className="text-sm font-medium">
                      {materi.mengajar?.guru?.nama_lengkap || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {materi.created_at
                        ? new Date(materi.created_at).toLocaleDateString(
                            "id-ID"
                          )
                        : "-"}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedMateri(materi)}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Lihat Materi
                    </button>

                    {materi.file_url && (
                      <a
                        href={materi.file_url}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Buka
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {paginatedData.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
              Data materi tidak ditemukan.
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

      {selectedMateri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{selectedMateri.judul}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedMateri.mengajar?.mapel?.nama_mapel || "-"} •{" "}
                  {selectedMateri.mengajar?.guru?.nama_lengkap || "-"}
                </p>
              </div>

              <button
                onClick={() => setSelectedMateri(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {getYoutubeEmbedUrl(selectedMateri.file_url) && (
              <div className="mb-5 aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={getYoutubeEmbedUrl(selectedMateri.file_url) || ""}
                  title={selectedMateri.judul}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {selectedMateri.isi || "Tidak ada isi materi."}
            </div>

            {selectedMateri.file_url && (
              <a
                href={selectedMateri.file_url}
                target="_blank"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FileText size={16} />
                Buka Link Materi
              </a>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}