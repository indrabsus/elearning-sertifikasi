"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Eye,
  Save,
  Search,
  X,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"
import LinkifyText from "@/components/LinkifyText"

type Profile = {
  id_profile: string
  nama_lengkap: string
}

type Pengumpulan = {
  id_pengumpulan_kompetensi: string
  id_kompetensi_tugas: string
  id_siswa: string
  nilai: number | null
  status: string
  catatan_kajur: string | null
  mulai_at: string | null
  selesai_at: string | null
  siswa?: {
    nama_lengkap: string
    nisn: string | null
  }
  kompetensi_tugas?: {
    judul: string
    id_kompetensi: string
    kompetensi?: {
      judul: string
      syarat_lulus: number | null
    }
  }
}

type Jawaban = {
  id_jawaban_kompetensi: string
  id_pengumpulan_kompetensi: string
  id_soal: string
  id_opsi: string | null
  jawaban_text: string | null
  is_benar: boolean
  nilai: number | null
  bank_soal?: {
    pertanyaan: string
    tipe_soal: "pg" | "essay"
    opsi_jawaban?: {
      id_opsi: string
      label: string
      isi_opsi: string
      is_benar: boolean
    }[]
  }
  opsi_jawaban?: {
    label: string
    isi_opsi: string
  }
}

