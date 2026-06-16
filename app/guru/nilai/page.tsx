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
  Settings,
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

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  mapel?: { nama_mapel: string }
  kelas?: { nama_kelas: string }
}

type Siswa = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nis: string | null
}

type SiswaKelas = {
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  siswa?: Siswa
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  status: string | null
}

type PengumpulanTugas = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  status: string | null
}

type NilaiKomponen = {
  id_komponen: string
  id_mengajar: string
  nama_komponen: string
  tipe: "otomatis_tugas" | "manual"
  bobot: number
  aktif: boolean
}

type NilaiSiswa = {
  id_nilai_siswa: string
  id_komponen: string
  id_siswa: string
  nilai: number
  catatan: string | null
}

type RowNilai = {
  id_siswa: string
  nama_lengkap: string
  nisn: string | null
  nis: string | null
  id_mengajar: string
  mapel: string
  kelas: string
  rata_tugas: number
  jumlah_tugas: number
  tugas_dinilai: number
  nilai_manual_rata: number
  nilai_akhir: number
}

type SortKey =
  | "nama_lengkap"
  | "nisn"
  | "mapel"
  | "kelas"
  | "rata_tugas"
  | "nilai_manual_rata"
  | "nilai_akhir"

type SortConfig = {
  key: SortKey
  direction: "asc" | "desc"
}

const ITEMS_PER_PAGE = 10

