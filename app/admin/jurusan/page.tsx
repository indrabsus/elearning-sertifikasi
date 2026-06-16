"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Jurusan = {
  id_jurusan: string
  kode_jurusan: string
  nama_jurusan: string
  aktif: boolean
}

export default function AdminJurusanPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Jurusan[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [kodeJurusan, setKodeJurusan] = useState("")
  const [namaJurusan, setNamaJurusan] = useState("")
  const [aktif, setAktif] = useState(true)
  const [saving, setSaving] = useState(false)

  const getData = async () => {
    const { data, error } = await supabase
      .from("jurusan")
      .select("*")
      .order("kode_jurusan", { ascending: true })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setData((data || []) as Jurusan[])
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
    setKodeJurusan("")
    setNamaJurusan("")
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

  const handleEdit = (item: Jurusan) => {
    setIdEdit(item.id_jurusan)
    setKodeJurusan(item.kode_jurusan)
    setNamaJurusan(item.nama_jurusan)
    setAktif(item.aktif)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!kodeJurusan.trim() || !namaJurusan.trim()) {
      alert("Kode jurusan dan nama jurusan wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      kode_jurusan: kodeJurusan.trim().toUpperCase(),
      nama_jurusan: namaJurusan.trim(),
      aktif,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("jurusan")
        .update(payload)
        .eq("id_jurusan", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("jurusan").insert(payload)

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
    const yakin = confirm("Yakin ingin menghapus jurusan ini?")
    if (!yakin) return

    const { error } = await supabase
      .from("jurusan")
      .delete()
      .eq("id_jurusan", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const filteredData = data.filter((item) => {
    const keyword = search.toLowerCase()

    return (
      item.kode_jurusan.toLowerCase().includes(keyword) ||
      item.nama_jurusan.toLowerCase().includes(keyword)
    )
  })

  if (loading) {
  return <PageLoader />
}

  return (
    <DashboardLayout title="Kelola Jurusan" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Jurusan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tambah, edit, dan hapus data jurusan sekolah.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Jurusan
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Jurusan</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total {filteredData.length} data ditampilkan
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
              placeholder="Cari jurusan..."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">Kode</th>
                  <th className="p-4">Nama Jurusan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredData.map((item, index) => (
                  <tr
                    key={item.id_jurusan}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>

                    <td className="p-4">
                      <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {item.kode_jurusan}
                      </span>
                    </td>

                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                      {item.nama_jurusan}
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
                          onClick={() => handleDelete(item.id_jurusan)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data jurusan tidak ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Jurusan" : "Tambah Jurusan"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lengkapi data jurusan sekolah.
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
                  <label className="text-sm font-medium">Kode Jurusan</label>
                  <input
                    value={kodeJurusan}
                    onChange={(e) => setKodeJurusan(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="PPLG"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nama Jurusan</label>
                  <input
                    value={namaJurusan}
                    onChange={(e) => setNamaJurusan(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Pengembangan Perangkat Lunak dan Gim"
                  />
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