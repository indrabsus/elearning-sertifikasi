"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  FileUp,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Guru = {
  id_guru: string
  uid_fp: string | null
  nama_lengkap: string
  jenkel: string | null
  no_hp: string | null
  created_at?: string
}

type SortKey = "uid_fp" | "nama_lengkap" | "jenkel" | "no_hp"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function AdminGuruPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [guru, setGuru] = useState<Guru[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [uidFp, setUidFp] = useState("")
  const [namaLengkap, setNamaLengkap] = useState("")
  const [jenkel, setJenkel] = useState("")
  const [noHp, setNoHp] = useState("")
  const [saving, setSaving] = useState(false)

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nama_lengkap",
    direction: "asc",
  })
  const [currentPage, setCurrentPage] = useState(1)

  const getData = async () => {
    const { data, error } = await supabase
      .from("guru")
      .select("*")
      .order("nama_lengkap", { ascending: true })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setGuru((data || []) as Guru[])
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
    setUidFp("")
    setNamaLengkap("")
    setJenkel("")
    setNoHp("")
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

  const handleEdit = (item: Guru) => {
    setIdEdit(item.id_guru)
    setUidFp(item.uid_fp || "")
    setNamaLengkap(item.nama_lengkap)
    setJenkel(item.jenkel || "")
    setNoHp(item.no_hp || "")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaLengkap.trim()) {
      alert("Nama lengkap wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      uid_fp: uidFp.trim() || null,
      nama_lengkap: namaLengkap.trim(),
      jenkel: jenkel || null,
      no_hp: noHp.trim() || null,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("guru")
        .update(payload)
        .eq("id_guru", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("guru").insert(payload)

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
    if (!confirm("Yakin ingin menghapus guru ini?")) return

    const { error } = await supabase.from("guru").delete().eq("id_guru", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const downloadTemplate = () => {
    const csv = `uid_fp,nama_lengkap,jenkel,no_hp
1001,Indra Setiawan,L,08123456789
1002,Siti Aminah,P,08123456780`

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "template_guru.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!csvFile) {
      alert("Pilih file CSV terlebih dahulu")
      return
    }

    setImporting(true)

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[]

          const payload = rows
            .map((row) => ({
              uid_fp: row.uid_fp?.toString().trim() || null,
              nama_lengkap: row.nama_lengkap?.toString().trim(),
              jenkel: row.jenkel?.toString().trim() || null,
              no_hp: row.no_hp?.toString().trim() || null,
            }))
            .filter((row) => row.nama_lengkap)

          if (payload.length === 0) {
            alert("Data CSV kosong atau format kolom salah")
            setImporting(false)
            return
          }

          const { error } = await supabase.from("guru").insert(payload)

          if (error) {
            alert(error.message)
            setImporting(false)
            return
          }

          alert(`${payload.length} data guru berhasil diimport`)
          setCsvFile(null)
          await getData()
        } catch (err) {
          console.error(err)
          alert("Gagal import CSV")
        } finally {
          setImporting(false)
        }
      },
      error: (error) => {
        alert(error.message)
        setImporting(false)
      },
    })
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

  const filteredAndSortedGuru = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = guru.filter((item) => {
      return (
        item.nama_lengkap.toLowerCase().includes(keyword) ||
        (item.uid_fp || "").toLowerCase().includes(keyword) ||
        (item.jenkel || "").toLowerCase().includes(keyword) ||
        (item.no_hp || "").toLowerCase().includes(keyword)
      )
    })

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key] || ""
      const bValue = b[sortConfig.key] || ""

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })

    return filtered
  }, [guru, search, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedGuru.length / ITEMS_PER_PAGE)

  const paginatedGuru = filteredAndSortedGuru.slice(
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
    <DashboardLayout title="Kelola Guru" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Guru</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tambah, edit, hapus, import CSV, sorting, dan pagination data guru.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Guru
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Import Guru dari CSV</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Format kolom: uid_fp, nama_lengkap, jenkel, no_hp
            </p>
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Download size={18} />
            Download Template
          </button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 md:w-auto"
          />

          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <FileUp size={18} />
            {importing ? "Mengimport..." : "Import CSV"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Guru</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {paginatedGuru.length} dari{" "}
              {filteredAndSortedGuru.length} data
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
              placeholder="Cari guru..."
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
                    <SortButton label="UID FP" sortKey="uid_fp" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Nama Lengkap" sortKey="nama_lengkap" />
                  </th>
                  <th className="p-4">
                    <SortButton label="JK" sortKey="jenkel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="No HP" sortKey="no_hp" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedGuru.map((item, index) => (
                  <tr
                    key={item.id_guru}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4">
                      <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {item.uid_fp || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                          <UserCog size={18} />
                        </div>

                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.nama_lengkap}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.jenkel || "-"}
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.no_hp || "-"}
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
                          onClick={() => handleDelete(item.id_guru)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedGuru.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data guru tidak ditemukan
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
                  {idEdit ? "Edit Guru" : "Tambah Guru"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lengkapi data guru sekolah.
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
                  <label className="text-sm font-medium">UID Fingerprint</label>
                  <input
                    value={uidFp}
                    onChange={(e) => setUidFp(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="1001"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <input
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Nama guru"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Jenis Kelamin</label>
                  <select
                    value={jenkel}
                    onChange={(e) => setJenkel(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">No HP</label>
                  <input
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="08123456789"
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