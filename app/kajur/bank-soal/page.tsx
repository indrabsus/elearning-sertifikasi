"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Pencil,
  Plus,
  Save,
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

type Mapel = {
  id_mapel: string
  nama_mapel: string
}

type BankSoal = {
  id_soal: string
  id_mapel: string | null
  tipe_soal: "pg" | "essay"
  pertanyaan: string
  pembahasan: string | null
  tingkat_kesulitan: string | null
  gambar_url: string | null
  audio_url: string | null
  created_at: string | null
  mapel?: {
    nama_mapel: string
  }
  opsi_jawaban?: OpsiJawaban[]
}

type OpsiJawaban = {
  id_opsi?: string
  id_soal?: string
  label: "A" | "B" | "C" | "D" | "E"
  isi_opsi: string
  is_benar: boolean
  gambar_url?: string | null
}

type SortKey = "created_at" | "pertanyaan" | "tipe_soal" | "tingkat_kesulitan"

const ITEMS_PER_PAGE = 10

const defaultOpsi: OpsiJawaban[] = [
  { label: "A", isi_opsi: "", is_benar: false, gambar_url: null },
  { label: "B", isi_opsi: "", is_benar: false, gambar_url: null },
  { label: "C", isi_opsi: "", is_benar: false, gambar_url: null },
  { label: "D", isi_opsi: "", is_benar: false, gambar_url: null },
  { label: "E", isi_opsi: "", is_benar: false, gambar_url: null },
]

