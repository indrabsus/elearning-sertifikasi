"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  PlayCircle,
  Save,
  Search,
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
  id_siswa: string | null
}

type SiswaKelas = {
  id_siswa_kelas: string
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  kelas?: {
    nama_kelas: string
  }
}

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  mapel?: {
    nama_mapel: string
  }
  guru?: {
    nama_lengkap: string
  }
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  status: string | null
  created_at: string | null
  mengajar?: Mengajar
}

type OpsiJawaban = {
  id_opsi: string
  id_soal: string
  label: "A" | "B" | "C" | "D" | "E"
  isi_opsi: string
  is_benar: boolean
  gambar_url: string | null
}

type BankSoal = {
  id_soal: string
  pertanyaan: string
  pembahasan: string | null
  tipe_soal: "pg" | "essay"
  tingkat_kesulitan: string | null
  gambar_url: string | null
  audio_url: string | null
  opsi_jawaban?: OpsiJawaban[]
}

type TugasSoal = {
  id_tugas_soal: string
  id_tugas: string
  id_soal: string
  nomor: number
  bobot: number
  bank_soal?: BankSoal
}

type PengumpulanTugas = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  catatan_guru: string | null
  status: string | null
  mulai_at: string | null
  selesai_at: string | null
}

type JawabanTugasSiswa = {
  id_jawaban: string
  id_pengumpulan: string
  id_soal: string
  id_opsi: string | null
  jawaban_text: string | null
  is_benar: boolean
  nilai: number
}

const ITEMS_PER_PAGE = 10