export default function KajurValidasiPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>([])
  const [jawabanList, setJawabanList] = useState<Jawaban[]>([])

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [selected, setSelected] = useState<Pengumpulan | null>(null)
  const [nilaiEssay, setNilaiEssay] = useState<Record<string, number>>({})
  const [catatan, setCatatan] = useState("")
  const [saving, setSaving] = useState(false)

  const getData = async () => {
    try {
      const [pengumpulanData, jawabanData] = await Promise.all([
        fetchAll(
          "pengumpulan_kompetensi",
          `
            id_pengumpulan_kompetensi,
            id_kompetensi_tugas,
            id_siswa,
            nilai,
            status,
            catatan_kajur,
            mulai_at,
            selesai_at,
            siswa:id_siswa (
              nama_lengkap,
              nisn
            ),
            kompetensi_tugas:id_kompetensi_tugas (
              judul,
              id_kompetensi,
              kompetensi:id_kompetensi (
                judul,
                syarat_lulus
              )
            )
          `,
          "selesai_at",
          false
        ),

        fetchAll(
          "jawaban_kompetensi_siswa",
          `
            id_jawaban_kompetensi,
            id_pengumpulan_kompetensi,
            id_soal,
            id_opsi,
            jawaban_text,
            is_benar,
            nilai,
            bank_soal:id_soal (
              pertanyaan,
              tipe_soal,
              opsi_jawaban (
                id_opsi,
                label,
                isi_opsi,
                is_benar
              )
            ),
            opsi_jawaban:id_opsi (
              label,
              isi_opsi
            )
          `
        ),
      ])

      setPengumpulanList((pengumpulanData || []) as Pengumpulan[])
      setJawabanList((jawabanData || []) as Jawaban[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data validasi")
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

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase()

    return pengumpulanList.filter((item) => {
      const matchSearch =
        (item.siswa?.nama_lengkap || "").toLowerCase().includes(keyword) ||
        (item.siswa?.nisn || "").toLowerCase().includes(keyword) ||
        (item.kompetensi_tugas?.judul || "").toLowerCase().includes(keyword) ||
        (item.kompetensi_tugas?.kompetensi?.judul || "")
          .toLowerCase()
          .includes(keyword)

      const matchStatus = filterStatus ? item.status === filterStatus : true

      return matchSearch && matchStatus
    })
  }, [pengumpulanList, search, filterStatus])

  const selectedJawaban = selected
    ? jawabanList.filter(
        (item) =>
          item.id_pengumpulan_kompetensi === selected.id_pengumpulan_kompetensi
      )
    : []

  const openDetail = (item: Pengumpulan) => {
    const jawaban = jawabanList.filter(
      (j) => j.id_pengumpulan_kompetensi === item.id_pengumpulan_kompetensi
    )

    const essayMap: Record<string, number> = {}

    jawaban.forEach((j) => {
      if (j.bank_soal?.tipe_soal === "essay") {
        essayMap[j.id_jawaban_kompetensi] = Number(j.nilai || 0)
      }
    })

    setSelected(item)
    setNilaiEssay(essayMap)
    setCatatan(item.catatan_kajur || "")
  }

  const closeDetail = () => {
    setSelected(null)
    setNilaiEssay({})
    setCatatan("")
    setSaving(false)
  }

  const hitungNilaiAkhir = () => {
    if (selectedJawaban.length === 0) return 0

    const totalNilai = selectedJawaban.reduce((sum, item) => {
      if (item.bank_soal?.tipe_soal === "pg") {
        return sum + (item.is_benar ? 100 : 0)
      }

      return sum + Number(nilaiEssay[item.id_jawaban_kompetensi] || 0)
    }, 0)

    return Math.round(totalNilai / selectedJawaban.length)
  }

  const handleChangeEssay = (idJawaban: string, value: number) => {
    const safeValue = Math.max(0, Math.min(100, Number(value || 0)))

    setNilaiEssay((prev) => ({
      ...prev,
      [idJawaban]: safeValue,
    }))
  }

  const handleSimpanValidasi = async (statusBaru: "dinilai" | "lulus" | "tidak_lulus") => {
    if (!selected) return

    setSaving(true)

    const nilaiAkhir = hitungNilaiAkhir()

    for (const jawaban of selectedJawaban) {
      const nilaiSoal =
        jawaban.bank_soal?.tipe_soal === "pg"
          ? jawaban.is_benar
            ? 100
            : 0
          : Number(nilaiEssay[jawaban.id_jawaban_kompetensi] || 0)

      const { error } = await supabase
        .from("jawaban_kompetensi_siswa")
        .update({ nilai: nilaiSoal })
        .eq("id_jawaban_kompetensi", jawaban.id_jawaban_kompetensi)

      if (error) {
        alert(error.message)
        setSaving(false)
        return
      }
    }

    const syarat = Number(
      selected.kompetensi_tugas?.kompetensi?.syarat_lulus || 75
    )

    const finalStatus =
      statusBaru === "lulus"
        ? nilaiAkhir >= syarat
          ? "lulus"
          : "tidak_lulus"
        : statusBaru

    const { error } = await supabase
      .from("pengumpulan_kompetensi")
      .update({
        nilai: nilaiAkhir,
        status: finalStatus,
        catatan_kajur: catatan.trim() || null,
      })
      .eq("id_pengumpulan_kompetensi", selected.id_pengumpulan_kompetensi)

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    closeDetail()
    await getData()
  }

  const getStatusBadge = (status: string) => {
    if (status === "lulus") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Lulus
        </span>
      )
    }

    if (status === "tidak_lulus") {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
          Tidak Lulus
        </span>
      )
    }

    if (status === "selesai") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Menunggu Validasi
        </span>
      )
    }

    if (status === "menunggu_acc") {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Menunggu ACC
        </span>
      )
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {status}
      </span>
    )
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Validasi Kompetensi"
      role="kajur"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Validasi Kompetensi
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Validasi jawaban siswa, input nilai essay, dan ACC kelulusan kompetensi.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <InfoCard title="Total Pengumpulan" value={String(pengumpulanList.length)} />
        <InfoCard
          title="Menunggu"
          value={String(
            pengumpulanList.filter((item) =>
              ["selesai", "menunggu_acc"].includes(item.status)
            ).length
          )}
        />
        <InfoCard
          title="Lulus"
          value={String(pengumpulanList.filter((item) => item.status === "lulus").length)}
        />
        <InfoCard
          title="Tidak Lulus"
          value={String(
            pengumpulanList.filter((item) => item.status === "tidak_lulus").length
          )}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Data Pengumpulan Kompetensi
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {filteredData.length} data
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Semua Status</option>
              <option value="selesai">Menunggu Validasi</option>
              <option value="menunggu_acc">Menunggu ACC</option>
              <option value="lulus">Lulus</option>
              <option value="tidak_lulus">Tidak Lulus</option>
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
                placeholder="Cari siswa / kompetensi..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">Siswa</th>
                  <th className="p-4">Kompetensi</th>
                  <th className="p-4">Tugas</th>
                  <th className="p-4">Nilai</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredData.map((item) => (
                  <tr
                    key={item.id_pengumpulan_kompetensi}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.siswa?.nama_lengkap || "-"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.siswa?.nisn || "-"}
                      </p>
                    </td>

                    <td className="p-4">
                      {item.kompetensi_tugas?.kompetensi?.judul || "-"}
                    </td>

                    <td className="p-4">{item.kompetensi_tugas?.judul || "-"}</td>

                    <td className="p-4 font-bold">{item.nilai ?? "-"}</td>

                    <td className="p-4">{getStatusBadge(item.status)}</td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => openDetail(item)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Eye size={14} />
                        Validasi
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Belum ada pengumpulan kompetensi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Detail Validasi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selected.siswa?.nama_lengkap || "-"} •{" "}
                  {selected.kompetensi_tugas?.judul || "-"}
                </p>
              </div>

              <button
                onClick={closeDetail}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Nilai akhir: rata-rata semua soal. PG benar = 100, salah = 0.
                Essay dinilai manual.
              </p>
              <h3 className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">
                Nilai Akhir: {hitungNilaiAkhir()}
              </h3>
            </div>

            <div className="space-y-4">
              {selectedJawaban.map((jawaban, index) => {
                const isPg = jawaban.bank_soal?.tipe_soal === "pg"
                const opsiBenar = jawaban.bank_soal?.opsi_jawaban?.find(
                  (op) => op.is_benar
                )

                const nilaiSoal = isPg
                  ? jawaban.is_benar
                    ? 100
                    : 0
                  : Number(nilaiEssay[jawaban.id_jawaban_kompetensi] || 0)

                return (
                  <div
                    key={jawaban.id_jawaban_kompetensi}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">
                        No. {index + 1}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {jawaban.bank_soal?.tipe_soal?.toUpperCase()}
                      </span>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                        Nilai {nilaiSoal}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 dark:text-white">
                      {jawaban.bank_soal?.pertanyaan}
                    </p>

                    {isPg ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <p>
                          Jawaban siswa:{" "}
                          <b>
                            {jawaban.opsi_jawaban?.label || "-"}.
                            {jawaban.opsi_jawaban?.isi_opsi || ""}
                          </b>
                        </p>
                        <p>
                          Jawaban benar:{" "}
                          <b>
                            {opsiBenar?.label || "-"}.
                            {opsiBenar?.isi_opsi || ""}
                          </b>
                        </p>
                        <p>
                          Status:{" "}
                          {jawaban.is_benar ? (
                            <span className="font-semibold text-green-600">
                              Benar
                            </span>
                          ) : (
                            <span className="font-semibold text-red-600">
                              Salah
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="rounded-xl bg-slate-50 p-4 text-sm leading-7 dark:bg-slate-800">
                          <LinkifyText text={jawaban.jawaban_text} />
                        </div>

                        <div className="mt-3 max-w-xs">
                          <label className="text-sm font-medium">
                            Nilai Essay Per Soal
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={nilaiSoal}
                            onChange={(e) =>
                              handleChangeEssay(
                                jawaban.id_jawaban_kompetensi,
                                Number(e.target.value)
                              )
                            }
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {selectedJawaban.length === 0 && (
                <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
                  Tidak ada jawaban.
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium">Catatan Kajur</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                placeholder="Catatan validasi..."
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                onClick={closeDetail}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
              >
                Tutup
              </button>

              <button
                onClick={() => handleSimpanValidasi("dinilai")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={16} />
                Simpan Nilai
              </button>

              <button
                onClick={() => handleSimpanValidasi("tidak_lulus")}
                disabled={saving}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Tidak Lulus
              </button>

              <button
                onClick={() => handleSimpanValidasi("lulus")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <CheckCircle size={16} />
                ACC Lulus
              </button>
            </div>
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