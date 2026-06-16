"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
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

type Mapel = {
  id_mapel: string
  nama_mapel: string
}

type Kelas = {
  id_kelas: string
  nama_kelas: string
  tingkat: number
  aktif: boolean
  id_tahun_ajaran: string
  jurusan?: {
    kode_jurusan: string
    nama_jurusan: string
  }
}

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  created_at: string | null
  mapel?: Mapel
  kelas?: Kelas
}

type SortKey = "mapel" | "kelas" | "tingkat" | "jurusan" | "aktif"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function GuruMengajarPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [mapelList, setMapelList] = useState<Mapel[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [idMapel, setIdMapel] = useState("")
  const [idKelas, setIdKelas] = useState("")
  const [aktif, setAktif] = useState(true)
  const [saving, setSaving] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "kelas",
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

      const [mengajarData, mapelData, kelasData] = await Promise.all([
        fetchAll(
          "mengajar",
          `
            id_mengajar,
            id_guru,
            id_mapel,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            created_at,
            mapel:id_mapel (
              id_mapel,
              nama_mapel
            ),
            kelas:id_kelas (
              id_kelas,
              nama_kelas,
              tingkat,
              aktif,
              id_tahun_ajaran,
              jurusan:id_jurusan (
                kode_jurusan,
                nama_jurusan
              )
            )
          `,
          "created_at",
          false
        ),

        fetchAll("mapel", "id_mapel, nama_mapel", "nama_mapel"),

        fetchAll(
          "kelas",
          `
            id_kelas,
            nama_kelas,
            tingkat,
            aktif,
            id_tahun_ajaran,
            jurusan:id_jurusan (
              kode_jurusan,
              nama_jurusan
            )
          `,
          "nama_kelas"
        ),
      ])

      const mengajarGuru = (mengajarData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          item.id_tahun_ajaran === idTahunAjaran
      )

      const kelasTahunIni = (kelasData || []).filter(
        (item: any) =>
          item.id_tahun_ajaran === idTahunAjaran && item.aktif === true
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setMapelList((mapelData || []) as Mapel[])
      setKelasList(kelasTahunIni as Kelas[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data mengajar")
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
    setIdMapel("")
    setIdKelas("")
    setAktif(true)
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

  const handleEdit = (item: Mengajar) => {
    setIdEdit(item.id_mengajar)
    setIdMapel(item.id_mapel)
    setIdKelas(item.id_kelas)
    setAktif(item.aktif)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")

    if (!profile?.id_guru) {
      alert("Data guru tidak ditemukan")
      return
    }

    if (!idTahunAjaran) {
      alert("Tahun ajaran belum dipilih")
      return
    }

    if (!idMapel || !idKelas) {
      alert("Mapel dan kelas wajib dipilih")
      return
    }

    setSaving(true)

    const payload = {
      id_guru: profile.id_guru,
      id_mapel: idMapel,
      id_kelas: idKelas,
      id_tahun_ajaran: idTahunAjaran,
      aktif,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("mengajar")
        .update(payload)
        .eq("id_mengajar", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("mengajar").upsert(payload, {
        onConflict: "id_guru,id_mapel,id_kelas,id_tahun_ajaran",
      })

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
    if (!confirm("Yakin ingin menghapus pembagian mengajar ini?")) return

    const { error } = await supabase
      .from("mengajar")
      .delete()
      .eq("id_mengajar", id)

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

  const getSortValue = (item: Mengajar, key: SortKey) => {
    if (key === "mapel") return item.mapel?.nama_mapel || ""
    if (key === "kelas") return item.kelas?.nama_kelas || ""
    if (key === "tingkat") return item.kelas?.tingkat || 0
    if (key === "jurusan") return item.kelas?.jurusan?.kode_jurusan || ""
    if (key === "aktif") return item.aktif ? 1 : 0
    return ""
  }

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = mengajarList.filter((item) => {
      return (
        (item.mapel?.nama_mapel || "").toLowerCase().includes(keyword) ||
        (item.kelas?.nama_kelas || "").toLowerCase().includes(keyword) ||
        (item.kelas?.jurusan?.kode_jurusan || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.kelas?.tingkat || "").includes(keyword)
      )
    })

    filtered.sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key)
      const bValue = getSortValue(b, sortConfig.key)

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
  }, [mengajarList, search, sortConfig])

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
      title="Pembagian Mengajar"
      role="guru"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Pembagian Mengajar</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola mapel dan kelas yang Anda ampu pada tahun ajaran yang
            dipilih.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Mengajar
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Pembagian
          </p>
          <h2 className="mt-2 text-3xl font-bold">{mengajarList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Mapel
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {new Set(mengajarList.map((item) => item.id_mapel)).size}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Kelas
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {new Set(mengajarList.map((item) => item.id_kelas)).size}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Mengajar</h2>
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
              placeholder="Cari mapel / kelas / jurusan..."
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
                    <SortButton label="Mapel" sortKey="mapel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kelas" sortKey="kelas" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Tingkat" sortKey="tingkat" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Jurusan" sortKey="jurusan" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Status" sortKey="aktif" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id_mengajar}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                          <BookOpen size={18} />
                        </div>

                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.mapel?.nama_mapel || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">{item.kelas?.nama_kelas || "-"}</td>
                    <td className="p-4">{item.kelas?.tingkat || "-"}</td>

                    <td className="p-4">
                      <span className="rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {item.kelas?.jurusan?.kode_jurusan || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      {item.aktif ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                          Aktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-yellow-950 dark:hover:text-yellow-300"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_mengajar)}
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
                      colSpan={7}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data mengajar tidak ditemukan
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
                  {idEdit ? "Edit Mengajar" : "Tambah Mengajar"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pilih mapel dan kelas yang Anda ampu.
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
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Mapel</label>
                  <select
                    value={idMapel}
                    onChange={(e) => setIdMapel(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Pilih mapel</option>
                    {mapelList.map((item) => (
                      <option key={item.id_mapel} value={item.id_mapel}>
                        {item.nama_mapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Kelas</label>
                  <select
                    value={idKelas}
                    onChange={(e) => setIdKelas(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Pilih kelas</option>
                    {kelasList.map((item) => (
                      <option key={item.id_kelas} value={item.id_kelas}>
                        {item.nama_kelas}
                        {item.jurusan?.kode_jurusan
                          ? ` - ${item.jurusan.kode_jurusan}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={aktif ? "true" : "false"}
                    onChange={(e) => setAktif(e.target.value === "true")}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
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