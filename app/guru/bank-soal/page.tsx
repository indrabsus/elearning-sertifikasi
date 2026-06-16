"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
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

type OpsiJawaban = {
  id_opsi?: string
  id_soal?: string
  label: "A" | "B" | "C" | "D" | "E"
  isi_opsi: string
  is_benar: boolean
  gambar_url?: string | null
}

type Soal = {
  id_soal: string
  id_guru: string | null
  id_mapel: string | null
  tipe_soal: "pg" | "essay"
  pertanyaan: string
  pembahasan: string | null
  tingkat_kesulitan: "mudah" | "sedang" | "sulit" | null
  gambar_url: string | null
  audio_url: string | null
  created_at: string | null
  mapel?: Mapel
  opsi_jawaban?: OpsiJawaban[]
}

type SortKey = "pertanyaan" | "mapel" | "tipe_soal" | "tingkat_kesulitan" | "created_at"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

type AiSoal = {
  pertanyaan: string
  opsi: OpsiJawaban[]
  pembahasan: string
}

const ITEMS_PER_PAGE = 10

const opsiDefault: OpsiJawaban[] = [
  { label: "A", isi_opsi: "", is_benar: false },
  { label: "B", isi_opsi: "", is_benar: false },
  { label: "C", isi_opsi: "", is_benar: false },
  { label: "D", isi_opsi: "", is_benar: false },
  { label: "E", isi_opsi: "", is_benar: false },
]

