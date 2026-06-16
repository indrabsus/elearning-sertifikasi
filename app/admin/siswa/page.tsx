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
  User,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Kelas = {
  id_kelas: string
  nama_kelas: string
  tingkat: number
  id_tahun_ajaran: string
  aktif?: boolean
  tahun_ajaran?: {
    nama_tahun_ajaran: string
    semester: string
    aktif: boolean
  }
  jurusan?: {
    kode_jurusan: string
  }
}

type Siswa = {
  id_siswa: string
  nisn: string | null
  nis: string | null
  nama_lengkap: string
  jenkel: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  agama: string | null
  kelas: string | null
  aktif: boolean | null
  siswa_kelas?: {
    id_siswa_kelas: string
    id_kelas: string
    id_tahun_ajaran: string
    aktif: boolean
    kelas?: Kelas
  }[]
}

type SortKey =
  | "nisn"
  | "nis"
  | "nama_lengkap"
  | "jenkel"
  | "agama"
  | "kelas_dapodik"
  | "kelas_aktif"
  | "aktif"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function AdminSiswaPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [siswa, setSiswa] = useState<Siswa[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [idEdit, setIdEdit] = useState<string | null>(null)
  const [nisn, setNisn] = useState("")
  const [nis, setNis] = useState("")
  const [namaLengkap, setNamaLengkap] = useState("")
  const [jenkel, setJenkel] = useState("")
  const [tempatLahir, setTempatLahir] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [agama, setAgama] = useState("")
  const [kelasDapodik, setKelasDapodik] = useState("")
  const [idKelas, setIdKelas] = useState("")
  const [aktif, setAktif] = useState(true)
  const [saving, setSaving] = useState(false)

  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nama_lengkap",
    direction: "asc",
  })
  const [currentPage, setCurrentPage] = useState(1)

  const getData = async () => {
    try {
      const siswaData = await fetchAll(
        "siswa",
        `
          *,
          siswa_kelas (
            id_siswa_kelas,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            kelas:id_kelas (
              id_kelas,
              nama_kelas,
              tingkat,
              id_tahun_ajaran,
              aktif,
              tahun_ajaran:id_tahun_ajaran (
                nama_tahun_ajaran,
                semester,
                aktif
              ),
              jurusan:id_jurusan (
                kode_jurusan
              )
            )
          )
        `,
        "nama_lengkap"
      )

      const kelasData = await fetchAll(
        "kelas",
        `
          id_kelas,
          nama_kelas,
          tingkat,
          id_tahun_ajaran,
          aktif,
          tahun_ajaran:id_tahun_ajaran (
            nama_tahun_ajaran,
            semester,
            aktif
          ),
          jurusan:id_jurusan (
            kode_jurusan
          )
        `,
        "nama_kelas"
      )

      setSiswa((siswaData || []) as Siswa[])
      setKelasList(
        (kelasData || []).filter((item: any) => item.aktif === true) as Kelas[]
      )
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data siswa")
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

  const getAktifKelas = (item: Siswa) => {
    return item.siswa_kelas?.find((sk) => sk.aktif) || null
  }

  const resetForm = () => {
    setIdEdit(null)
    setNisn("")
    setNis("")
    setNamaLengkap("")
    setJenkel("")
    setTempatLahir("")
    setTanggalLahir("")
    setAgama("")
    setKelasDapodik("")
    setIdKelas("")
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

  const handleEdit = (item: Siswa) => {
    const kelasAktif = getAktifKelas(item)

    setIdEdit(item.id_siswa)
    setNisn(item.nisn || "")
    setNis(item.nis || "")
    setNamaLengkap(item.nama_lengkap)
    setJenkel(item.jenkel || "")
    setTempatLahir(item.tempat_lahir || "")
    setTanggalLahir(item.tanggal_lahir || "")
    setAgama(item.agama || "")
    setKelasDapodik(item.kelas || "")
    setIdKelas(kelasAktif?.id_kelas || "")
    setAktif(item.aktif ?? true)
    setModalOpen(true)
  }

  const simpanSiswaKelas = async (idSiswa: string, selectedIdKelas: string) => {
    if (!selectedIdKelas) return

    const kelasDipilih = kelasList.find(
      (item) => item.id_kelas === selectedIdKelas
    )

    if (!kelasDipilih?.id_tahun_ajaran) return

    await supabase
      .from("siswa_kelas")
      .update({ aktif: false })
      .eq("id_siswa", idSiswa)
      .eq("id_tahun_ajaran", kelasDipilih.id_tahun_ajaran)

    const { error } = await supabase.from("siswa_kelas").upsert(
      {
        id_siswa: idSiswa,
        id_kelas: selectedIdKelas,
        id_tahun_ajaran: kelasDipilih.id_tahun_ajaran,
        aktif: true,
      },
      {
        onConflict: "id_siswa,id_tahun_ajaran",
      }
    )

    if (error) throw error
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaLengkap.trim()) {
      alert("Nama lengkap wajib diisi")
      return
    }

    setSaving(true)

    const payload = {
      nisn: nisn.trim() || null,
      nis: nis.trim() || null,
      nama_lengkap: namaLengkap.trim(),
      jenkel: jenkel || null,
      tempat_lahir: tempatLahir.trim() || null,
      tanggal_lahir: tanggalLahir || null,
      agama: agama.trim() || null,
      kelas: kelasDapodik.trim() || null,
      aktif,
    }

    try {
      let idSiswa = idEdit

      if (idEdit) {
        const { error } = await supabase
          .from("siswa")
          .update(payload)
          .eq("id_siswa", idEdit)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("siswa")
          .insert(payload)
          .select("id_siswa")
          .single()

        if (error) throw error
        idSiswa = data.id_siswa
      }

      if (idSiswa && idKelas) {
        await simpanSiswaKelas(idSiswa, idKelas)
      }

      closeModal()
      await getData()
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data siswa")
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return

    const { error } = await supabase.from("siswa").delete().eq("id_siswa", id)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const downloadTemplate = () => {
    const csv = `nisn,nis,nama_lengkap,jenkel,tempat_lahir,tanggal_lahir,agama,kelas
1234567890,2026001,Andi Saputra,L,Cimahi,2010-01-15,Islam,X PPLG 1
1234567891,2026002,Siti Aminah,P,Bandung,2010-03-20,Islam,X AKL 1`

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "template_siswa.csv"
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

          let sukses = 0
          let gagal = 0

          for (const row of rows) {
            const nama_lengkap = row.nama_lengkap?.toString().trim()

            if (!nama_lengkap) {
              gagal++
              continue
            }

            const kelasPatokan =
              row.kelas?.toString().trim() ||
              row.nama_kelas?.toString().trim() ||
              ""

            const payload = {
              nisn: row.nisn?.toString().trim() || null,
              nis: row.nis?.toString().trim() || null,
              nama_lengkap,
              jenkel: row.jenkel?.toString().trim() || null,
              tempat_lahir: row.tempat_lahir?.toString().trim() || null,
              tanggal_lahir: row.tanggal_lahir?.toString().trim() || null,
              agama: row.agama?.toString().trim() || null,
              kelas: kelasPatokan || null,
              aktif: true,
            }

            const { data: siswaBaru, error: siswaError } = await supabase
              .from("siswa")
              .upsert(payload, {
                onConflict: "nisn",
              })
              .select("id_siswa")
              .single()

            if (siswaError || !siswaBaru) {
              gagal++
              continue
            }

            sukses++
          }

          alert(`Import selesai. Berhasil: ${sukses}, gagal: ${gagal}`)
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

  const getSortValue = (item: Siswa, key: SortKey) => {
    if (key === "kelas_aktif") return getAktifKelas(item)?.kelas?.nama_kelas || ""
    if (key === "kelas_dapodik") return item.kelas || ""
    if (key === "aktif") return item.aktif ? 1 : 0
    return item[key] || ""
  }

  const filteredAndSortedSiswa = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = siswa.filter((item) => {
      const kelasAktif = getAktifKelas(item)

      return (
        item.nama_lengkap.toLowerCase().includes(keyword) ||
        (item.nisn || "").toLowerCase().includes(keyword) ||
        (item.nis || "").toLowerCase().includes(keyword) ||
        (item.jenkel || "").toLowerCase().includes(keyword) ||
        (item.agama || "").toLowerCase().includes(keyword) ||
        (item.kelas || "").toLowerCase().includes(keyword) ||
        (kelasAktif?.kelas?.nama_kelas || "").toLowerCase().includes(keyword) ||
        (kelasAktif?.kelas?.jurusan?.kode_jurusan || "")
          .toLowerCase()
          .includes(keyword)
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
  }, [siswa, search, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedSiswa.length / ITEMS_PER_PAGE)

  const paginatedSiswa = filteredAndSortedSiswa.slice(
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
    <DashboardLayout title="Kelola Siswa" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Kelola Siswa</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Import data Dapodik, simpan kelas patokan, dan atur kelas aktif via
            siswa_kelas.
          </p>
        </div>

        <button
          onClick={openTambahModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Siswa
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Import Siswa dari CSV</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Format kolom: nisn, nis, nama_lengkap, jenkel, tempat_lahir,
              tanggal_lahir, agama, kelas
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
            <h2 className="font-semibold">Data Siswa</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {paginatedSiswa.length} dari{" "}
              {filteredAndSortedSiswa.length} data
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
              placeholder="Cari siswa..."
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
                    <SortButton label="NISN" sortKey="nisn" />
                  </th>
                  <th className="p-4">
                    <SortButton label="NIS" sortKey="nis" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Nama" sortKey="nama_lengkap" />
                  </th>
                  <th className="p-4">
                    <SortButton label="JK" sortKey="jenkel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Agama" sortKey="agama" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kelas Dapodik" sortKey="kelas_dapodik" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kelas Aktif" sortKey="kelas_aktif" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Status" sortKey="aktif" />
                  </th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedSiswa.map((item, index) => {
                  const kelasAktif = getAktifKelas(item)

                  return (
                    <tr
                      key={item.id_siswa}
                      className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                    >
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="p-4">{item.nisn || "-"}</td>
                      <td className="p-4">{item.nis || "-"}</td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                            <User size={18} />
                          </div>

                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {item.nama_lengkap}
                          </p>
                        </div>
                      </td>

                      <td className="p-4">{item.jenkel || "-"}</td>
                      <td className="p-4">{item.agama || "-"}</td>

                      <td className="p-4">
                        {item.kelas ? (
                          <span className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            {item.kelas}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-4">
                        {kelasAktif?.kelas ? (
                          <span className="rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                            {kelasAktif.kelas.nama_kelas}
                          </span>
                        ) : (
                          "-"
                        )}
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
                            onClick={() => handleDelete(item.id_siswa)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {paginatedSiswa.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data siswa tidak ditemukan
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
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {idEdit ? "Edit Siswa" : "Tambah Siswa"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Kolom kelas adalah patokan Dapodik. Kelas aktif tetap dari
                  tabel siswa_kelas.
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
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="NISN"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="NIS"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Nama Lengkap"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={jenkel}
                  onChange={(e) => setJenkel(e.target.value)}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>

                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Tempat Lahir"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                />

                <input
                  type="date"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Agama"
                  value={agama}
                  onChange={(e) => setAgama(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Kelas Dapodik, contoh: X PPLG 1"
                  value={kelasDapodik}
                  onChange={(e) => setKelasDapodik(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={idKelas}
                  onChange={(e) => setIdKelas(e.target.value)}
                >
                  <option value="">Pilih Kelas Aktif</option>
                  {kelasList.map((item) => (
                    <option key={item.id_kelas} value={item.id_kelas}>
                      {item.nama_kelas} - {item.jurusan?.kode_jurusan || "-"} -{" "}
                      {item.tahun_ajaran?.nama_tahun_ajaran || "-"}{" "}
                      {item.tahun_ajaran?.semester || ""}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={aktif ? "true" : "false"}
                  onChange={(e) => setAktif(e.target.value === "true")}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
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
    </DashboardLayout>
  )
}