"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
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
}

type Jurusan = {
  id_jurusan: string
  kode_jurusan: string
  nama_jurusan: string
  aktif: boolean
}

type Kompetensi = {
  id_kompetensi: string
  id_jurusan: string | null
  judul: string
  deskripsi: string | null
  tingkat: number | null
  urutan: number | null
  syarat_lulus: number | null
  dibuat_oleh: string | null
  aktif: boolean
  created_at: string | null
  jurusan?: Jurusan
}

type SortKey = "judul" | "jurusan" | "tingkat" | "urutan" | "syarat_lulus"

const ITEMS_PER_PAGE = 10

export default function KajurKompetensiPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [jurusanList, setJurusanList] = useState<Jurusan[]>([])
  const [kompetensiList, setKompetensiList] = useState<Kompetensi[]>([])

  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>("urutan")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [idJurusan, setIdJurusan] = useState("")
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [tingkat, setTingkat] = useState(10)
  const [urutan, setUrutan] = useState(1)
  const [syaratLulus, setSyaratLulus] = useState(75)
  const [aktif, setAktif] = useState(true)
  const [saving, setSaving] = useState(false)

  const getData = async () => {
    try {
      const [jurusanData, kompetensiData] = await Promise.all([
        fetchAll(
          "jurusan",
          "id_jurusan, kode_jurusan, nama_jurusan, aktif",
          "kode_jurusan"
        ),
        fetchAll(
          "kompetensi",
          `
            id_kompetensi,
            id_jurusan,
            judul,
            deskripsi,
            tingkat,
            urutan,
            syarat_lulus,
            dibuat_oleh,
            aktif,
            created_at,
            jurusan:id_jurusan (
              id_jurusan,
              kode_jurusan,
              nama_jurusan,
              aktif
            )
          `,
          "urutan"
        ),
      ])

      setJurusanList((jurusanData || []) as Jurusan[])
      setKompetensiList((kompetensiData || []) as Kompetensi[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data kompetensi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["kajur"], router)
      if (!userProfile) return

      setProfile(userProfile as Profile)
      await getData()
    }

    check()
  }, [router])

  const resetForm = () => {
    setIdEdit(null)
    setIdJurusan("")
    setJudul("")
    setDeskripsi("")
    setTingkat(10)
    setUrutan(1)
    setSyaratLulus(75)
    setAktif(true)
    setSaving(false)
  }

  const openTambah = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (item: Kompetensi) => {
    setIdEdit(item.id_kompetensi)
    setIdJurusan(item.id_jurusan || "")
    setJudul(item.judul || "")
    setDeskripsi(item.deskripsi || "")
    setTingkat(Number(item.tingkat || 10))
    setUrutan(Number(item.urutan || 1))
    setSyaratLulus(Number(item.syarat_lulus || 75))
    setAktif(Boolean(item.aktif))
    setModalOpen(true)
  }

  const closeModal = () => {
    resetForm()
    setModalOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!idJurusan || !judul.trim()) {
      alert("Jurusan dan judul kompetensi wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      id_jurusan: idJurusan,
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || null,
      tingkat: Number(tingkat),
      urutan: Number(urutan),
      syarat_lulus: Number(syaratLulus),
      dibuat_oleh: profile?.id_profile || null,
      aktif,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("kompetensi")
        .update(payload)
        .eq("id_kompetensi", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("kompetensi").insert(payload)

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
    if (!confirm("Yakin ingin menghapus kompetensi ini?")) return

    const { error } = await supabase
      .from("kompetensi")
      .delete()
      .eq("id_kompetensi", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const handleSort = (key: SortKey) => {
    setCurrentPage(1)

    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      return
    }

    setSortKey(key)
    setSortDirection("asc")
  }

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase()

    const data = kompetensiList.filter((item) => {
      return (
        item.judul.toLowerCase().includes(keyword) ||
        (item.deskripsi || "").toLowerCase().includes(keyword) ||
        (item.jurusan?.kode_jurusan || "").toLowerCase().includes(keyword) ||
        (item.jurusan?.nama_jurusan || "").toLowerCase().includes(keyword)
      )
    })

    data.sort((a, b) => {
      let aVal: any = ""
      let bVal: any = ""

      if (sortKey === "judul") {
        aVal = a.judul || ""
        bVal = b.judul || ""
      }

      if (sortKey === "jurusan") {
        aVal = a.jurusan?.kode_jurusan || ""
        bVal = b.jurusan?.kode_jurusan || ""
      }

      if (sortKey === "tingkat") {
        aVal = Number(a.tingkat || 0)
        bVal = Number(b.tingkat || 0)
      }

      if (sortKey === "urutan") {
        aVal = Number(a.urutan || 0)
        bVal = Number(b.urutan || 0)
      }

      if (sortKey === "syarat_lulus") {
        aVal = Number(a.syarat_lulus || 0)
        bVal = Number(b.syarat_lulus || 0)
      }

      if (typeof aVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return data
  }, [kompetensiList, search, sortKey, sortDirection])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const SortButton = ({
    label,
    sort,
  }: {
    label: string
    sort: SortKey
  }) => (
    <button
      onClick={() => handleSort(sort)}
      className="inline-flex items-center gap-1 font-medium hover:text-blue-600"
    >
      {label}
      <ChevronsUpDown size={14} />
    </button>
  )

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Kompetensi"
      role="kajur"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Kompetensi Jurusan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola kompetensi yang menjadi syarat sertifikat siswa.
          </p>
        </div>

        <button
          onClick={openTambah}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={18} />
          Tambah Kompetensi
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Kompetensi</p>
          <h2 className="mt-2 text-3xl font-bold">
            {kompetensiList.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Aktif</p>
          <h2 className="mt-2 text-3xl font-bold">
            {kompetensiList.filter((item) => item.aktif).length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Jurusan</p>
          <h2 className="mt-2 text-3xl font-bold">{jurusanList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Syarat Default</p>
          <h2 className="mt-2 text-3xl font-bold">75</h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Kompetensi</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {paginatedData.length} dari {filteredData.length} data
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Cari kompetensi..."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950">
                  <th className="p-4">No</th>
                  <th className="p-4">
                    <SortButton label="Kompetensi" sort="judul" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Jurusan" sort="jurusan" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Tingkat" sort="tingkat" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Urutan" sort="urutan" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Syarat" sort="syarat_lulus" />
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id_kompetensi}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold">{item.judul}</p>
                      {item.deskripsi && (
                        <p className="line-clamp-1 text-xs text-slate-500">
                          {item.deskripsi}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {item.jurusan?.kode_jurusan || "-"}
                      </span>
                    </td>

                    <td className="p-4">{item.tingkat || "-"}</td>
                    <td className="p-4">{item.urutan || "-"}</td>
                    <td className="p-4">{item.syarat_lulus || 75}</td>

                    <td className="p-4">
                      {item.aktif ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                          Aktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/kajur/kompetensi/${item.id_kompetensi}/tugas`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700"
                          title="Kelola Tugas Kompetensi"
                        >
                          <Eye size={16} />
                        </Link>

                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_kompetensi)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-slate-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Data kompetensi tidak ditemukan
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Kompetensi" : "Tambah Kompetensi"}
                </h2>
                <p className="text-sm text-slate-500">
                  Kompetensi ini akan menjadi syarat sertifikat siswa.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={idJurusan}
                onChange={(e) => setIdJurusan(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Pilih Jurusan</option>
                {jurusanList.map((item) => (
                  <option key={item.id_jurusan} value={item.id_jurusan}>
                    {item.kode_jurusan} - {item.nama_jurusan}
                  </option>
                ))}
              </select>

              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Contoh: Database Fundamental"
              />

              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Deskripsi kompetensi..."
              />

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="number"
                  value={tingkat}
                  onChange={(e) => setTingkat(Number(e.target.value))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Tingkat"
                />

                <input
                  type="number"
                  value={urutan}
                  onChange={(e) => setUrutan(Number(e.target.value))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Urutan"
                />

                <input
                  type="number"
                  value={syaratLulus}
                  onChange={(e) => setSyaratLulus(Number(e.target.value))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Syarat Lulus"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={aktif}
                  onChange={(e) => setAktif(e.target.checked)}
                />
                Aktif
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium"
                >
                  Batal
                </button>

                <button
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}