export default function GuruBankSoalPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mapelList, setMapelList] = useState<Mapel[]>([])
  const [soalList, setSoalList] = useState<Soal[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [idMapel, setIdMapel] = useState("")
  const [tipeSoal, setTipeSoal] = useState<"pg" | "essay">("pg")
  const [pertanyaan, setPertanyaan] = useState("")
  const [pembahasan, setPembahasan] = useState("")
  const [tingkatKesulitan, setTingkatKesulitan] =
    useState<"mudah" | "sedang" | "sulit">("sedang")
  const [gambarUrl, setGambarUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [opsi, setOpsi] = useState<OpsiJawaban[]>(opsiDefault)
  const [saving, setSaving] = useState(false)

  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiMapel, setAiMapel] = useState("")
  const [aiTipeSoal, setAiTipeSoal] = useState<"pg" | "essay">("pg")
  const [aiMateri, setAiMateri] = useState("")
  const [aiJumlah, setAiJumlah] = useState(5)
  const [aiTingkat, setAiTingkat] =
    useState<"mudah" | "sedang" | "sulit">("sedang")
  const [aiResult, setAiResult] = useState<AiSoal[]>([])
  const [aiGenerating, setAiGenerating] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
  })

  const [currentPage, setCurrentPage] = useState(1)

  const getData = async (userProfile: Profile) => {
    try {
      if (!userProfile.id_guru) {
        router.replace("/guru/verifikasi-mengajar")
        return
      }

      const [mapelData, soalData] = await Promise.all([
        fetchAll("mapel", "id_mapel, nama_mapel", "nama_mapel"),
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
            gambar_url,
            audio_url,
            created_at,
            mapel:id_mapel (
              id_mapel,
              nama_mapel
            ),
            opsi_jawaban (
              id_opsi,
              id_soal,
              label,
              isi_opsi,
              is_benar,
              gambar_url
            )
          `,
          "created_at",
          false
        ),
      ])

      const soalGuru = (soalData || []).filter(
        (item: any) => item.id_guru === userProfile.id_guru
      )

      setMapelList((mapelData || []) as Mapel[])
      setSoalList(soalGuru as Soal[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data bank soal")
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
    setTipeSoal("pg")
    setPertanyaan("")
    setPembahasan("")
    setTingkatKesulitan("sedang")
    setGambarUrl("")
    setAudioUrl("")
    setOpsi(opsiDefault.map((item) => ({ ...item })))
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

  const handleEdit = (item: Soal) => {
    const opsiSorted = [...(item.opsi_jawaban || [])].sort((a, b) =>
      a.label.localeCompare(b.label)
    )

    setIdEdit(item.id_soal)
    setIdMapel(item.id_mapel || "")
    setTipeSoal(item.tipe_soal || "pg")
    setPertanyaan(item.pertanyaan || "")
    setPembahasan(item.pembahasan || "")
    setTingkatKesulitan(item.tingkat_kesulitan || "sedang")
    setGambarUrl(item.gambar_url || "")
    setAudioUrl(item.audio_url || "")
    setOpsi(
      opsiSorted.length > 0
        ? opsiSorted.map((op) => ({
            label: op.label,
            isi_opsi: op.isi_opsi || "",
            is_benar: op.is_benar || false,
            gambar_url: op.gambar_url || null,
          }))
        : opsiDefault.map((op) => ({ ...op }))
    )
    setModalOpen(true)
  }

  const updateOpsi = (
    label: "A" | "B" | "C" | "D" | "E",
    field: "isi_opsi" | "is_benar",
    value: string | boolean
  ) => {
    setOpsi((prev) =>
      prev.map((item) => {
        if (field === "is_benar") {
          return {
            ...item,
            is_benar: item.label === label ? Boolean(value) : false,
          }
        }

        if (item.label === label) {
          return {
            ...item,
            isi_opsi: String(value),
          }
        }

        return item
      })
    )
  }

  const simpanOpsi = async (idSoal: string, opsiData: OpsiJawaban[]) => {
    await supabase.from("opsi_jawaban").delete().eq("id_soal", idSoal)

    const payload = opsiData
      .filter((item) => item.isi_opsi.trim())
      .map((item) => ({
        id_soal: idSoal,
        label: item.label,
        isi_opsi: item.isi_opsi.trim(),
        is_benar: item.is_benar,
        gambar_url: item.gambar_url || null,
      }))

    if (payload.length > 0) {
      const { error } = await supabase.from("opsi_jawaban").insert(payload)
      if (error) throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.id_guru) {
      alert("ID guru tidak ditemukan")
      return
    }

    if (!idMapel || !pertanyaan.trim()) {
      alert("Mapel dan pertanyaan wajib diisi")
      return
    }

    if (tipeSoal === "pg") {
      const opsiTerisi = opsi.filter((item) => item.isi_opsi.trim())
      const adaBenar = opsi.some((item) => item.is_benar)

      if (opsiTerisi.length < 2) {
        alert("Minimal isi 2 opsi jawaban")
        return
      }

      if (!adaBenar) {
        alert("Pilih 1 jawaban benar")
        return
      }
    }

    setSaving(true)

    try {
      const payload = {
        id_guru: profile.id_guru,
        id_mapel: idMapel,
        tipe_soal: tipeSoal,
        pertanyaan: pertanyaan.trim(),
        pembahasan: pembahasan.trim() || null,
        tingkat_kesulitan: tingkatKesulitan,
        gambar_url: gambarUrl.trim() || null,
        audio_url: audioUrl.trim() || null,
      }

      let idSoal = idEdit

      if (idEdit) {
        const { error } = await supabase
          .from("bank_soal")
          .update(payload)
          .eq("id_soal", idEdit)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("bank_soal")
          .insert(payload)
          .select("id_soal")
          .single()

        if (error) throw error
        idSoal = data.id_soal
      }

      if (idSoal) {
        if (tipeSoal === "pg") {
          await simpanOpsi(idSoal, opsi)
        } else {
          await supabase.from("opsi_jawaban").delete().eq("id_soal", idSoal)
        }
      }

      closeModal()
      await getData(profile)
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan soal")
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return

    const { error } = await supabase.from("bank_soal").delete().eq("id_soal", id)

    if (error) {
      alert(error.message)
      return
    }

    if (profile) await getData(profile)
  }

  const handleGenerateAi = async () => {
    if (!aiMapel || !aiMateri.trim()) {
      alert("Pilih mapel dan isi materi/topik dulu")
      return
    }

    const mapel = mapelList.find((item) => item.id_mapel === aiMapel)

    setAiGenerating(true)
    setAiResult([])

    try {
      const res = await fetch("/api/ai/buat-soal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipe_soal: aiTipeSoal,
          materi: aiMateri,
          jumlah: aiJumlah,
          tingkat_kesulitan: aiTingkat,
          mapel: mapel?.nama_mapel || "",
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json.message || "Gagal membuat soal AI")
        return
      }

      setAiResult(json.soal || [])
    } catch (err: any) {
      alert(err.message || "Gagal membuat soal AI")
    } finally {
      setAiGenerating(false)
    }
  }

  const simpanAiKeBankSoal = async () => {
    if (!profile?.id_guru) {
      alert("ID guru tidak ditemukan")
      return
    }

    if (!aiMapel || aiResult.length === 0) {
      alert("Belum ada soal AI")
      return
    }

    try {
      for (const item of aiResult) {
        const { data: soalBaru, error: soalError } = await supabase
          .from("bank_soal")
          .insert({
            id_guru: profile.id_guru,
            id_mapel: aiMapel,
            tipe_soal: aiTipeSoal,
            pertanyaan: item.pertanyaan,
            pembahasan: item.pembahasan || null,
            tingkat_kesulitan: aiTingkat,
          })
          .select("id_soal")
          .single()

        if (soalError) throw soalError

        if (aiTipeSoal === "pg" && item.opsi?.length > 0) {
          const opsiPayload = item.opsi.map((op) => ({
            id_soal: soalBaru.id_soal,
            label: op.label,
            isi_opsi: op.isi_opsi,
            is_benar: op.is_benar,
          }))

          const { error: opsiError } = await supabase
            .from("opsi_jawaban")
            .insert(opsiPayload)

          if (opsiError) throw opsiError
        }
      }

      setAiResult([])
      setAiMateri("")
      setAiModalOpen(false)
      await getData(profile)
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan soal AI")
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

  const getSortValue = (item: Soal, key: SortKey) => {
    if (key === "pertanyaan") return item.pertanyaan || ""
    if (key === "mapel") return item.mapel?.nama_mapel || ""
    if (key === "tipe_soal") return item.tipe_soal || ""
    if (key === "tingkat_kesulitan") return item.tingkat_kesulitan || ""
    if (key === "created_at") return item.created_at || ""
    return ""
  }

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = soalList.filter((item) => {
      return (
        (item.pertanyaan || "").toLowerCase().includes(keyword) ||
        (item.mapel?.nama_mapel || "").toLowerCase().includes(keyword) ||
        (item.tipe_soal || "").toLowerCase().includes(keyword) ||
        (item.tingkat_kesulitan || "").toLowerCase().includes(keyword)
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
  }, [soalList, search, sortConfig])

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
    <DashboardLayout title="Bank Soal" role="guru" nama={profile?.nama_lengkap}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Bank Soal</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Soal disimpan berdasarkan guru dan mapel, sehingga bisa dipakai
            ulang ke berbagai tugas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700"
          >
            <Sparkles size={18} />
            Buat dari AI
          </button>

          <button
            onClick={openTambahModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Soal
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Soal</p>
          <h2 className="mt-2 text-3xl font-bold">{soalList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Pilihan Ganda</p>
          <h2 className="mt-2 text-3xl font-bold">
            {soalList.filter((item) => item.tipe_soal === "pg").length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Essay</p>
          <h2 className="mt-2 text-3xl font-bold">
            {soalList.filter((item) => item.tipe_soal === "essay").length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Mapel</p>
          <h2 className="mt-2 text-3xl font-bold">{mapelList.length}</h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Bank Soal</h2>
            <p className="text-sm text-slate-500">
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Cari soal / mapel..."
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
                    <SortButton label="Pertanyaan" sortKey="pertanyaan" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Mapel" sortKey="mapel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Tipe" sortKey="tipe_soal" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kesulitan" sortKey="tingkat_kesulitan" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => {
                  const jawabanBenar = item.opsi_jawaban?.find(
                    (op) => op.is_benar
                  )

                  return (
                    <tr
                      key={item.id_soal}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                    >
                      <td className="p-4 text-slate-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="p-4">
                        <p className="line-clamp-2 font-medium">
                          {item.pertanyaan}
                        </p>

                        {item.tipe_soal === "pg" && (
                          <p className="mt-1 text-xs text-slate-500">
                            Jawaban: {jawabanBenar?.label || "-"}
                          </p>
                        )}
                      </td>

                      <td className="p-4">{item.mapel?.nama_mapel || "-"}</td>

                      <td className="p-4 uppercase">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {item.tipe_soal}
                        </span>
                      </td>

                      <td className="p-4 capitalize">
                        {item.tingkat_kesulitan || "-"}
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id_soal)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-slate-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Data soal tidak ditemukan
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Soal" : "Tambah Soal"}
                </h2>
                <p className="text-sm text-slate-500">
                  Soal disimpan ke bank soal guru dan mapel.
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
                <select
                  value={idMapel}
                  onChange={(e) => setIdMapel(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Pilih mapel</option>
                  {mapelList.map((item) => (
                    <option key={item.id_mapel} value={item.id_mapel}>
                      {item.nama_mapel}
                    </option>
                  ))}
                </select>

                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    value={tipeSoal}
                    onChange={(e) =>
                      setTipeSoal(e.target.value as "pg" | "essay")
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="pg">Pilihan Ganda</option>
                    <option value="essay">Essay</option>
                  </select>

                  <select
                    value={tingkatKesulitan}
                    onChange={(e) =>
                      setTingkatKesulitan(
                        e.target.value as "mudah" | "sedang" | "sulit"
                      )
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                  </select>
                </div>

                <textarea
                  value={pertanyaan}
                  onChange={(e) => setPertanyaan(e.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Tulis pertanyaan..."
                />

                {tipeSoal === "pg" && (
                  <div className="space-y-3">
                    {opsi.map((item) => (
                      <div
                        key={item.label}
                        className="grid gap-3 md:grid-cols-[60px_1fr_110px]"
                      >
                        <div className="flex items-center font-semibold">
                          {item.label}.
                        </div>

                        <input
                          value={item.isi_opsi}
                          onChange={(e) =>
                            updateOpsi(item.label, "isi_opsi", e.target.value)
                          }
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                          placeholder={`Opsi ${item.label}`}
                        />

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            checked={item.is_benar}
                            onChange={() =>
                              updateOpsi(item.label, "is_benar", true)
                            }
                          />
                          Benar
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  value={pembahasan}
                  onChange={(e) => setPembahasan(e.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder={
                    tipeSoal === "essay"
                      ? "Rubrik / jawaban ideal..."
                      : "Pembahasan..."
                  }
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={gambarUrl}
                    onChange={(e) => setGambarUrl(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Gambar URL opsional"
                  />

                  <input
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Audio URL opsional"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
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
                  {saving ? "Menyimpan..." : idEdit ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Buat Soal dari AI</h2>
                <p className="text-sm text-slate-500">
                  Menggunakan qwen2.5:7b dari server sekolah.
                </p>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <select
                value={aiMapel}
                onChange={(e) => setAiMapel(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Pilih mapel</option>
                {mapelList.map((item) => (
                  <option key={item.id_mapel} value={item.id_mapel}>
                    {item.nama_mapel}
                  </option>
                ))}
              </select>

              <div className="grid gap-4 md:grid-cols-3">
                <select
                  value={aiTipeSoal}
                  onChange={(e) =>
                    setAiTipeSoal(e.target.value as "pg" | "essay")
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="pg">Pilihan Ganda</option>
                  <option value="essay">Essay</option>
                </select>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiJumlah}
                  onChange={(e) => setAiJumlah(Number(e.target.value))}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                />

                <select
                  value={aiTingkat}
                  onChange={(e) =>
                    setAiTingkat(
                      e.target.value as "mudah" | "sedang" | "sulit"
                    )
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="mudah">Mudah</option>
                  <option value="sedang">Sedang</option>
                  <option value="sulit">Sulit</option>
                </select>
              </div>

              <textarea
                value={aiMateri}
                onChange={(e) => setAiMateri(e.target.value)}
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Masukkan materi/topik soal..."
              />

              <button
                onClick={handleGenerateAi}
                disabled={aiGenerating}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {aiGenerating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Bot size={18} />
                )}
                {aiGenerating ? "Membuat soal..." : "Generate Soal"}
              </button>

              {aiResult.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Preview Soal AI</h3>

                  {aiResult.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <p className="font-medium">
                        {index + 1}. {item.pertanyaan}
                      </p>

                      {aiTipeSoal === "pg" && (
                        <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                          {item.opsi?.map((op) => (
                            <p key={op.label}>
                              {op.label}. {op.isi_opsi}{" "}
                              {op.is_benar ? "(Benar)" : ""}
                            </p>
                          ))}
                        </div>
                      )}

                      {item.pembahasan && (
                        <p className="mt-2 text-sm text-slate-500">
                          Pembahasan: {item.pembahasan}
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={simpanAiKeBankSoal}
                    className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Simpan Semua ke Bank Soal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}