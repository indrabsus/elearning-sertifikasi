"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Award,
  CheckCircle,
  FileCheck,
  Save,
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
  id_siswa: string | null
}

type Kompetensi = {
  id_kompetensi: string
  judul: string
  deskripsi: string | null
  syarat_lulus: number | null
}

type KompetensiTugas = {
  id_kompetensi_tugas: string
  id_kompetensi: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  status: string | null
}

type OpsiJawaban = {
  id_opsi: string
  id_soal: string
  label: string
  isi_opsi: string
  is_benar: boolean
}

type BankSoal = {
  id_soal: string
  pertanyaan: string
  tipe_soal: "pg" | "essay"
  pembahasan: string | null
  opsi_jawaban?: OpsiJawaban[]
}

type KompetensiTugasSoal = {
  id_kompetensi_tugas_soal: string
  id_kompetensi_tugas: string
  id_soal: string
  nomor: number
  bobot: number | null
  bank_soal?: BankSoal
}

type PengumpulanKompetensi = {
  id_pengumpulan_kompetensi: string
  id_kompetensi_tugas: string
  id_siswa: string
  nilai: number | null
  status: string
  catatan_kajur: string | null
  mulai_at: string | null
  selesai_at: string | null
}

export default function SiswaKompetensiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const idKompetensi = String(params.id)

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [kompetensi, setKompetensi] = useState<Kompetensi | null>(null)
  const [tugasList, setTugasList] = useState<KompetensiTugas[]>([])
  const [soalList, setSoalList] = useState<KompetensiTugasSoal[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<
    PengumpulanKompetensi[]
  >([])

  const [selectedTugas, setSelectedTugas] = useState<KompetensiTugas | null>(
    null
  )
  const [activePengumpulan, setActivePengumpulan] =
    useState<PengumpulanKompetensi | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const getData = async (userProfile: Profile) => {
    try {
      if (!userProfile.id_siswa) {
        router.replace("/login")
        return
      }

      const { data: kompetensiData, error: kompetensiError } = await supabase
        .from("kompetensi")
        .select("id_kompetensi, judul, deskripsi, syarat_lulus")
        .eq("id_kompetensi", idKompetensi)
        .maybeSingle()

      if (kompetensiError) {
        alert(kompetensiError.message)
        return
      }

      if (!kompetensiData) {
        alert("Kompetensi tidak ditemukan")
        router.replace("/siswa/roadmap")
        return
      }

      const { data: tugasKompetensiData, error: tugasKompetensiError } =
        await supabase
          .from("kompetensi_tugas")
          .select(
            `
              id_kompetensi_tugas,
              id_kompetensi,
              judul,
              deskripsi,
              deadline,
              status
            `
          )
          .eq("id_kompetensi", idKompetensi)
          .eq("status", "aktif")

      if (tugasKompetensiError) {
        alert(tugasKompetensiError.message)
        return
      }

      const tugasKompetensi = (tugasKompetensiData ||
        []) as KompetensiTugas[]

      const tugasIds = tugasKompetensi.map(
        (item) => item.id_kompetensi_tugas
      )

      let soalKompetensi: KompetensiTugasSoal[] = []

      if (tugasIds.length > 0) {
        const { data: soalKompetensiData, error: soalKompetensiError } =
          await supabase
            .from("kompetensi_tugas_soal")
            .select(
              `
                id_kompetensi_tugas_soal,
                id_kompetensi_tugas,
                id_soal,
                nomor,
                bobot,
                bank_soal:id_soal (
                  id_soal,
                  pertanyaan,
                  tipe_soal,
                  pembahasan,
                  opsi_jawaban (
                    id_opsi,
                    id_soal,
                    label,
                    isi_opsi,
                    is_benar
                  )
                )
              `
            )
            .in("id_kompetensi_tugas", tugasIds)

        if (soalKompetensiError) {
          alert(soalKompetensiError.message)
          return
        }

        soalKompetensi = ((soalKompetensiData ||
          []) as KompetensiTugasSoal[]).sort(
          (a, b) => Number(a.nomor) - Number(b.nomor)
        )
      }

      const pengumpulanData = await fetchAll(
        "pengumpulan_kompetensi",
        `
          id_pengumpulan_kompetensi,
          id_kompetensi_tugas,
          id_siswa,
          nilai,
          status,
          catatan_kajur,
          mulai_at,
          selesai_at
        `
      )

      const pengumpulanSiswa = (
        (pengumpulanData || []) as PengumpulanKompetensi[]
      ).filter(
        (item) =>
          item.id_siswa === userProfile.id_siswa &&
          tugasIds.includes(item.id_kompetensi_tugas)
      )

      setKompetensi(kompetensiData as Kompetensi)
      setTugasList(tugasKompetensi)
      setSoalList(soalKompetensi)
      setPengumpulanList(pengumpulanSiswa)
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data kompetensi")
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
  }, [router, idKompetensi])

  const getPengumpulan = (idTugas: string) => {
    return (
      pengumpulanList.find((item) => item.id_kompetensi_tugas === idTugas) ||
      null
    )
  }

  const getSoalTugas = (idTugas: string) => {
    return soalList
      .filter((item) => item.id_kompetensi_tugas === idTugas)
      .sort((a, b) => Number(a.nomor) - Number(b.nomor))
  }

  const openKerjakan = async (tugas: KompetensiTugas) => {
    if (!profile?.id_siswa) return

    const soal = getSoalTugas(tugas.id_kompetensi_tugas)

    if (soal.length === 0) {
      alert("Tugas kompetensi ini belum memiliki soal")
      return
    }

    let pengumpulan = getPengumpulan(tugas.id_kompetensi_tugas)

    if (!pengumpulan) {
      const { data, error } = await supabase
        .from("pengumpulan_kompetensi")
        .insert({
          id_kompetensi_tugas: tugas.id_kompetensi_tugas,
          id_siswa: profile.id_siswa,
          nilai: 0,
          status: "dikerjakan",
          mulai_at: new Date().toISOString(),
        })
        .select(
          `
            id_pengumpulan_kompetensi,
            id_kompetensi_tugas,
            id_siswa,
            nilai,
            status,
            catatan_kajur,
            mulai_at,
            selesai_at
          `
        )
        .single()

      if (error) {
        alert(error.message)
        return
      }

      pengumpulan = data as PengumpulanKompetensi
      setPengumpulanList((prev) => [
        ...prev,
        pengumpulan as PengumpulanKompetensi,
      ])
    }

    setSelectedTugas(tugas)
    setActivePengumpulan(pengumpulan)
    setAnswers({})
  }

  const handleAnswer = (idSoal: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [idSoal]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedTugas || !activePengumpulan) return

    const soalTugas = getSoalTugas(selectedTugas.id_kompetensi_tugas)

    const belumLengkap = soalTugas.some((item) => {
      const value = answers[item.id_soal]
      return !value || value.trim() === ""
    })

    if (belumLengkap) {
      alert("Masih ada soal yang belum dijawab")
      return
    }

    setSaving(true)

    const { error: deleteOldError } = await supabase
      .from("jawaban_kompetensi_siswa")
      .delete()
      .eq(
        "id_pengumpulan_kompetensi",
        activePengumpulan.id_pengumpulan_kompetensi
      )

    if (deleteOldError) {
      alert(deleteOldError.message)
      setSaving(false)
      return
    }

    let totalNilai = 0
    let adaEssay = false

    const jawabanPayload = soalTugas.map((item) => {
      const soal = item.bank_soal

      if (soal?.tipe_soal === "pg") {
        const idOpsi = answers[item.id_soal]
        const opsi = soal.opsi_jawaban?.find((op) => op.id_opsi === idOpsi)
        const benar = Boolean(opsi?.is_benar)
        const nilaiSoal = benar ? 100 : 0

        totalNilai += nilaiSoal

        return {
          id_pengumpulan_kompetensi:
            activePengumpulan.id_pengumpulan_kompetensi,
          id_soal: item.id_soal,
          id_opsi: idOpsi,
          jawaban_text: null,
          is_benar: benar,
          nilai: nilaiSoal,
        }
      }

      adaEssay = true

      return {
        id_pengumpulan_kompetensi:
          activePengumpulan.id_pengumpulan_kompetensi,
        id_soal: item.id_soal,
        id_opsi: null,
        jawaban_text: answers[item.id_soal],
        is_benar: false,
        nilai: 0,
      }
    })

    const { error: insertError } = await supabase
      .from("jawaban_kompetensi_siswa")
      .insert(jawabanPayload)

    if (insertError) {
      alert(insertError.message)
      setSaving(false)
      return
    }

    const nilaiAkhir = adaEssay ? 0 : Math.round(totalNilai / soalTugas.length)
    const statusBaru = adaEssay ? "selesai" : "menunggu_acc"

    const { error: updateError } = await supabase
      .from("pengumpulan_kompetensi")
      .update({
        nilai: nilaiAkhir,
        status: statusBaru,
        selesai_at: new Date().toISOString(),
      })
      .eq(
        "id_pengumpulan_kompetensi",
        activePengumpulan.id_pengumpulan_kompetensi
      )

    if (updateError) {
      alert(updateError.message)
      setSaving(false)
      return
    }

    setSelectedTugas(null)
    setActivePengumpulan(null)
    setAnswers({})
    setSaving(false)

    if (profile) await getData(profile)
  }

  const tugasAktif = useMemo(() => tugasList, [tugasList])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Kompetensi"
      role="siswa"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <Link
          href="/siswa/roadmap"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Kembali ke Roadmap
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {kompetensi?.judul || "Kompetensi"}
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {kompetensi?.deskripsi ||
            "Kerjakan tugas kompetensi untuk mendapatkan sertifikat."}
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <FileCheck className="mb-3 text-blue-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tugas Aktif
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {tugasAktif.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle className="mb-3 text-green-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dikerjakan
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {pengumpulanList.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <Award className="mb-3 text-amber-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Syarat Lulus
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {kompetensi?.syarat_lulus || 75}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tugasAktif.map((tugas) => {
          const pengumpulan = getPengumpulan(tugas.id_kompetensi_tugas)
          const totalSoal = getSoalTugas(tugas.id_kompetensi_tugas).length

          return (
            <div
              key={tugas.id_kompetensi_tugas}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <FileCheck size={24} />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {pengumpulan?.status || "belum"}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tugas.judul}
              </h3>

              <p className="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                {tugas.deskripsi || "Tidak ada deskripsi tugas."}
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-950">
                <p className="text-slate-700 dark:text-slate-200">
                  Jumlah soal: <b>{totalSoal}</b>
                </p>
                <p className="text-slate-700 dark:text-slate-200">
                  Nilai: <b>{pengumpulan?.nilai ?? "-"}</b>
                </p>
              </div>

              <button
                onClick={() => openKerjakan(tugas)}
                disabled={
                  pengumpulan?.status === "menunggu_acc" ||
                  pengumpulan?.status === "lulus"
                }
                className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pengumpulan ? "Lihat / Lanjutkan" : "Kerjakan Kompetensi"}
              </button>
            </div>
          )
        })}

        {tugasAktif.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Belum ada tugas kompetensi aktif dari Kajur.
          </div>
        )}
      </div>

      {selectedTugas && activePengumpulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedTugas.judul}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Jawab semua soal kompetensi.
                </p>
              </div>

              <button
                onClick={() => setSelectedTugas(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              {getSoalTugas(selectedTugas.id_kompetensi_tugas).map(
                (item, index) => {
                  const soal = item.bank_soal
                  if (!soal) return null

                  return (
                    <div
                      key={item.id_kompetensi_tugas_soal}
                      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          No. {index + 1}
                        </span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {soal.tipe_soal.toUpperCase()}
                        </span>
                      </div>

                      <p className="font-semibold leading-7 text-slate-900 dark:text-white">
                        {soal.pertanyaan}
                      </p>

                      {soal.tipe_soal === "pg" ? (
                        <div className="mt-4 space-y-2">
                          {(soal.opsi_jawaban || [])
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map((opsi) => (
                              <label
                                key={opsi.id_opsi}
                                className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                              >
                                <input
                                  type="radio"
                                  name={soal.id_soal}
                                  checked={
                                    answers[soal.id_soal] === opsi.id_opsi
                                  }
                                  onChange={() =>
                                    handleAnswer(soal.id_soal, opsi.id_opsi)
                                  }
                                  className="mt-1"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-200">
                                  <b>{opsi.label}.</b> {opsi.isi_opsi}
                                </span>
                              </label>
                            ))}
                        </div>
                      ) : (
                        <textarea
                          value={answers[soal.id_soal] || ""}
                          onChange={(e) =>
                            handleAnswer(soal.id_soal, e.target.value)
                          }
                          className="mt-4 min-h-36 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          placeholder="Tulis jawaban essay..."
                        />
                      )}
                    </div>
                  )
                }
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTugas(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Batal
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Menyimpan..." : "Kumpulkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}