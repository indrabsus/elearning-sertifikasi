"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  ListChecks,
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

type Kompetensi = {
  id_kompetensi: string
  id_jurusan: string | null
  judul: string
  deskripsi: string | null
  tingkat: number | null
  syarat_lulus: number | null
  jurusan?: {
    kode_jurusan: string
    nama_jurusan: string
  }
}

type KompetensiTugas = {
  id_kompetensi_tugas: string
  id_kompetensi: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  status: "draft" | "aktif" | "ditutup"
  created_at: string | null
}

type BankSoal = {
  id_soal: string
  id_guru: string | null
  id_mapel: string | null
  tipe_soal: "pg" | "essay"
  pertanyaan: string
  pembahasan: string | null
  tingkat_kesulitan: string | null
  created_at: string | null
  mapel?: {
    nama_mapel: string
  }
}

type KompetensiTugasSoal = {
  id_kompetensi_tugas_soal: string
  id_kompetensi_tugas: string
  id_soal: string
  nomor: number
  bobot: number
  bank_soal?: BankSoal
}

type SortKey = "judul" | "deadline" | "status" | "created_at"

const ITEMS_PER_PAGE = 10

export default function KajurKompetensiTugasPage() {
  const router = useRouter()
  const params = useParams()
  const idKompetensi = String(params.id)

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [kompetensi, setKompetensi] = useState<Kompetensi | null>(null)
  const [tugasList, setTugasList] = useState<KompetensiTugas[]>([])
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([])
  const [tugasSoalList, setTugasSoalList] = useState<KompetensiTugasSoal[]>([])

  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<"draft" | "aktif" | "ditutup">("draft")
  const [saving, setSaving] = useState(false)

  const [modalSoalOpen, setModalSoalOpen] = useState(false)
  const [selectedTugas, setSelectedTugas] =
    useState<KompetensiTugas | null>(null)
  const [selectedSoalIds, setSelectedSoalIds] = useState<string[]>([])
  const [savingSoal, setSavingSoal] = useState(false)

  const getData = async () => {
    try {
      const [kompetensiData, tugasData, bankSoalData, tugasSoalData] =
        await Promise.all([
          supabase
            .from("kompetensi")
            .select(
              `
                id_kompetensi,
                id_jurusan,
                judul,
                deskripsi,
                tingkat,
                syarat_lulus,
                jurusan:id_jurusan (
                  kode_jurusan,
                  nama_jurusan
                )
              `
            )
            .eq("id_kompetensi", idKompetensi)
            .maybeSingle(),

          fetchAll(
            "kompetensi_tugas",
            `
              id_kompetensi_tugas,
              id_kompetensi,
              judul,
              deskripsi,
              deadline,
              status,
              created_at
            `,
            "created_at",
            false
          ),

          fetchAll(
            "bank_soal",
            `
              id_soal,
              id_guru,
              id_mapel,
              tipe_soal,
              pertanyaan,
              pembahasan,
              tingkat_kesulitan,
              created_at,
              mapel:id_mapel (
                nama_mapel
              )
            `,
            "created_at",
            false
          ),

          fetchAll(
            "kompetensi_tugas_soal",
            `
              id_kompetensi_tugas_soal,
              id_kompetensi_tugas,
              id_soal,
              nomor,
              bobot,
              bank_soal:id_soal (
                id_soal,
                id_guru,
                id_mapel,
                tipe_soal,
                pertanyaan,
                pembahasan,
                tingkat_kesulitan,
                created_at,
                mapel:id_mapel (
                  nama_mapel
                )
              )
            `
          ),
        ])

      if (kompetensiData.error) {
        alert(kompetensiData.error.message)
        return
      }

      if (!kompetensiData.data) {
        alert("Kompetensi tidak ditemukan")
        router.replace("/kajur/kompetensi")
        return
      }

      const tugasKompetensi = (tugasData || []).filter(
        (item: any) => item.id_kompetensi === idKompetensi
      )

      const tugasIds = tugasKompetensi.map(
        (item: any) => item.id_kompetensi_tugas
      )

      const relasiSoal = (tugasSoalData || []).filter((item: any) =>
        tugasIds.includes(item.id_kompetensi_tugas)
      )

      setKompetensi(kompetensiData.data as Kompetensi)
      setTugasList(tugasKompetensi as KompetensiTugas[])
      setBankSoalList((bankSoalData || []) as BankSoal[])
      setTugasSoalList(relasiSoal as KompetensiTugasSoal[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data tugas kompetensi")
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
  }, [router, idKompetensi])

  const resetForm = () => {
    setIdEdit(null)
    setJudul("")
    setDeskripsi("")
    setDeadline("")
    setStatus("draft")
    setSaving(false)
  }

  const openTambah = () => {
    resetForm()
    setModalOpen(true)
  }

  const closeModal = () => {
    resetForm()
    setModalOpen(false)
  }

  const formatDateTimeLocal = (value: string | null) => {
    if (!value) return ""

    const date = new Date(value)
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)

    return localDate.toISOString().slice(0, 16)
  }

  const openEdit = (item: KompetensiTugas) => {
    setIdEdit(item.id_kompetensi_tugas)
    setJudul(item.judul || "")
    setDeskripsi(item.deskripsi || "")
    setDeadline(formatDateTimeLocal(item.deadline))
    setStatus(item.status || "draft")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!judul.trim()) {
      alert("Judul tugas kompetensi wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      id_kompetensi: idKompetensi,
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("kompetensi_tugas")
        .update(payload)
        .eq("id_kompetensi_tugas", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("kompetensi_tugas").insert(payload)

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
    if (!confirm("Yakin ingin menghapus tugas kompetensi ini?")) return

    const { error } = await supabase
      .from("kompetensi_tugas")
      .delete()
      .eq("id_kompetensi_tugas", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const openKelolaSoal = (tugas: KompetensiTugas) => {
    const soalTerpilih = tugasSoalList
      .filter((item) => item.id_kompetensi_tugas === tugas.id_kompetensi_tugas)
      .sort((a, b) => Number(a.nomor) - Number(b.nomor))
      .map((item) => item.id_soal)

    setSelectedTugas(tugas)
    setSelectedSoalIds(soalTerpilih)
    setModalSoalOpen(true)
  }

  const toggleSoal = (idSoal: string) => {
    setSelectedSoalIds((prev) =>
      prev.includes(idSoal)
        ? prev.filter((id) => id !== idSoal)
        : [...prev, idSoal]
    )
  }

  const simpanSoalTugas = async () => {
    if (!selectedTugas) return

    setSavingSoal(true)

    const { error: deleteError } = await supabase
      .from("kompetensi_tugas_soal")
      .delete()
      .eq("id_kompetensi_tugas", selectedTugas.id_kompetensi_tugas)

    if (deleteError) {
      alert(deleteError.message)
      setSavingSoal(false)
      return
    }

    const payload = selectedSoalIds.map((idSoal, index) => ({
      id_kompetensi_tugas: selectedTugas.id_kompetensi_tugas,
      id_soal: idSoal,
      nomor: index + 1,
      bobot: 1,
    }))

    if (payload.length > 0) {
      const { error } = await supabase
        .from("kompetensi_tugas_soal")
        .insert(payload)

      if (error) {
        alert(error.message)
        setSavingSoal(false)
        return
      }
    }

    setSelectedTugas(null)
    setSelectedSoalIds([])
    setModalSoalOpen(false)
    setSavingSoal(false)

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

    const data = tugasList.filter((item) => {
      return (
        item.judul.toLowerCase().includes(keyword) ||
        (item.deskripsi || "").toLowerCase().includes(keyword) ||
        (item.status || "").toLowerCase().includes(keyword)
      )
    })

    data.sort((a, b) => {
      let aVal: any = ""
      let bVal: any = ""

      if (sortKey === "judul") {
        aVal = a.judul || ""
        bVal = b.judul || ""
      }

      if (sortKey === "deadline") {
        aVal = a.deadline || ""
        bVal = b.deadline || ""
      }

      if (sortKey === "status") {
        aVal = a.status || ""
        bVal = b.status || ""
      }

      if (sortKey === "created_at") {
        aVal = a.created_at || ""
        bVal = b.created_at || ""
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return data
  }, [tugasList, search, sortKey, sortDirection])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const getJumlahSoal = (idTugas: string) => {
    return tugasSoalList.filter(
      (item) => item.id_kompetensi_tugas === idTugas
    ).length
  }

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

  const getStatusBadge = (statusValue: KompetensiTugas["status"]) => {
    if (statusValue === "aktif") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Aktif
        </span>
      )
    }

    if (statusValue === "ditutup") {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
          Ditutup
        </span>
      )
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Draft
      </span>
    )
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Tugas Kompetensi"
      role="kajur"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <Link
          href="/kajur/kompetensi"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Kembali ke Kompetensi
        </Link>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {kompetensi?.judul || "Tugas Kompetensi"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {kompetensi?.jurusan?.kode_jurusan || "-"} • Syarat lulus{" "}
              {kompetensi?.syarat_lulus || 75}
            </p>
          </div>

          <button
            onClick={openTambah}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus size={18} />
            Tambah Tugas
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Tugas Kompetensi</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Tugas Aktif</p>
          <h2 className="mt-2 text-3xl font-bold">
            {tugasList.filter((item) => item.status === "aktif").length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Bank Soal</p>
          <h2 className="mt-2 text-3xl font-bold">{bankSoalList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Soal Dipakai</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasSoalList.length}</h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Tugas Kompetensi</h2>
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
              placeholder="Cari tugas kompetensi..."
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
                    <SortButton label="Judul" sort="judul" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Deadline" sort="deadline" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Status" sort="status" />
                  </th>
                  <th className="p-4">Soal</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id_kompetensi_tugas}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                          <ClipboardList size={18} />
                        </div>

                        <div>
                          <p className="font-semibold">{item.judul}</p>
                          {item.deskripsi && (
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {item.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {item.deadline
                        ? new Date(item.deadline).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>

                    <td className="p-4">{getStatusBadge(item.status)}</td>

                    <td className="p-4">
                      <button
                        onClick={() => openKelolaSoal(item)}
                        className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {getJumlahSoal(item.id_kompetensi_tugas)} Soal
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openKelolaSoal(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700"
                        >
                          <ListChecks size={16} />
                        </button>

                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_kompetensi_tugas)}
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
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Data tugas kompetensi tidak ditemukan
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
                  {idEdit ? "Edit Tugas Kompetensi" : "Tambah Tugas Kompetensi"}
                </h2>
                <p className="text-sm text-slate-500">
                  Tugas ini menjadi syarat siswa mendapatkan sertifikat.
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
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Judul tugas kompetensi"
              />

              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Deskripsi / instruksi..."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Deadline</label>
                  <div className="relative mt-1">
                    <CalendarClock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as "draft" | "aktif" | "ditutup"
                      )
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="draft">Draft</option>
                    <option value="aktif">Aktif</option>
                    <option value="ditutup">Ditutup</option>
                  </select>
                </div>
              </div>

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

      {modalSoalOpen && selectedTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Kelola Soal Kompetensi</h2>
                <p className="text-sm text-slate-500">{selectedTugas.judul}</p>
              </div>

              <button
                onClick={() => setModalSoalOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {bankSoalList.map((soal, index) => (
                <label
                  key={soal.id_soal}
                  className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedSoalIds.includes(soal.id_soal)}
                    onChange={() => toggleSoal(soal.id_soal)}
                    className="mt-1 h-4 w-4"
                  />

                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {soal.tipe_soal?.toUpperCase()}
                      </span>

                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {soal.tingkat_kesulitan || "-"}
                      </span>

                      <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {soal.mapel?.nama_mapel || "Tanpa Mapel"}
                      </span>
                    </div>

                    <p className="font-medium">
                      {index + 1}. {soal.pertanyaan}
                    </p>

                    {soal.pembahasan && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {soal.pembahasan}
                      </p>
                    )}
                  </div>
                </label>
              ))}

              {bankSoalList.length === 0 && (
                <div className="rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                  Belum ada soal di bank soal.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalSoalOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={simpanSoalTugas}
                disabled={savingSoal}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {savingSoal
                  ? "Menyimpan..."
                  : `Simpan ${selectedSoalIds.length} Soal`}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}