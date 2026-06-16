"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
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
  email: string
  nama_lengkap: string
  id_role: number
  aktif: boolean
  nama_role: string
  id_guru: string | null
  uid_fp: string | null
  no_hp_guru: string | null
  id_siswa: string | null
}

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  created_at: string | null
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

type Tugas = {
  id_tugas: string
  id_mengajar: string | null
  judul: string
  deskripsi: string | null
  deadline: string | null
  status: "draft" | "aktif" | "ditutup" | null
  created_at: string | null
  mengajar?: Mengajar
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

type TugasSoal = {
  id_tugas_soal: string
  id_tugas: string
  id_soal: string
  nomor: number
  bobot: number
  bank_soal?: BankSoal
}

type SortKey =
  | "judul"
  | "mapel"
  | "kelas"
  | "deadline"
  | "status"
  | "created_at"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function GuruTugasPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([])
  const [tugasSoalList, setTugasSoalList] = useState<TugasSoal[]>([])

  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [idMengajar, setIdMengajar] = useState("")
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [deadline, setDeadline] = useState("")
  const [status, setStatus] = useState<"draft" | "aktif" | "ditutup">("draft")
  const [saving, setSaving] = useState(false)

  const [modalSoalOpen, setModalSoalOpen] = useState(false)
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null)
  const [selectedSoalIds, setSelectedSoalIds] = useState<string[]>([])
  const [savingSoal, setSavingSoal] = useState(false)

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
        alert("ID guru tidak ditemukan di profile login")
        router.replace("/login")
        return
      }

      const [mengajarData, tugasData, bankSoalData, tugasSoalData] =
        await Promise.all([
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
                nama_mapel
              ),
              kelas:id_kelas (
                nama_kelas,
                tingkat,
                jurusan:id_jurusan (
                  kode_jurusan
                )
              )
            `,
            "created_at",
            false
          ),

          fetchAll(
            "tugas",
            `
              id_tugas,
              id_mengajar,
              judul,
              deskripsi,
              deadline,
              status,
              created_at,
              mengajar:id_mengajar (
                id_mengajar,
                id_guru,
                id_mapel,
                id_kelas,
                id_tahun_ajaran,
                aktif,
                created_at,
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
            "tugas_soal",
            `
              id_tugas_soal,
              id_tugas,
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

      const mengajarGuru = (mengajarData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      const mengajarIds = mengajarGuru.map((item: any) => item.id_mengajar)

      const mapelIds = [
        ...new Set(mengajarGuru.map((item: any) => item.id_mapel)),
      ]

      const tugasGuru = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const bankSoalGuru = (bankSoalData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          mapelIds.includes(item.id_mapel)
      )

      const tugasSoalGuru = (tugasSoalData || []).filter((item: any) =>
        tugasGuru.some((tugas: any) => tugas.id_tugas === item.id_tugas)
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setTugasList(tugasGuru as Tugas[])
      setBankSoalList(bankSoalGuru as BankSoal[])
      setTugasSoalList(tugasSoalGuru as TugasSoal[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data tugas")
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
    setDeskripsi("")
    setDeadline("")
    setStatus("draft")
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

  const formatDateTimeLocal = (value: string | null) => {
    if (!value) return ""

    const date = new Date(value)
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60 * 1000)

    return localDate.toISOString().slice(0, 16)
  }

  const handleEdit = (item: Tugas) => {
    setIdEdit(item.id_tugas)
    setIdMengajar(item.id_mengajar || "")
    setJudul(item.judul || "")
    setDeskripsi(item.deskripsi || "")
    setDeadline(formatDateTimeLocal(item.deadline))
    setStatus(item.status || "draft")
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.id_guru) {
      alert("ID guru tidak ditemukan")
      return
    }

    if (!idMengajar || !judul.trim()) {
      alert("Mapel/Kelas dan judul tugas wajib diisi")
      return
    }

    const mengajarDipilih = mengajarList.find(
      (item) => item.id_mengajar === idMengajar
    )

    if (!mengajarDipilih || mengajarDipilih.id_guru !== profile.id_guru) {
      alert("Pembagian mengajar tidak valid")
      return
    }

    setSaving(true)

    const payload = {
      id_mengajar: idMengajar,
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("tugas")
        .update(payload)
        .eq("id_tugas", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("tugas").insert(payload)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    }

    closeModal()
    if (profile) await getData(profile)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus tugas ini?")) return

    const { error } = await supabase.from("tugas").delete().eq("id_tugas", id)

    if (error) {
      alert(error.message)
      return
    }

    if (profile) await getData(profile)
  }

  const openKelolaSoal = (tugas: Tugas) => {
    const soalTerpilih = tugasSoalList
      .filter((item) => item.id_tugas === tugas.id_tugas)
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
      .from("tugas_soal")
      .delete()
      .eq("id_tugas", selectedTugas.id_tugas)

    if (deleteError) {
      alert(deleteError.message)
      setSavingSoal(false)
      return
    }

    const payload = selectedSoalIds.map((idSoal, index) => ({
      id_tugas: selectedTugas.id_tugas,
      id_soal: idSoal,
      nomor: index + 1,
      bobot: 1,
    }))

    if (payload.length > 0) {
      const { error } = await supabase.from("tugas_soal").insert(payload)

      if (error) {
        alert(error.message)
        setSavingSoal(false)
        return
      }
    }

    setModalSoalOpen(false)
    setSelectedTugas(null)
    setSelectedSoalIds([])

    if (profile) await getData(profile)

    setSavingSoal(false)
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

  const getSortValue = (item: Tugas, key: SortKey) => {
    if (key === "judul") return item.judul || ""
    if (key === "mapel") return item.mengajar?.mapel?.nama_mapel || ""
    if (key === "kelas") return item.mengajar?.kelas?.nama_kelas || ""
    if (key === "deadline") return item.deadline || ""
    if (key === "status") return item.status || ""
    if (key === "created_at") return item.created_at || ""
    return ""
  }

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = tugasList.filter((item) => {
      return (
        (item.judul || "").toLowerCase().includes(keyword) ||
        (item.deskripsi || "").toLowerCase().includes(keyword) ||
        (item.status || "").toLowerCase().includes(keyword) ||
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
  }, [tugasList, search, sortConfig])

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

  const getDeadlineBadge = (deadlineValue: string | null) => {
    if (!deadlineValue) {
      return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Tanpa deadline
        </span>
      )
    }

    const now = new Date()
    const deadlineDate = new Date(deadlineValue)
    const isLate = deadlineDate.getTime() < now.getTime()

    return (
      <span
        className={
          isLate
            ? "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
            : "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
        }
      >
        {deadlineDate.toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </span>
    )
  }

  const getStatusBadge = (statusValue: Tugas["status"]) => {
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

  const getJumlahSoalTugas = (idTugas: string) => {
    return tugasSoalList.filter((item) => item.id_tugas === idTugas).length
  }

  const bankSoalUntukTugas = useMemo(() => {
    if (!selectedTugas?.mengajar?.id_mapel) return []

    return bankSoalList.filter(
      (soal) => soal.id_mapel === selectedTugas.mengajar?.id_mapel
    )
  }, [bankSoalList, selectedTugas])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Tugas" role="guru" nama={profile?.nama_lengkap}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Tugas Siswa</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Buat tugas PG/essay dan pilih soal dari bank soal sesuai mapel.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white  transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Tugas
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5  dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Tugas
          </p>
          <h2 className="mt-2 text-3xl font-bold">{tugasList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Bank Soal
          </p>
          <h2 className="mt-2 text-3xl font-bold">{bankSoalList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Soal Dipakai
          </p>
          <h2 className="mt-2 text-3xl font-bold">{tugasSoalList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tugas Aktif
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            {tugasList.filter((item) => item.status === "aktif").length}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5  dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Tugas</h2>
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
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
                    <SortButton label="Deadline" sortKey="deadline" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Status" sortKey="status" />
                  </th>
                  <th className="p-4">Soal</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => (
                  <tr
                    key={item.id_tugas}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
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
                          <p className="font-medium">{item.judul}</p>
                          {item.deskripsi && (
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {item.deskripsi}
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

                    <td className="p-4">{getDeadlineBadge(item.deadline)}</td>

                    <td className="p-4">{getStatusBadge(item.status)}</td>

                    <td className="p-4">
                      <button
                        onClick={() => openKelolaSoal(item)}
                        className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
                      >
                        {getJumlahSoalTugas(item.id_tugas)} Soal
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openKelolaSoal(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                          title="Kelola Soal"
                        >
                          <ListChecks size={16} />
                        </button>

                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700 dark:text-slate-300"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_tugas)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
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
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Data tugas tidak ditemukan
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
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6  dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Tugas" : "Tambah Tugas"}
                </h2>
                <p className="text-sm text-slate-500">
                  Buat tugas berbasis soal PG/essay.
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
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Pilih mapel / kelas</option>
                    {mengajarList.map((item) => (
                      <option key={item.id_mengajar} value={item.id_mengajar}>
                        {item.mapel?.nama_mapel || "-"} -{" "}
                        {item.kelas?.nama_kelas || "-"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Judul Tugas</label>
                  <input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Contoh: Tugas Narrative Text"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Deskripsi</label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="mt-1 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Instruksi tugas..."
                  />
                </div>

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
                        className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
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
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="draft">Draft</option>
                      <option value="aktif">Aktif</option>
                      <option value="ditutup">Ditutup</option>
                    </select>
                  </div>
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

      {modalSoalOpen && selectedTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Kelola Soal Tugas</h2>
                <p className="text-sm text-slate-500">{selectedTugas.judul}</p>
              </div>

              <button
                onClick={() => setModalSoalOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Pilih soal dari bank soal sesuai mapel tugas ini.
            </div>

            <div className="space-y-3">
              {bankSoalUntukTugas.map((soal, index) => (
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

              {bankSoalUntukTugas.length === 0 && (
                <div className="rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
                  Belum ada soal untuk mapel ini di bank soal.
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