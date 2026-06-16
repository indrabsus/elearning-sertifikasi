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
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Mapel = {
  id_mapel: string
  nama_mapel: string
  created_at?: string
}

type SortKey = "nama_mapel" | "created_at"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function AdminMapelPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [mapel, setMapel] = useState<Mapel[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [namaMapel, setNamaMapel] = useState("")
  const [saving, setSaving] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nama_mapel",
    direction: "asc",
  })
  const [currentPage, setCurrentPage] = useState(1)

  const getData = async () => {
    const { data, error } = await supabase
      .from("mapel")
      .select("*")
      .order("nama_mapel", { ascending: true })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setMapel((data || []) as Mapel[])
    setLoading(false)
  }

  useEffect(() => {
    const check = async () => {
      const profile = await protectPage(["admin"], router)
      if (!profile) return
      await getData()
    }

    check()
  }, [router])

  const resetForm = () => {
    setIdEdit(null)
    setNamaMapel("")
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

  const handleEdit = (item: Mapel) => {
    setIdEdit(item.id_mapel)
    setNamaMapel(item.nama_mapel)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaMapel.trim()) {
      alert("Nama mapel wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      nama_mapel: namaMapel.trim(),
    }

    if (idEdit) {
      const { error } = await supabase
        .from("mapel")
        .update(payload)
        .eq("id_mapel", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("mapel").insert(payload)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    }

    closeModal()
    await getData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus mapel ini?")) return

    const { error } = await supabase.from("mapel").delete().eq("id_mapel", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
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

  const filteredAndSortedMapel = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = mapel.filter((item) =>
      item.nama_mapel.toLowerCase().includes(keyword)
    )

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key] || ""
      const bValue = b[sortConfig.key] || ""

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

    return filtered
  }, [mapel, search, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedMapel.length / ITEMS_PER_PAGE)

  const paginatedMapel = filteredAndSortedMapel.slice(
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

  if (loading) {
  return <PageLoader />
}

  return (
    <DashboardLayout title="Kelola Mapel" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Mapel</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tambah, edit, hapus, cari, sorting, dan pagination data mata pelajaran.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Mapel
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Mapel</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {paginatedMapel.length} dari {filteredAndSortedMapel.length} data
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
              placeholder="Cari mapel..."
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
                    <SortButton label="Nama Mapel" sortKey="nama_mapel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Dibuat" sortKey="created_at" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedMapel.map((item, index) => (
                  <tr
                    key={item.id_mapel}
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
                          {item.nama_mapel}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("id-ID")
                        : "-"}
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
                          onClick={() => handleDelete(item.id_mapel)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedMapel.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data mapel tidak ditemukan
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
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Mapel" : "Tambah Mapel"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lengkapi nama mata pelajaran.
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
              <div>
                <label className="text-sm font-medium">Nama Mapel</label>
                <input
                  value={namaMapel}
                  onChange={(e) => setNamaMapel(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Bahasa Inggris"
                />
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