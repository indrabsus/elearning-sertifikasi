"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
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
  mapel?: {
    nama_mapel: string
  }
  kelas?: {
    nama_kelas: string
    tingkat: number
    jurusan?: {
      kode_jurusan: string
    }
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

type SortKey = "judul" | "mapel" | "kelas" | "created_at"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function GuruMateriPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [idMengajar, setIdMengajar] = useState("")
  const [judul, setJudul] = useState("")
  const [isi, setIsi] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
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

      const [mengajarData, materiData] = await Promise.all([
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
              nama_kelas,
              tingkat,
              jurusan:id_jurusan (
                kode_jurusan
              )
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
              kelas:id_kelas (
                nama_kelas,
                tingkat,
                jurusan:id_jurusan (
                  kode_jurusan
                )
              )
            )
          `,
          "created_at",
          false
        ),
      ])

      const mengajarGuru = (mengajarData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      const mengajarIds = mengajarGuru.map((item: any) => item.id_mengajar)

      const materiGuru = (materiData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setMateriList(materiGuru as Materi[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data materi")
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

  const resetForm = () => {
    setIdEdit(null)
    setIdMengajar("")
    setJudul("")
    setIsi("")
    setFileUrl("")
    setSaving(false)
  }

  const openTambahModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    resetForm()
    setModalOpen(false)
  }

  const handleEdit = (item: Materi) => {
    setIdEdit(item.id_materi)
    setIdMengajar(item.id_mengajar)
    setJudul(item.judul || "")
    setIsi(item.isi || "")
    setFileUrl(item.file_url || "")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!idMengajar || !judul.trim()) {
      alert("Pembagian mengajar dan judul materi wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      id_mengajar: idMengajar,
      judul: judul.trim(),
      isi: isi.trim() || null,
      file_url: fileUrl.trim() || null,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("materi")
        .update(payload)
        .eq("id_materi", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("materi").insert(payload)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    }

    closeModal()

    if (profile) {
      await getData(profile)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus materi ini?")) return

    const { error } = await supabase.from("materi").delete().eq("id_materi", id)

    if (error) {
      alert(error.message)
      return
    }

    if (profile) {
      await getData(profile)
    }
  }

  const handleSort = (key: SortKey) => {
    setCurrentPage(1)

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        }
      }

      return {
        key,
        direction: "asc",
      }
    })
  }

  const getSortValue = (item: Materi, key: SortKey) => {
    if (key === "judul") return item.judul || ""
    if (key === "mapel") return item.mengajar?.mapel?.nama_mapel || ""
    if (key === "kelas") return item.mengajar?.kelas?.nama_kelas || ""
    if (key === "created_at") return item.created_at || ""
    return ""
  }

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = materiList.filter((item) => {
      return (
        (item.judul || "").toLowerCase().includes(keyword) ||
        (item.isi || "").toLowerCase().includes(keyword) ||
        (item.mengajar?.mapel?.nama_mapel || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.mengajar?.kelas?.nama_kelas || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.mengajar?.kelas?.jurusan?.kode_jurusan || "")
          .toLowerCase()
          .includes(keyword)
      )
    })

    filtered.sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key)
      const bValue = getSortValue(b, sortConfig.key)

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

    return filtered
  }, [materiList, search, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

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

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Materi"
      role="guru"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Materi Pembelajaran</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola materi berdasarkan mapel dan kelas yang Anda ampu.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Materi
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Materi
          </p>
          <h2 className="mt-2 text-3xl font-bold">{materiList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pembagian Mengajar
          </p>
          <h2 className="mt-2 text-3xl font-bold">{mengajarList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Materi Berfile
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {materiList.filter((item) => item.file_url).length}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Materi</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {paginatedData.length} dari{" "}
              {filteredAndSortedData.length} data
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Cari judul / mapel / kelas..."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">
                    <SortButton label="Judul" sortKey="judul" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Mapel" sortKey="mapel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kelas" sortKey="kelas" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Tanggal" sortKey="created_at" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id_materi}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                          <FileText size={18} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {item.judul}
                          </p>

                          {item.isi && (
                            <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.isi}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {item.mengajar?.mapel?.nama_mapel || "-"}
                    </td>

                    <td className="p-4">
                      <span className="rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {item.mengajar?.kelas?.nama_kelas || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("id-ID")
                        : "-"}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                            title="Buka file"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}

                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-yellow-950 dark:hover:text-yellow-300"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_materi)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data materi tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 md:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Materi" : "Tambah Materi"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tambahkan judul, isi materi, dan link file jika ada.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mapel / Kelas</label>
                  <select
                    value={idMengajar}
                    onChange={(e) => setIdMengajar(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Pilih pembagian mengajar</option>
                    {mengajarList.map((item) => (
                      <option key={item.id_mengajar} value={item.id_mengajar}>
                        {item.mapel?.nama_mapel || "-"} -{" "}
                        {item.kelas?.nama_kelas || "-"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Judul Materi</label>
                  <input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Contoh: Introduction to Narrative Text"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Isi Materi</label>
                  <textarea
                    value={isi}
                    onChange={(e) => setIsi(e.target.value)}
                    className="mt-1 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Tulis isi materi..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">File URL</label>
                  <input
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>

                <button
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : idEdit ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}