export default function GuruNilaiPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [siswaKelasList, setSiswaKelasList] = useState<SiswaKelas[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>([])
  const [komponenList, setKomponenList] = useState<NilaiKomponen[]>([])
  const [nilaiSiswaList, setNilaiSiswaList] = useState<NilaiSiswa[]>([])

  const [search, setSearch] = useState("")
  const [filterMengajar, setFilterMengajar] = useState("")

  const [modalKomponenOpen, setModalKomponenOpen] = useState(false)
  const [idEditKomponen, setIdEditKomponen] = useState<string | null>(null)
  const [komponenMengajar, setKomponenMengajar] = useState("")
  const [namaKomponen, setNamaKomponen] = useState("")
  const [tipeKomponen, setTipeKomponen] =
    useState<"otomatis_tugas" | "manual">("manual")
  const [bobotKomponen, setBobotKomponen] = useState(0)
  const [savingKomponen, setSavingKomponen] = useState(false)

  const [modalNilaiOpen, setModalNilaiOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<RowNilai | null>(null)
  const [selectedKomponen, setSelectedKomponen] =
    useState<NilaiKomponen | null>(null)
  const [nilaiManual, setNilaiManual] = useState(0)
  const [catatanManual, setCatatanManual] = useState("")
  const [savingNilai, setSavingNilai] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "nama_lengkap",
    direction: "asc",
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
        router.replace("/guru/verifikasi-mengajar")
        return
      }

      const [
        mengajarData,
        siswaKelasData,
        tugasData,
        pengumpulanData,
        komponenData,
        nilaiSiswaData,
      ] = await Promise.all([
        fetchAll(
          "mengajar",
          `
            id_mengajar,
            id_guru,
            id_mapel,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            mapel:id_mapel (
              nama_mapel
            ),
            kelas:id_kelas (
              nama_kelas
            )
          `
        ),

        fetchAll(
          "siswa_kelas",
          `
            id_siswa,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            siswa:id_siswa (
              id_siswa,
              nama_lengkap,
              nisn,
              nis
            )
          `
        ),

        fetchAll(
          "tugas",
          `
            id_tugas,
            id_mengajar,
            judul,
            status
          `
        ),

        fetchAll(
          "pengumpulan_tugas",
          `
            id_pengumpulan,
            id_tugas,
            id_siswa,
            nilai,
            status
          `
        ),

        fetchAll(
          "nilai_komponen",
          `
            id_komponen,
            id_mengajar,
            nama_komponen,
            tipe,
            bobot,
            aktif
          `
        ),

        fetchAll(
          "nilai_siswa",
          `
            id_nilai_siswa,
            id_komponen,
            id_siswa,
            nilai,
            catatan
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
      const kelasIds = mengajarGuru.map((item: any) => item.id_kelas)

      const siswaKelasGuru = (siswaKelasData || []).filter(
        (item: any) =>
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true &&
          kelasIds.includes(item.id_kelas)
      )

      const tugasGuru = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugasGuru.map((item: any) => item.id_tugas)

      const pengumpulanGuru = (pengumpulanData || []).filter((item: any) =>
        tugasIds.includes(item.id_tugas)
      )

      const komponenGuru = (komponenData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const komponenIds = komponenGuru.map((item: any) => item.id_komponen)

      const nilaiSiswaGuru = (nilaiSiswaData || []).filter((item: any) =>
        komponenIds.includes(item.id_komponen)
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setSiswaKelasList(siswaKelasGuru as SiswaKelas[])
      setTugasList(tugasGuru as Tugas[])
      setPengumpulanList(pengumpulanGuru as PengumpulanTugas[])
      setKomponenList(komponenGuru as NilaiKomponen[])
      setNilaiSiswaList(nilaiSiswaGuru as NilaiSiswa[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data nilai")
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

  const hitungRataTugas = (idSiswa: string, idMengajar: string) => {
    const tugasMengajar = tugasList.filter(
      (tugas) => tugas.id_mengajar === idMengajar
    )

    const nilaiTugas = pengumpulanList
      .filter(
        (p) =>
          p.id_siswa === idSiswa &&
          tugasMengajar.some((t) => t.id_tugas === p.id_tugas) &&
          p.nilai !== null &&
          p.nilai !== undefined
      )
      .map((p) => Number(p.nilai || 0))

    const rata =
      nilaiTugas.length > 0
        ? Math.round(
            nilaiTugas.reduce((total, item) => total + item, 0) /
              nilaiTugas.length
          )
        : 0

    return {
      rata,
      jumlahTugas: tugasMengajar.length,
      tugasDinilai: nilaiTugas.length,
    }
  }

  const hitungNilaiManualRata = (idSiswa: string, idMengajar: string) => {
    const komponenManual = komponenList.filter(
      (k) =>
        k.id_mengajar === idMengajar &&
        k.tipe === "manual" &&
        k.aktif === true
    )

    const nilaiManualList = komponenManual
      .map((komponen) => {
        const nilai = nilaiSiswaList.find(
          (n) =>
            n.id_komponen === komponen.id_komponen && n.id_siswa === idSiswa
        )

        return nilai ? Number(nilai.nilai || 0) : null
      })
      .filter((nilai) => nilai !== null) as number[]

    return nilaiManualList.length > 0
      ? Math.round(
          nilaiManualList.reduce((total, item) => total + item, 0) /
            nilaiManualList.length
        )
      : 0
  }

  const hitungNilaiAkhir = (idSiswa: string, idMengajar: string) => {
    const komponen = komponenList.filter(
      (k) => k.id_mengajar === idMengajar && k.aktif === true
    )

    if (komponen.length === 0) return 0

    let totalBobot = 0
    let totalNilai = 0

    komponen.forEach((k) => {
      const bobot = Number(k.bobot || 0)
      if (bobot <= 0) return

      let nilai = 0

      if (k.tipe === "otomatis_tugas") {
        nilai = hitungRataTugas(idSiswa, idMengajar).rata
      } else {
        const nilaiSiswa = nilaiSiswaList.find(
          (n) => n.id_komponen === k.id_komponen && n.id_siswa === idSiswa
        )

        nilai = Number(nilaiSiswa?.nilai || 0)
      }

      totalBobot += bobot
      totalNilai += nilai * bobot
    })

    return totalBobot > 0 ? Math.round(totalNilai / totalBobot) : 0
  }

  const rows = useMemo<RowNilai[]>(() => {
    const result: RowNilai[] = []

    mengajarList.forEach((mengajar) => {
      const siswaDiKelas = siswaKelasList.filter(
        (sk) => sk.id_kelas === mengajar.id_kelas
      )

      siswaDiKelas.forEach((sk) => {
        if (!sk.siswa) return

        const tugasInfo = hitungRataTugas(sk.id_siswa, mengajar.id_mengajar)
        const nilaiManualRata = hitungNilaiManualRata(
          sk.id_siswa,
          mengajar.id_mengajar
        )
        const nilaiAkhir = hitungNilaiAkhir(
          sk.id_siswa,
          mengajar.id_mengajar
        )

        result.push({
          id_siswa: sk.id_siswa,
          nama_lengkap: sk.siswa.nama_lengkap,
          nisn: sk.siswa.nisn,
          nis: sk.siswa.nis,
          id_mengajar: mengajar.id_mengajar,
          mapel: mengajar.mapel?.nama_mapel || "-",
          kelas: mengajar.kelas?.nama_kelas || "-",
          rata_tugas: tugasInfo.rata,
          jumlah_tugas: tugasInfo.jumlahTugas,
          tugas_dinilai: tugasInfo.tugasDinilai,
          nilai_manual_rata: nilaiManualRata,
          nilai_akhir: nilaiAkhir,
        })
      })
    })

    return result
  }, [
    mengajarList,
    siswaKelasList,
    tugasList,
    pengumpulanList,
    komponenList,
    nilaiSiswaList,
  ])

  const filteredAndSortedData = useMemo(() => {
    const keyword = search.toLowerCase()

    const filtered = rows.filter((item) => {
      const matchSearch =
        item.nama_lengkap.toLowerCase().includes(keyword) ||
        (item.nisn || "").toLowerCase().includes(keyword) ||
        (item.nis || "").toLowerCase().includes(keyword) ||
        item.mapel.toLowerCase().includes(keyword) ||
        item.kelas.toLowerCase().includes(keyword)

      const matchMengajar = filterMengajar
        ? item.id_mengajar === filterMengajar
        : true

      return matchSearch && matchMengajar
    })

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

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
  }, [rows, search, filterMengajar, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterMengajar])

  const resetKomponenForm = () => {
    setIdEditKomponen(null)
    setKomponenMengajar(filterMengajar || "")
    setNamaKomponen("")
    setTipeKomponen("manual")
    setBobotKomponen(0)
    setSavingKomponen(false)
  }

  const openTambahKomponen = () => {
    resetKomponenForm()
    setModalKomponenOpen(true)
  }

  const handleEditKomponen = (komponen: NilaiKomponen) => {
    setIdEditKomponen(komponen.id_komponen)
    setKomponenMengajar(komponen.id_mengajar)
    setNamaKomponen(komponen.nama_komponen)
    setTipeKomponen(komponen.tipe)
    setBobotKomponen(Number(komponen.bobot || 0))
    setModalKomponenOpen(true)
  }

  const closeKomponenModal = () => {
    resetKomponenForm()
    setModalKomponenOpen(false)
  }

  const handleSimpanKomponen = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!komponenMengajar || !namaKomponen.trim()) {
      alert("Mapel/Kelas dan nama komponen wajib diisi")
      return
    }

    setSavingKomponen(true)

    const payload = {
      id_mengajar: komponenMengajar,
      nama_komponen: namaKomponen.trim(),
      tipe: tipeKomponen,
      bobot: Number(bobotKomponen || 0),
      aktif: true,
    }

    if (idEditKomponen) {
      const { error } = await supabase
        .from("nilai_komponen")
        .update(payload)
        .eq("id_komponen", idEditKomponen)

      if (error) {
        alert(error.message)
        setSavingKomponen(false)
        return
      }
    } else {
      const { error } = await supabase.from("nilai_komponen").insert(payload)

      if (error) {
        alert(error.message)
        setSavingKomponen(false)
        return
      }
    }

    closeKomponenModal()
    if (profile) await getData(profile)
  }

  const handleDeleteKomponen = async (idKomponen: string) => {
    if (!confirm("Yakin ingin menghapus komponen nilai ini?")) return

    const { error } = await supabase
      .from("nilai_komponen")
      .delete()
      .eq("id_komponen", idKomponen)

    if (error) {
      alert(error.message)
      return
    }

    if (profile) await getData(profile)
  }

  const openInputNilai = (row: RowNilai, komponen: NilaiKomponen) => {
    const existing = nilaiSiswaList.find(
      (n) => n.id_komponen === komponen.id_komponen && n.id_siswa === row.id_siswa
    )

    setSelectedRow(row)
    setSelectedKomponen(komponen)
    setNilaiManual(Number(existing?.nilai || 0))
    setCatatanManual(existing?.catatan || "")
    setModalNilaiOpen(true)
  }

  const closeNilaiModal = () => {
    setSelectedRow(null)
    setSelectedKomponen(null)
    setNilaiManual(0)
    setCatatanManual("")
    setSavingNilai(false)
    setModalNilaiOpen(false)
  }

  const handleSimpanNilaiManual = async () => {
    if (!selectedRow || !selectedKomponen) return

    setSavingNilai(true)

    const existing = nilaiSiswaList.find(
      (n) =>
        n.id_komponen === selectedKomponen.id_komponen &&
        n.id_siswa === selectedRow.id_siswa
    )

    const payload = {
      id_komponen: selectedKomponen.id_komponen,
      id_siswa: selectedRow.id_siswa,
      nilai: Number(nilaiManual || 0),
      catatan: catatanManual.trim() || null,
    }

    if (existing) {
      const { error } = await supabase
        .from("nilai_siswa")
        .update(payload)
        .eq("id_nilai_siswa", existing.id_nilai_siswa)

      if (error) {
        alert(error.message)
        setSavingNilai(false)
        return
      }
    } else {
      const { error } = await supabase.from("nilai_siswa").insert(payload)

      if (error) {
        alert(error.message)
        setSavingNilai(false)
        return
      }
    }

    closeNilaiModal()
    if (profile) await getData(profile)
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

      return { key, direction: "asc" }
    })
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

  const komponenFilter = filterMengajar
    ? komponenList.filter((item) => item.id_mengajar === filterMengajar)
    : []

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Nilai" role="guru" nama={profile?.nama_lengkap}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Nilai Siswa</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Nilai tugas otomatis dari pengumpulan tugas. Nilai manual diatur lewat komponen nilai.
          </p>
        </div>

        <button
          onClick={openTambahKomponen}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={18} />
          Komponen Nilai
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Data</p>
          <h2 className="mt-2 text-3xl font-bold">{rows.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Tugas</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Komponen</p>
          <h2 className="mt-2 text-3xl font-bold">{komponenList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Rata Akhir</p>
          <h2 className="mt-2 text-3xl font-bold">
            {rows.length
              ? Math.round(
                  rows.reduce((sum, item) => sum + item.nilai_akhir, 0) /
                    rows.length
                )
              : 0}
          </h2>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2">
          <Settings size={18} />
          <h2 className="font-semibold">Komponen Nilai</h2>
        </div>

        {!filterMengajar && (
          <p className="text-sm text-slate-500">
            Pilih mapel/kelas dulu untuk melihat komponen nilai.
          </p>
        )}

        {filterMengajar && (
          <div className="space-y-2">
            {komponenFilter.map((item) => (
              <div
                key={item.id_komponen}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center"
              >
                <div>
                  <p className="font-medium">{item.nama_komponen}</p>
                  <p className="text-sm text-slate-500">
                    {item.tipe === "otomatis_tugas"
                      ? "Otomatis dari rata-rata tugas"
                      : "Input manual"}{" "}
                    • Bobot {item.bobot}%
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditKomponen(item)}
                    className="rounded-xl border border-slate-200 p-2 dark:border-slate-700"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDeleteKomponen(item.id_komponen)}
                    className="rounded-xl border border-slate-200 p-2 text-red-600 dark:border-slate-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {komponenFilter.length === 0 && (
              <p className="text-sm text-slate-500">
                Belum ada komponen nilai untuk mapel/kelas ini.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Rekap Nilai</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {paginatedData.length} dari{" "}
              {filteredAndSortedData.length} data
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterMengajar}
              onChange={(e) => setFilterMengajar(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Semua Mapel/Kelas</option>
              {mengajarList.map((item) => (
                <option key={item.id_mengajar} value={item.id_mengajar}>
                  {item.mapel?.nama_mapel || "-"} -{" "}
                  {item.kelas?.nama_kelas || "-"}
                </option>
              ))}
            </select>

            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Cari siswa / mapel / kelas..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950">
                  <th className="p-4">No</th>
                  <th className="p-4">
                    <SortButton label="Nama" sortKey="nama_lengkap" />
                  </th>
                  <th className="p-4">
                    <SortButton label="NISN" sortKey="nisn" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Mapel" sortKey="mapel" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Kelas" sortKey="kelas" />
                  </th>
                  <th className="p-4">
                    <SortButton label="Rata Tugas" sortKey="rata_tugas" />
                  </th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">
                    <SortButton
                      label="Manual"
                      sortKey="nilai_manual_rata"
                    />
                  </th>
                  <th className="p-4">
                    <SortButton label="Akhir" sortKey="nilai_akhir" />
                  </th>
                  <th className="p-4 text-right">Input Manual</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedData.map((item, index) => {
                  const komponenManual = komponenList.filter(
                    (k) =>
                      k.id_mengajar === item.id_mengajar &&
                      k.tipe === "manual" &&
                      k.aktif
                  )

                  return (
                    <tr
                      key={`${item.id_siswa}-${item.id_mengajar}`}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                    >
                      <td className="p-4 text-slate-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      <td className="p-4 font-medium">{item.nama_lengkap}</td>
                      <td className="p-4">{item.nisn || item.nis || "-"}</td>
                      <td className="p-4">{item.mapel}</td>

                      <td className="p-4">
                        <span className="rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {item.kelas}
                        </span>
                      </td>

                      <td className="p-4">{item.rata_tugas}</td>
                      <td className="p-4">
                        {item.tugas_dinilai}/{item.jumlah_tugas} tugas
                      </td>
                      <td className="p-4">{item.nilai_manual_rata}</td>

                      <td className="p-4">
                        <span
                          className={
                            item.nilai_akhir >= 75
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"
                              : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                          }
                        >
                          {item.nilai_akhir}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          {komponenManual.map((komponen) => (
                            <button
                              key={komponen.id_komponen}
                              onClick={() => openInputNilai(item, komponen)}
                              className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300"
                            >
                              {komponen.nama_komponen}
                            </button>
                          ))}

                          {komponenManual.length === 0 && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Data nilai tidak ditemukan
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
            </button>
          </div>
        </div>
      </div>

      {modalKomponenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {idEditKomponen ? "Edit Komponen" : "Tambah Komponen"}
              </h2>

              <button onClick={closeKomponenModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSimpanKomponen} className="space-y-4">
              <select
                value={komponenMengajar}
                onChange={(e) => setKomponenMengajar(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Pilih Mapel/Kelas</option>
                {mengajarList.map((item) => (
                  <option key={item.id_mengajar} value={item.id_mengajar}>
                    {item.mapel?.nama_mapel || "-"} -{" "}
                    {item.kelas?.nama_kelas || "-"}
                  </option>
                ))}
              </select>

              <input
                value={namaKomponen}
                onChange={(e) => setNamaKomponen(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Contoh: Tugas Online / Praktik / UTS / UAS"
              />

              <select
                value={tipeKomponen}
                onChange={(e) =>
                  setTipeKomponen(
                    e.target.value as "otomatis_tugas" | "manual"
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="otomatis_tugas">Otomatis dari Tugas</option>
                <option value="manual">Manual</option>
              </select>

              <input
                type="number"
                value={bobotKomponen}
                onChange={(e) => setBobotKomponen(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Bobot (%)"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeKomponenModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium"
                >
                  Batal
                </button>

                <button
                  disabled={savingKomponen}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {savingKomponen ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalNilaiOpen && selectedRow && selectedKomponen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Input Nilai Manual</h2>
                <p className="text-sm text-slate-500">
                  {selectedRow.nama_lengkap} - {selectedKomponen.nama_komponen}
                </p>
              </div>

              <button onClick={closeNilaiModal}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                min={0}
                max={100}
                value={nilaiManual}
                onChange={(e) => setNilaiManual(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Nilai"
              />

              <input
                value={catatanManual}
                onChange={(e) => setCatatanManual(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Catatan opsional"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeNilaiModal}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSimpanNilaiManual}
                  disabled={savingNilai}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  <Save size={16} />
                  {savingNilai ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}