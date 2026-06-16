"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarRange, Pencil, Plus, Trash2, X } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type TahunAjaran = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
  aktif: boolean
}

export default function AdminTahunAjaranPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TahunAjaran[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [namaTahunAjaran, setNamaTahunAjaran] = useState("")
  const [semester, setSemester] = useState("ganjil")
  const [aktif, setAktif] = useState(false)
  const [saving, setSaving] = useState(false)

  const getData = async () => {
    const { data, error } = await supabase
      .from("tahun_ajaran")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setData((data || []) as TahunAjaran[])
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
    setNamaTahunAjaran("")
    setSemester("ganjil")
    setAktif(false)
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

  const handleEdit = (item: TahunAjaran) => {
    setIdEdit(item.id_tahun_ajaran)
    setNamaTahunAjaran(item.nama_tahun_ajaran)
    setSemester(item.semester)
    setAktif(item.aktif)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaTahunAjaran.trim()) {
      alert("Nama tahun ajaran wajib diisi")
      return
    }

    setSaving(true)

    if (aktif) {
      const { error: updateError } = await supabase
        .from("tahun_ajaran")
        .update({ aktif: false })
        .neq("id_tahun_ajaran", idEdit || "")

      if (updateError) {
        alert(updateError.message)
        setSaving(false)
        return
      }
    }

    const payload = {
      nama_tahun_ajaran: namaTahunAjaran.trim(),
      semester,
      aktif,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("tahun_ajaran")
        .update(payload)
        .eq("id_tahun_ajaran", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("tahun_ajaran").insert(payload)

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
    if (!confirm("Yakin ingin menghapus tahun ajaran ini?")) return

    const { error } = await supabase
      .from("tahun_ajaran")
      .delete()
      .eq("id_tahun_ajaran", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  if (loading) {
  return <PageLoader />
}

  return (
    <DashboardLayout title="Tahun Ajaran" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Tahun Ajaran</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola tahun ajaran dan semester aktif aplikasi.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Tahun Ajaran
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5">
          <h2 className="font-semibold">Data Tahun Ajaran</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total {data.length} data tahun ajaran
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">Tahun Ajaran</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.map((item, index) => (
                  <tr
                    key={item.id_tahun_ajaran}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                          <CalendarRange size={18} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {item.nama_tahun_ajaran}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Semester {item.semester}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 capitalize text-slate-700 dark:text-slate-300">
                      {item.semester}
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
                          onClick={() => handleDelete(item.id_tahun_ajaran)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data tahun ajaran belum ada
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
                  {idEdit ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lengkapi data tahun ajaran dan semester.
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
                  <label className="text-sm font-medium">
                    Nama Tahun Ajaran
                  </label>
                  <input
                    value={namaTahunAjaran}
                    onChange={(e) => setNamaTahunAjaran(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="2026/2027"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={aktif ? "true" : "false"}
                    onChange={(e) => setAktif(e.target.value === "true")}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="false">Nonaktif</option>
                    <option value="true">Aktif</option>
                  </select>

                  {aktif && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Jika disimpan aktif, tahun ajaran lain otomatis dinonaktifkan.
                    </p>
                  )}
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