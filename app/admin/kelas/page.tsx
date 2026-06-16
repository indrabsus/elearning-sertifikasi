"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Jurusan = {
  id_jurusan: string
  kode_jurusan: string
  nama_jurusan: string
}

type TahunAjaran = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
}

type Kelas = {
  id_kelas: string
  nama_kelas: string
  tingkat: number
  aktif: boolean
  id_jurusan: string
  id_tahun_ajaran: string
  jumlah_siswa?: number
  jurusan?: Jurusan
  tahun_ajaran?: TahunAjaran
}

type Siswa = {
  id_siswa: string
  nisn: string | null
  nis: string | null
  nama_lengkap: string
  jenkel: string | null
  kelas: string | null
  aktif: boolean | null
}

type SiswaKelas = {
  id_siswa_kelas: string
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  siswa?: Siswa
  kelas?: {
    nama_kelas: string
  }
}

type SortKey = "nama_kelas" | "tahun_ajaran" | "jumlah_siswa" | "aktif"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function AdminKelasPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([])
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [namaKelas, setNamaKelas] = useState("")
  const [tingkat, setTingkat] = useState("10")
  const [idJurusan, setIdJurusan] = useState("")
  const [idTahunAjaran, setIdTahunAjaran] = useState("")
  const [aktif, setAktif] = useState(true)
  const [saving, setSaving] = useState(false)

  const [siswaModalOpen, setSiswaModalOpen] = useState(false)
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null)
  const [siswaKelasList, setSiswaKelasList] = useState<SiswaKelas[]>([])
  const [siswaList, setSiswaList] = useState<Siswa[]>([])
  const [siswaSearch, setSiswaSearch] = useState("")
  const [loadingSiswa, setLoadingSiswa] = useState(false)

  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([])
  const [bulkAdding, setBulkAdding] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nama_kelas",
    direction: "asc",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const getData = async () => {
    try {
      const kelasData = await fetchAll(
        "kelas",
        `
          *,
          jurusan:id_jurusan (
            id_jurusan,
            kode_jurusan,
            nama_jurusan
          ),
          tahun_ajaran:id_tahun_ajaran (
            id_tahun_ajaran,
            nama_tahun_ajaran,
            semester
          )
        `,
        "nama_kelas"
      )

      const siswaKelasCountData = await fetchAll(
        "siswa_kelas",
        "id_kelas, aktif"
      )

      const jumlahMap: Record<string, number> = {}

      ;(siswaKelasCountData || [])
        .filter((item: any) => item.aktif === true)
        .forEach((item: any) => {
          jumlahMap[item.id_kelas] = (jumlahMap[item.id_kelas] || 0) + 1
        })

      const kelasWithJumlah = (kelasData || []).map((item: any) => ({
        ...item,
        jumlah_siswa: jumlahMap[item.id_kelas] || 0,
      }))

      const jurusanData = await fetchAll(
        "jurusan",
        "id_jurusan, kode_jurusan, nama_jurusan, aktif",
        "kode_jurusan"
      )

      const tahunData = await fetchAll(
        "tahun_ajaran",
        "id_tahun_ajaran, nama_tahun_ajaran, semester, created_at",
        "created_at",
        false
      )

      setKelas(kelasWithJumlah as Kelas[])
      setJurusanList(
        (jurusanData || []).filter((item: any) => item.aktif) as Jurusan[]
      )
      setTahunList(tahunData as TahunAjaran[])
      setSelectedIds([])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data kelas")
    } finally {
      setLoading(false)
    }
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
    setNamaKelas("")
    setTingkat("10")
    setIdJurusan("")
    setIdTahunAjaran("")
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

  const handleEdit = (item: Kelas) => {
    setIdEdit(item.id_kelas)
    setNamaKelas(item.nama_kelas)
    setTingkat(String(item.tingkat))
    setIdJurusan(item.id_jurusan)
    setIdTahunAjaran(item.id_tahun_ajaran)
    setAktif(item.aktif)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaKelas.trim() || !tingkat || !idJurusan || !idTahunAjaran) {
      alert("Semua field wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      nama_kelas: namaKelas.trim(),
      tingkat: Number(tingkat),
      id_jurusan: idJurusan,
      id_tahun_ajaran: idTahunAjaran,
      aktif,
    }

    if (idEdit) {
      const { error } = await supabase
        .from("kelas")
        .update(payload)
        .eq("id_kelas", idEdit)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("kelas").insert(payload)

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
    if (!confirm("Yakin ingin menghapus kelas ini?")) return

    const { error } = await supabase.from("kelas").delete().eq("id_kelas", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const openSiswaModal = async (item: Kelas) => {
    setSelectedKelas(item)
    setSiswaSearch("")
    setSelectedSiswaIds([])
    setSiswaModalOpen(true)
    await getSiswaKelasData(item)
  }

  const closeSiswaModal = () => {
    setSelectedKelas(null)
    setSiswaKelasList([])
    setSiswaList([])
    setSiswaSearch("")
    setSelectedSiswaIds([])
    setSiswaModalOpen(false)
  }

  const getSiswaKelasData = async (item: Kelas) => {
    setLoadingSiswa(true)

    try {
      const siswaKelasData = await fetchAll(
        "siswa_kelas",
        `
          id_siswa_kelas,
          id_siswa,
          id_kelas,
          id_tahun_ajaran,
          aktif,
          siswa:id_siswa (
            id_siswa,
            nisn,
            nis,
            nama_lengkap,
            jenkel,
            kelas,
            aktif
          ),
          kelas:id_kelas (
            nama_kelas
          )
        `
      )

      const filteredSiswaKelas = siswaKelasData.filter(
        (sk: any) =>
          sk.id_tahun_ajaran === item.id_tahun_ajaran && sk.aktif === true
      )

      const siswaData = await fetchAll(
        "siswa",
        "id_siswa, nisn, nis, nama_lengkap, jenkel, kelas, aktif",
        "nama_lengkap"
      )

      const siswaAktif = siswaData.filter((s: any) => s.aktif === true)

      setSiswaKelasList(filteredSiswaKelas as SiswaKelas[])
      setSiswaList(siswaAktif as Siswa[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data siswa")
    } finally {
      setLoadingSiswa(false)
    }
  }

  const siswaDiKelasIni = useMemo(() => {
    if (!selectedKelas) return []

    return siswaKelasList.filter(
      (item) => item.id_kelas === selectedKelas.id_kelas
    )
  }, [siswaKelasList, selectedKelas])

  const getKelasSiswaPadaTahunIni = (idSiswa: string) => {
    return siswaKelasList.find(
      (item) =>
        item.id_siswa === idSiswa &&
        item.id_tahun_ajaran === selectedKelas?.id_tahun_ajaran &&
        item.aktif
    )
  }

  const siswaBelumAtauSudahKelas = useMemo(() => {
    const keyword = siswaSearch.toLowerCase()

    return siswaList.filter((item) => {
      return (
        item.nama_lengkap.toLowerCase().includes(keyword) ||
        (item.nis || "").toLowerCase().includes(keyword) ||
        (item.kelas || "").toLowerCase().includes(keyword)
      )
    })
  }, [siswaList, siswaSearch])

  const toggleSelectSiswa = (idSiswa: string) => {
    setSelectedSiswaIds((prev) =>
      prev.includes(idSiswa)
        ? prev.filter((id) => id !== idSiswa)
        : [...prev, idSiswa]
    )
  }

  const toggleSelectAllSiswa = () => {
    const availableIds = siswaBelumAtauSudahKelas
      .filter((siswa) => !getKelasSiswaPadaTahunIni(siswa.id_siswa))
      .map((siswa) => siswa.id_siswa)

    const allSelected =
      availableIds.length > 0 &&
      availableIds.every((id) => selectedSiswaIds.includes(id))

    if (allSelected) {
      setSelectedSiswaIds((prev) =>
        prev.filter((id) => !availableIds.includes(id))
      )
    } else {
      setSelectedSiswaIds((prev) =>
        Array.from(new Set([...prev, ...availableIds]))
      )
    }
  }

  const tambahSiswaTerpilihKeKelas = async () => {
  if (!selectedKelas) return

  if (selectedSiswaIds.length === 0) {
    alert("Pilih siswa terlebih dahulu")
    return
  }

  setBulkAdding(true)

  const payload = selectedSiswaIds.map((idSiswa) => ({
    id_siswa: idSiswa,
    id_kelas: selectedKelas.id_kelas,
    id_tahun_ajaran: selectedKelas.id_tahun_ajaran,
    aktif: true,
  }))

  const { error } = await supabase.from("siswa_kelas").upsert(payload, {
    onConflict: "id_siswa,id_tahun_ajaran",
  })

  if (error) {
    alert(error.message)
    setBulkAdding(false)
    return
  }

  setSelectedSiswaIds([])
  await getSiswaKelasData(selectedKelas)
  await getData()
  setBulkAdding(false)
}

  const keluarkanSiswaDariKelas = async (item: SiswaKelas) => {
    if (!selectedKelas) return
    if (!confirm("Keluarkan siswa dari kelas ini?")) return

    const { error } = await supabase
      .from("siswa_kelas")
      .update({ aktif: false })
      .eq("id_siswa_kelas", item.id_siswa_kelas)

    if (error) {
      alert(error.message)
      return
    }

    await getSiswaKelasData(selectedKelas)
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

  const getSortValue = (item: Kelas, key: SortKey) => {
    if (key === "tahun_ajaran") {
      return item.tahun_ajaran
        ? `${item.tahun_ajaran.nama_tahun_ajaran} ${item.tahun_ajaran.semester}`
        : ""
    }

    if (key === "jumlah_siswa") return item.jumlah_siswa || 0
    if (key === "aktif") return item.aktif ? 1 : 0

    return item[key]
  }

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = kelas.filter((item) => {
      return (
        item.nama_kelas.toLowerCase().includes(keyword) ||
        (item.tahun_ajaran?.nama_tahun_ajaran || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.tahun_ajaran?.semester || "").toLowerCase().includes(keyword) ||
        String(item.jumlah_siswa || 0).includes(keyword)
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
  }, [kelas, search, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAllPage = () => {
    const pageIds = paginatedData.map((item) => item.id_kelas)
    const allSelected = pageIds.every((id) => selectedIds.includes(id))

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    if (!confirm(`Yakin ingin menghapus ${selectedIds.length} kelas terpilih?`)) {
      return
    }

    const { error } = await supabase
      .from("kelas")
      .delete()
      .in("id_kelas", selectedIds)

    if (error) {
      alert(error.message)
      return
    }

    setSelectedIds([])
    await getData()
  }

  const handleBulkStatus = async (status: boolean) => {
    if (selectedIds.length === 0) return

    const label = status ? "aktif" : "nonaktif"

    if (
      !confirm(
        `Yakin ingin mengubah ${selectedIds.length} kelas menjadi ${label}?`
      )
    ) {
      return
    }

    const { error } = await supabase
      .from("kelas")
      .update({ aktif: status })
      .in("id_kelas", selectedIds)

    if (error) {
      alert(error.message)
      return
    }

    setSelectedIds([])
    await getData()
  }

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
    <DashboardLayout title="Kelola Kelas" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Kelas</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tambah, edit, hapus, lihat siswa, dan pindahkan siswa ke kelas.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Kelas
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Data Kelas</h2>
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
              placeholder="Cari kelas..."
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40 md:flex-row md:items-center">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.length} kelas dipilih
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkStatus(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
              >
                <CheckCircle2 size={16} />
                Jadikan Aktif
              </button>

              <button
                onClick={() => handleBulkStatus(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700"
              >
                <X size={16} />
                Jadikan Nonaktif
              </button>

              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
              >
                <Trash2 size={16} />
                Hapus Terpilih
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">
                    <input
                      type="checkbox"
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((item) =>
                          selectedIds.includes(item.id_kelas)
                        )
                      }
                      onChange={toggleSelectAllPage}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </th>

                  <th className="p-4">
                    <SortButton label="Kelas" sortKey="nama_kelas" />
                  </th>

                  <th className="p-4">
                    <SortButton label="Tahun Ajaran" sortKey="tahun_ajaran" />
                  </th>

                  <th className="p-4">
                    <SortButton label="Jumlah Siswa" sortKey="jumlah_siswa" />
                  </th>

                  <th className="p-4">
                    <SortButton label="Status" sortKey="aktif" />
                  </th>

                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item) => (
                  <tr
                    key={item.id_kelas}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id_kelas)}
                        onChange={() => toggleSelect(item.id_kelas)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>

                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                      {item.nama_kelas}
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.tahun_ajaran
                        ? `${item.tahun_ajaran.nama_tahun_ajaran} - ${item.tahun_ajaran.semester}`
                        : "-"}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <Users size={14} />
                        {item.jumlah_siswa || 0} siswa
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
                          onClick={() => openSiswaModal(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                          title="Lihat siswa"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-yellow-50 hover:text-yellow-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-yellow-950 dark:hover:text-yellow-300"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id_kelas)}
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
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data kelas tidak ditemukan
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
                  {idEdit ? "Edit Kelas" : "Tambah Kelas"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Lengkapi data kelas, jurusan, dan tahun ajaran.
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
                  <label className="text-sm font-medium">Nama Kelas</label>
                  <input
                    value={namaKelas}
                    onChange={(e) => setNamaKelas(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="X PPLG 1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tingkat</label>
                  <select
                    value={tingkat}
                    onChange={(e) => setTingkat(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Jurusan</label>
                  <select
                    value={idJurusan}
                    onChange={(e) => setIdJurusan(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Pilih jurusan</option>
                    {jurusanList.map((item) => (
                      <option key={item.id_jurusan} value={item.id_jurusan}>
                        {item.kode_jurusan} - {item.nama_jurusan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Tahun Ajaran</label>
                  <select
                    value={idTahunAjaran}
                    onChange={(e) => setIdTahunAjaran(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Pilih tahun ajaran</option>
                    {tahunList.map((item) => (
                      <option
                        key={item.id_tahun_ajaran}
                        value={item.id_tahun_ajaran}
                      >
                        {item.nama_tahun_ajaran} - {item.semester}
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

      {siswaModalOpen && selectedKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Siswa Kelas {selectedKelas.nama_kelas}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedKelas.tahun_ajaran
                    ? `${selectedKelas.tahun_ajaran.nama_tahun_ajaran} - ${selectedKelas.tahun_ajaran.semester}`
                    : "Tahun ajaran tidak tersedia"}
                </p>
              </div>

              <button
                onClick={closeSiswaModal}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {loadingSiswa ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500" />
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2">
                <div className="min-h-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Siswa di Kelas Ini</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total {siswaDiKelasIni.length} siswa
                      </p>
                    </div>

                    <Users size={20} className="text-blue-600" />
                  </div>

                  <div className="max-h-[55vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                          <th className="px-4 py-3">No</th>
                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Kelas Dapodik</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {siswaDiKelasIni.map((item, index) => (
                          <tr key={item.id_siswa_kelas}>
                            <td className="px-4 py-3 text-slate-500">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3 font-medium">
                              {item.siswa?.nama_lengkap || "-"}
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                {item.siswa?.kelas || "-"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => keluarkanSiswaDariKelas(item)}
                                className="rounded-xl border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                              >
                                Keluarkan
                              </button>
                            </td>
                          </tr>
                        ))}

                        {siswaDiKelasIni.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-8 text-center text-slate-500"
                            >
                              Belum ada siswa di kelas ini
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-h-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <h3 className="font-semibold">Tambah Siswa ke Kelas</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Pilih beberapa siswa, lalu klik tombol tambah.
                      </p>
                    </div>

                    <button
                      onClick={tambahSiswaTerpilihKeKelas}
                      disabled={selectedSiswaIds.length === 0 || bulkAdding}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserPlus size={16} />
                      {bulkAdding
                        ? "Menambahkan..."
                        : `Tambah Terpilih (${selectedSiswaIds.length})`}
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={siswaSearch}
                      onChange={(e) => setSiswaSearch(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Cari nama / NIS / kelas dapodik..."
                    />
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                          <th className="w-12 px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={
                                siswaBelumAtauSudahKelas.filter(
                                  (siswa) =>
                                    !getKelasSiswaPadaTahunIni(siswa.id_siswa)
                                ).length > 0 &&
                                siswaBelumAtauSudahKelas
                                  .filter(
                                    (siswa) =>
                                      !getKelasSiswaPadaTahunIni(
                                        siswa.id_siswa
                                      )
                                  )
                                  .every((siswa) =>
                                    selectedSiswaIds.includes(siswa.id_siswa)
                                  )
                              }
                              onChange={toggleSelectAllSiswa}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </th>

                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Kelas Dapodik</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {siswaBelumAtauSudahKelas.map((siswa) => {
                          const kelasExisting =
                            getKelasSiswaPadaTahunIni(siswa.id_siswa)
                          const disabled = !!kelasExisting

                          return (
                            <tr
                              key={siswa.id_siswa}
                              className={
                                disabled
                                  ? "opacity-50"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                              }
                            >
                              <td className="w-12 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  disabled={disabled}
                                  checked={selectedSiswaIds.includes(
                                    siswa.id_siswa
                                  )}
                                  onChange={() =>
                                    toggleSelectSiswa(siswa.id_siswa)
                                  }
                                  className="h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed"
                                />
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {siswa.nama_lengkap}
                              </td>

                              <td className="px-4 py-3">
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  {siswa.kelas || "-"}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {kelasExisting ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    Sudah di{" "}
                                    {kelasExisting.kelas?.nama_kelas ||
                                      "kelas lain"}
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
                                    Belum ada kelas
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}

                        {siswaBelumAtauSudahKelas.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-8 text-center text-slate-500"
                            >
                              Data siswa tidak ditemukan
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}