export default function KajurBankSoalPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mapelList, setMapelList] = useState<Mapel[]>([])
  const [soalList, setSoalList] = useState<BankSoal[]>([])
  const [opsiList, setOpsiList] = useState<OpsiJawaban[]>([])

  const [search, setSearch] = useState("")
  const [filterMapel, setFilterMapel] = useState("")
  const [filterTipe, setFilterTipe] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [idMapel, setIdMapel] = useState("")
  const [tipeSoal, setTipeSoal] = useState<"pg" | "essay">("pg")
  const [pertanyaan, setPertanyaan] = useState("")
  const [pembahasan, setPembahasan] = useState("")
  const [tingkatKesulitan, setTingkatKesulitan] = useState("mudah")
  const [gambarUrl, setGambarUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [opsiForm, setOpsiForm] = useState<OpsiJawaban[]>(defaultOpsi)
  const [saving, setSaving] = useState(false)

  const getData = async () => {
    try {
      const [mapelData, soalData, opsiData] = await Promise.all([
        fetchAll("mapel", "id_mapel, nama_mapel", "nama_mapel", true),

        fetchAll(
          "bank_soal",
          `
            id_soal,
            id_mapel,
            tipe_soal,
            pertanyaan,
            pembahasan,
            tingkat_kesulitan,
            gambar_url,
            audio_url,
            created_at,
            mapel:id_mapel (
              nama_mapel
            )
          `,
          "created_at",
          false
        ),

        fetchAll(
          "opsi_jawaban",
          `
            id_opsi,
            id_soal,
            label,
            isi_opsi,
            is_benar,
            gambar_url
          `
        ),
      ])

      setMapelList((mapelData || []) as Mapel[])
      setSoalList((soalData || []) as BankSoal[])
      setOpsiList((opsiData || []) as OpsiJawaban[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data bank soal")
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
    setIdMapel("")
    setTipeSoal("pg")
    setPertanyaan("")
    setPembahasan("")
    setTingkatKesulitan("mudah")
    setGambarUrl("")
    setAudioUrl("")
    setOpsiForm(defaultOpsi)
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

  const openEdit = (soal: BankSoal) => {
    const opsiSoal = opsiList
      .filter((item) => item.id_soal === soal.id_soal)
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))

    setIdEdit(soal.id_soal)
    setIdMapel(soal.id_mapel || "")
    setTipeSoal(soal.tipe_soal)
    setPertanyaan(soal.pertanyaan || "")
    setPembahasan(soal.pembahasan || "")
    setTingkatKesulitan(soal.tingkat_kesulitan || "mudah")
    setGambarUrl(soal.gambar_url || "")
    setAudioUrl(soal.audio_url || "")
    setOpsiForm(opsiSoal.length > 0 ? opsiSoal : defaultOpsi)
    setModalOpen(true)
  }

  const handleChangeOpsi = (
    index: number,
    field: "isi_opsi" | "gambar_url",
    value: string
  ) => {
    setOpsiForm((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  const handleBenar = (index: number) => {
    setOpsiForm((prev) =>
      prev.map((item, i) => ({
        ...item,
        is_benar: i === index,
      }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pertanyaan.trim()) {
      alert("Pertanyaan wajib diisi")
      return
    }

    if (!idMapel) {
      alert("Mapel wajib dipilih")
      return
    }

    if (tipeSoal === "pg") {
      const opsiTerisi = opsiForm.filter((item) => item.isi_opsi.trim())

      if (opsiTerisi.length < 2) {
        alert("Minimal isi 2 opsi jawaban")
        return
      }

      const adaJawabanBenar = opsiForm.some(
        (item) => item.is_benar && item.isi_opsi.trim()
      )

      if (!adaJawabanBenar) {
        alert("Pilih satu jawaban benar")
        return
      }
    }

    setSaving(true)

    const payload = {
      id_mapel: idMapel,
      uid_guru: null,
      tipe_soal: tipeSoal,
      pertanyaan: pertanyaan.trim(),
      pembahasan: pembahasan.trim() || null,
      tingkat_kesulitan: tingkatKesulitan || null,
      gambar_url: gambarUrl.trim() || null,
      audio_url: audioUrl.trim() || null,
    }

    let idSoal = idEdit

    if (idEdit) {
      const { error } = await supabase
        .from("bank_soal")
        .update(payload)
        .eq("id_soal", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from("bank_soal")
        .insert(payload)
        .select("id_soal")
        .single()

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }

      idSoal = data.id_soal
    }

    if (!idSoal) {
      alert("ID soal tidak ditemukan")
      setSaving(false)
      return
    }

    const { error: deleteOpsiError } = await supabase
      .from("opsi_jawaban")
      .delete()
      .eq("id_soal", idSoal)

    if (deleteOpsiError) {
      alert(deleteOpsiError.message)
      setSaving(false)
      return
    }

    if (tipeSoal === "pg") {
      const opsiPayload = opsiForm
        .filter((item) => item.isi_opsi.trim())
        .map((item) => ({
          id_soal: idSoal,
          label: item.label,
          isi_opsi: item.isi_opsi.trim(),
          is_benar: item.is_benar,
          gambar_url: item.gambar_url?.trim() || null,
        }))

      const { error: opsiError } = await supabase
        .from("opsi_jawaban")
        .insert(opsiPayload)

      if (opsiError) {
        alert(opsiError.message)
        setSaving(false)
        return
      }
    }

    closeModal()
    await getData()
  }

  const handleDelete = async (idSoal: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return

    const { error } = await supabase
      .from("bank_soal")
      .delete()
      .eq("id_soal", idSoal)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase()

    const data = soalList.filter((item) => {
      const matchSearch =
        item.pertanyaan.toLowerCase().includes(keyword) ||
        (item.pembahasan || "").toLowerCase().includes(keyword) ||
        (item.mapel?.nama_mapel || "").toLowerCase().includes(keyword) ||
        (item.tingkat_kesulitan || "").toLowerCase().includes(keyword)

      const matchMapel = filterMapel ? item.id_mapel === filterMapel : true
      const matchTipe = filterTipe ? item.tipe_soal === filterTipe : true

      return matchSearch && matchMapel && matchTipe
    })

    data.sort((a, b) => {
      let aVal: any = a[sortKey] || ""
      let bVal: any = b[sortKey] || ""

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return data
  }, [soalList, search, filterMapel, filterTipe, sortKey, sortDirection])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterMapel, filterTipe])

  const handleSort = (key: SortKey) => {
    setCurrentPage(1)

    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      return
    }

    setSortKey(key)
    setSortDirection("asc")
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
      className="inline-flex items-center gap-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
    >
      {label}
      <ChevronsUpDown size={14} />
    </button>
  )

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Bank Soal Kajur"
      role="kajur"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bank Soal Kajur
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Soal dari sini bisa dipakai untuk tugas kompetensi dan sertifikat.
          </p>
        </div>

        <button
          onClick={openTambah}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Soal
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <InfoCard title="Total Soal" value={String(soalList.length)} />
        <InfoCard
          title="Pilihan Ganda"
          value={String(soalList.filter((item) => item.tipe_soal === "pg").length)}
        />
        <InfoCard
          title="Essay"
          value={String(
            soalList.filter((item) => item.tipe_soal === "essay").length
          )}
        />
        <InfoCard title="Mapel" value={String(mapelList.length)} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Data Bank Soal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {paginatedData.length} dari {filteredData.length} soal
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Semua Mapel</option>
              {mapelList.map((item) => (
                <option key={item.id_mapel} value={item.id_mapel}>
                  {item.nama_mapel}
                </option>
              ))}
            </select>

            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Semua Tipe</option>
              <option value="pg">PG</option>
              <option value="essay">Essay</option>
            </select>

            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Cari soal..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">
                    <SortButton label="Pertanyaan" sort="pertanyaan" />
                  </th>
                  <th className="p-4">Mapel</th>
                  <th className="p-4">
                    <SortButton label="Tipe" sort="tipe_soal" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Level" sort="tingkat_kesulitan" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id_soal}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="p-4">
                      <p className="line-clamp-2 font-semibold text-slate-900 dark:text-white">
                        {item.pertanyaan}
                      </p>
                      {item.pembahasan && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.pembahasan}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      {item.mapel?.nama_mapel || "Tanpa Mapel"}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {item.tipe_soal.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.tingkat_kesulitan || "-"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_soal)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
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
                      Data soal tidak ditemukan.
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
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {idEdit ? "Edit Soal" : "Tambah Soal"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Soal bisa digunakan di tugas kompetensi Kajur.
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
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Mapel</label>
                  <select
                    value={idMapel}
                    onChange={(e) => setIdMapel(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                  <label className="text-sm font-medium">Tipe Soal</label>
                  <select
                    value={tipeSoal}
                    onChange={(e) => setTipeSoal(e.target.value as "pg" | "essay")}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="pg">Pilihan Ganda</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Kesulitan</label>
                  <select
                    value={tingkatKesulitan}
                    onChange={(e) => setTingkatKesulitan(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>
              </div>

              <textarea
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Tulis pertanyaan..."
              />

              <textarea
                value={pembahasan}
                onChange={(e) => setPembahasan(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Pembahasan / kunci pembahasan opsional..."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={gambarUrl}
                  onChange={(e) => setGambarUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="URL gambar opsional"
                />

                <input
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="URL audio opsional"
                />
              </div>

              {tipeSoal === "pg" && (
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
                    Opsi Jawaban
                  </h3>

                  <div className="space-y-3">
                    {opsiForm.map((opsi, index) => (
                      <div
                        key={opsi.label}
                        className="grid gap-3 md:grid-cols-[70px_1fr_1fr_120px]"
                      >
                        <div className="flex items-center font-bold">
                          {opsi.label}
                        </div>

                        <input
                          value={opsi.isi_opsi}
                          onChange={(e) =>
                            handleChangeOpsi(index, "isi_opsi", e.target.value)
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          placeholder={`Opsi ${opsi.label}`}
                        />

                        <input
                          value={opsi.gambar_url || ""}
                          onChange={(e) =>
                            handleChangeOpsi(index, "gambar_url", e.target.value)
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          placeholder="URL gambar opsi"
                        />

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            checked={opsi.is_benar}
                            onChange={() => handleBenar(index)}
                          />
                          Benar
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
                >
                  Batal
                </button>

                <button
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Save size={16} />
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

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </h2>
    </div>
  )
}