export default function SiswaTugasPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [siswaKelas, setSiswaKelas] = useState<SiswaKelas | null>(null)
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [tugasSoalList, setTugasSoalList] = useState<TugasSoal[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>([])
  const [jawabanList, setJawabanList] = useState<JawabanTugasSiswa[]>([])

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null)
  const [activePengumpulan, setActivePengumpulan] =
    useState<PengumpulanTugas | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const getData = async (userProfile: Profile) => {
    try {
      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")

      if (!idTahunAjaran) {
        router.replace("/login")
        return
      }

      if (!userProfile.id_siswa) {
        router.replace("/login")
        return
      }

      const [
        siswaKelasData,
        mengajarData,
        tugasData,
        pengumpulanData,
        jawabanData,
      ] = await Promise.all([
        fetchAll(
          "siswa_kelas",
          `
            id_siswa_kelas,
            id_siswa,
            id_kelas,
            id_tahun_ajaran,
            aktif,
            kelas:id_kelas (
              nama_kelas
            )
          `
        ),

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
            guru:id_guru (
              nama_lengkap
            )
          `
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
              mapel:id_mapel (
                nama_mapel
              ),
              guru:id_guru (
                nama_lengkap
              )
            )
          `,
          "created_at",
          false
        ),

        fetchAll(
          "pengumpulan_tugas",
          `
            id_pengumpulan,
            id_tugas,
            id_siswa,
            nilai,
            catatan_guru,
            status,
            mulai_at,
            selesai_at
          `
        ),

        fetchAll(
          "jawaban_tugas_siswa",
          `
            id_jawaban,
            id_pengumpulan,
            id_soal,
            id_opsi,
            jawaban_text,
            is_benar,
            nilai
          `
        ),
      ])

      const kelasAktif = (siswaKelasData || []).find(
        (item: any) =>
          item.id_siswa === userProfile.id_siswa &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      if (!kelasAktif) {
        router.replace("/siswa/verifikasi-kelas")
        return
      }

      const mengajarSiswa = (mengajarData || []).filter(
        (item: any) =>
          item.id_kelas === kelasAktif.id_kelas &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      const mengajarIds = mengajarSiswa.map((item: any) => item.id_mengajar)

      const tugasSiswa = (tugasData || []).filter(
        (item: any) =>
          mengajarIds.includes(item.id_mengajar) && item.status === "aktif"
      )

      const tugasIds = tugasSiswa.map((item: any) => item.id_tugas)

      let tugasSoalFix: TugasSoal[] = []

      if (tugasIds.length > 0) {
        const { data: tugasSoalDataFix, error: tugasSoalError } =
          await supabase
            .from("tugas_soal")
            .select(
              `
                id_tugas_soal,
                id_tugas,
                id_soal,
                nomor,
                bobot,
                bank_soal:id_soal (
                  id_soal,
                  pertanyaan,
                  pembahasan,
                  tipe_soal,
                  tingkat_kesulitan,
                  gambar_url,
                  audio_url,
                  opsi_jawaban (
                    id_opsi,
                    id_soal,
                    label,
                    isi_opsi,
                    is_benar,
                    gambar_url
                  )
                )
              `
            )
            .in("id_tugas", tugasIds)

        if (tugasSoalError) {
          alert(tugasSoalError.message)
          return
        }

        tugasSoalFix = (tugasSoalDataFix || []) as TugasSoal[]
      }

      const pengumpulanSiswa = (pengumpulanData || []).filter(
        (item: any) =>
          item.id_siswa === userProfile.id_siswa &&
          tugasIds.includes(item.id_tugas)
      )

      const pengumpulanIds = pengumpulanSiswa.map(
        (item: any) => item.id_pengumpulan
      )

      const jawabanSiswa = (jawabanData || []).filter((item: any) =>
        pengumpulanIds.includes(item.id_pengumpulan)
      )

      setSiswaKelas(kelasAktif as SiswaKelas)
      setTugasList(tugasSiswa as Tugas[])
      setTugasSoalList(tugasSoalFix)
      setPengumpulanList(pengumpulanSiswa as PengumpulanTugas[])
      setJawabanList(jawabanSiswa as JawabanTugasSiswa[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data tugas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["siswa"], router)
      if (!userProfile) return

      setProfile(userProfile as Profile)
      await getData(userProfile as Profile)
    }

    check()
  }, [router])

  const getPengumpulan = (idTugas: string) => {
    return pengumpulanList.find((item) => item.id_tugas === idTugas) || null
  }

  const getSoalTugas = (idTugas: string) => {
    return tugasSoalList
      .filter((item) => item.id_tugas === idTugas)
      .sort((a, b) => Number(a.nomor) - Number(b.nomor))
  }

  const isDeadlineLewat = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline).getTime() < new Date().getTime()
  }

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase()

    return tugasList.filter((item) => {
      const pengumpulan = getPengumpulan(item.id_tugas)
      const status = pengumpulan?.status || "belum"

      const matchSearch =
        item.judul.toLowerCase().includes(keyword) ||
        (item.deskripsi || "").toLowerCase().includes(keyword) ||
        (item.mengajar?.mapel?.nama_mapel || "")
          .toLowerCase()
          .includes(keyword) ||
        (item.mengajar?.guru?.nama_lengkap || "")
          .toLowerCase()
          .includes(keyword)

      const matchStatus = filterStatus ? status === filterStatus : true

      return matchSearch && matchStatus
    })
  }, [tugasList, pengumpulanList, search, filterStatus])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus])

  const openKerjakan = async (tugas: Tugas) => {
    if (!profile?.id_siswa) return

    if (isDeadlineLewat(tugas.deadline)) {
      alert("Deadline tugas sudah lewat")
      return
    }

    const soal = getSoalTugas(tugas.id_tugas)

    if (soal.length === 0) {
      alert("Tugas ini belum memiliki soal")
      return
    }

    let pengumpulan = getPengumpulan(tugas.id_tugas)

    if (!pengumpulan) {
      const { data, error } = await supabase
        .from("pengumpulan_tugas")
        .insert({
          id_tugas: tugas.id_tugas,
          id_siswa: profile.id_siswa,
          status: "dikerjakan",
          mulai_at: new Date().toISOString(),
        })
        .select(
          "id_pengumpulan, id_tugas, id_siswa, nilai, catatan_guru, status, mulai_at, selesai_at"
        )
        .single()

      if (error) {
        alert(error.message)
        return
      }

      pengumpulan = data as PengumpulanTugas
      setPengumpulanList((prev) => [...prev, pengumpulan as PengumpulanTugas])
    }

    const existingAnswers = jawabanList.filter(
      (item) => item.id_pengumpulan === pengumpulan?.id_pengumpulan
    )

    const answerMap: Record<string, string> = {}

    existingAnswers.forEach((jawaban) => {
      if (jawaban.id_opsi) {
        answerMap[jawaban.id_soal] = jawaban.id_opsi
      } else if (jawaban.jawaban_text) {
        answerMap[jawaban.id_soal] = jawaban.jawaban_text
      }
    })

    setSelectedTugas(tugas)
    setActivePengumpulan(pengumpulan)
    setAnswers(answerMap)
    setModalOpen(true)
  }

  const handleChangeAnswer = (idSoal: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [idSoal]: value,
    }))
  }

  const handleSubmitJawaban = async () => {
    if (!selectedTugas || !activePengumpulan) return

    const soalTugas = getSoalTugas(selectedTugas.id_tugas)

    const belumTerjawab = soalTugas.some((item) => {
      const value = answers[item.id_soal]
      return !value || String(value).trim() === ""
    })

    if (belumTerjawab) {
      alert("Masih ada soal yang belum dijawab")
      return
    }

    setSaving(true)

    const oldJawaban = jawabanList.filter(
      (item) => item.id_pengumpulan === activePengumpulan.id_pengumpulan
    )

    if (oldJawaban.length > 0) {
      const { error: deleteError } = await supabase
        .from("jawaban_tugas_siswa")
        .delete()
        .eq("id_pengumpulan", activePengumpulan.id_pengumpulan)

      if (deleteError) {
        alert(deleteError.message)
        setSaving(false)
        return
      }
    }

    let totalBobot = 0
    let totalNilai = 0
    let adaEssay = false

    const payloadJawaban = soalTugas.map((item) => {
      const soal = item.bank_soal
      const bobot = Number(item.bobot || 1)
      totalBobot += bobot

      if (soal?.tipe_soal === "pg") {
        const idOpsi = answers[item.id_soal]

        const opsiDipilih = soal.opsi_jawaban?.find(
          (opsi) => opsi.id_opsi === idOpsi
        )

        const benar = Boolean(opsiDipilih?.is_benar)
        const nilaiSoal = benar ? bobot : 0

        totalNilai += nilaiSoal

        return {
          id_pengumpulan: activePengumpulan.id_pengumpulan,
          id_soal: item.id_soal,
          id_opsi: idOpsi,
          jawaban_text: null,
          is_benar: benar,
          nilai: nilaiSoal,
        }
      }

      adaEssay = true

      return {
        id_pengumpulan: activePengumpulan.id_pengumpulan,
        id_soal: item.id_soal,
        id_opsi: null,
        jawaban_text: answers[item.id_soal],
        is_benar: false,
        nilai: 0,
      }
    })

    const { error: insertJawabanError } = await supabase
      .from("jawaban_tugas_siswa")
      .insert(payloadJawaban)

    if (insertJawabanError) {
      alert(insertJawabanError.message)
      setSaving(false)
      return
    }

    const nilaiAkhir =
      totalBobot > 0 && !adaEssay
        ? Math.round((totalNilai / totalBobot) * 100)
        : null

    const statusBaru = adaEssay ? "selesai" : "dinilai"

    const { error: updatePengumpulanError } = await supabase
      .from("pengumpulan_tugas")
      .update({
        status: statusBaru,
        nilai: nilaiAkhir,
        selesai_at: new Date().toISOString(),
      })
      .eq("id_pengumpulan", activePengumpulan.id_pengumpulan)

    if (updatePengumpulanError) {
      alert(updatePengumpulanError.message)
      setSaving(false)
      return
    }

    setModalOpen(false)
    setSelectedTugas(null)
    setActivePengumpulan(null)
    setAnswers({})
    setSaving(false)

    if (profile) await getData(profile)
  }

  const getStatusBadge = (status?: string | null) => {
    if (status === "dinilai") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Dinilai
        </span>
      )
    }

    if (status === "selesai") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Menunggu Nilai
        </span>
      )
    }

    if (status === "dikerjakan") {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Dikerjakan
        </span>
      )
    }

    if (status === "terlambat") {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
          Terlambat
        </span>
      )
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Belum
      </span>
    )
  }

  const selectedSoal = selectedTugas ? getSoalTugas(selectedTugas.id_tugas) : []

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Tugas" role="siswa" nama={profile?.nama_lengkap}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tugas Saya</h1>
        <p className="mt-1 text-sm text-slate-500">
          Daftar tugas aktif berdasarkan kelas kamu:{" "}
          <b>{siswaKelas?.kelas?.nama_kelas || "-"}</b>
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Tugas Aktif</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Soal</p>
          <h2 className="mt-2 text-3xl font-bold">{tugasSoalList.length}</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Sudah Dinilai</p>
          <h2 className="mt-2 text-3xl font-bold">
            {
              pengumpulanList.filter(
                (item) => item.nilai !== null && item.nilai !== undefined
              ).length
            }
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Rata-rata</p>
          <h2 className="mt-2 text-3xl font-bold">
            {pengumpulanList.filter((item) => item.nilai !== null).length > 0
              ? Math.round(
                  pengumpulanList
                    .filter((item) => item.nilai !== null)
                    .reduce((sum, item) => sum + Number(item.nilai || 0), 0) /
                    pengumpulanList.filter((item) => item.nilai !== null).length
                )
              : 0}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Daftar Tugas</h2>
            <p className="text-sm text-slate-500">
              Menampilkan {paginatedData.length} dari {filteredData.length} tugas
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Semua Status</option>
              <option value="belum">Belum</option>
              <option value="dikerjakan">Dikerjakan</option>
              <option value="selesai">Menunggu Nilai</option>
              <option value="dinilai">Dinilai</option>
              <option value="terlambat">Terlambat</option>
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
                placeholder="Cari tugas..."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedData.map((tugas) => {
            const pengumpulan = getPengumpulan(tugas.id_tugas)
            const soalCount = getSoalTugas(tugas.id_tugas).length
            const deadlineLewat = isDeadlineLewat(tugas.deadline)

            return (
              <div
                key={tugas.id_tugas}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <ClipboardList size={24} />
                  </div>

                  {getStatusBadge(pengumpulan?.status)}
                </div>

                <h3 className="line-clamp-2 text-lg font-bold">{tugas.judul}</h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                  {tugas.deskripsi || "Tidak ada deskripsi tugas."}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <b>Mapel:</b> {tugas.mengajar?.mapel?.nama_mapel || "-"}
                  </p>
                  <p>
                    <b>Guru:</b> {tugas.mengajar?.guru?.nama_lengkap || "-"}
                  </p>
                  <p>
                    <b>Soal:</b> {soalCount}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarClock size={15} />
                    {tugas.deadline
                      ? new Date(tugas.deadline).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Tanpa deadline"}
                  </p>
                </div>

                {pengumpulan?.nilai !== null &&
                  pengumpulan?.nilai !== undefined && (
                    <div className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                      Nilai: <b>{pengumpulan.nilai}</b>
                    </div>
                  )}

                {pengumpulan?.catatan_guru && (
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                    Catatan: {pengumpulan.catatan_guru}
                  </div>
                )}

                <button
                  onClick={() => openKerjakan(tugas)}
                  disabled={
                    deadlineLewat ||
                    pengumpulan?.status === "dinilai" ||
                    pengumpulan?.status === "selesai"
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlayCircle size={16} />
                  {pengumpulan ? "Lanjut / Lihat Jawaban" : "Kerjakan"}
                </button>
              </div>
            )
          })}

          {paginatedData.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
              Data tugas tidak ditemukan.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 md:flex-row">
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

      {modalOpen && selectedTugas && activePengumpulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{selectedTugas.judul}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTugas.mengajar?.mapel?.nama_mapel || "-"} •{" "}
                  {selectedSoal.length} soal
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {selectedSoal.map((item, index) => {
                const soal = item.bank_soal
                if (!soal) return null

                return (
                  <div
                    key={item.id_tugas_soal}
                    className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        No. {index + 1}
                      </span>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {soal.tipe_soal.toUpperCase()}
                      </span>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        Bobot {item.bobot}
                      </span>
                    </div>

                    <p className="font-semibold leading-7">{soal.pertanyaan}</p>

                    {soal.gambar_url && (
                      <img
                        src={soal.gambar_url}
                        alt="Gambar soal"
                        className="mt-4 max-h-72 rounded-2xl border object-contain"
                      />
                    )}

                    {soal.audio_url && (
                      <audio controls className="mt-4 w-full">
                        <source src={soal.audio_url} />
                      </audio>
                    )}

                    {soal.tipe_soal === "pg" ? (
                      <div className="mt-4 space-y-2">
                        {(soal.opsi_jawaban || [])
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map((opsi) => (
                            <label
                              key={opsi.id_opsi}
                              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                            >
                              <input
                                type="radio"
                                name={soal.id_soal}
                                checked={answers[soal.id_soal] === opsi.id_opsi}
                                onChange={() =>
                                  handleChangeAnswer(
                                    soal.id_soal,
                                    opsi.id_opsi
                                  )
                                }
                                className="mt-1"
                              />

                              <div>
                                <p className="font-medium">
                                  {opsi.label}. {opsi.isi_opsi}
                                </p>

                                {opsi.gambar_url && (
                                  <img
                                    src={opsi.gambar_url}
                                    alt={`Opsi ${opsi.label}`}
                                    className="mt-2 max-h-40 rounded-xl border object-contain"
                                  />
                                )}
                              </div>
                            </label>
                          ))}
                      </div>
                    ) : (
                      <textarea
                        value={answers[soal.id_soal] || ""}
                        onChange={(e) =>
                          handleChangeAnswer(soal.id_soal, e.target.value)
                        }
                        className="mt-4 min-h-36 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                        placeholder="Tulis jawaban essay kamu..."
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmitJawaban}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Menyimpan..." : "Kumpulkan Jawaban"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}