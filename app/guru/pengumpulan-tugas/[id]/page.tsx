"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, Save, Search, X } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type Profile = {
  id_profile: string
  nama_lengkap: string
  id_guru: string | null
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  deskripsi: string | null
  deadline: string | null
  mengajar?: {
    id_mengajar: string
    id_guru: string
    id_kelas: string
    mapel?: { nama_mapel: string }
    kelas?: { nama_kelas: string }
  }
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
  aktif: boolean
  siswa?: Siswa
}

type Pengumpulan = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  catatan_guru: string | null
  status: string | null
  mulai_at: string | null
  selesai_at: string | null
  dinilai_at?: string | null
  id_guru_penilai?: string | null
  siswa?: Siswa
}

type Jawaban = {
  id_jawaban: string
  id_pengumpulan: string
  id_soal: string
  id_opsi: string | null
  jawaban_text: string | null
  is_benar: boolean
  nilai: number
  bank_soal?: {
    pertanyaan: string
    tipe_soal: "pg" | "essay"
    pembahasan: string | null
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

type Row = {
  siswa: Siswa
  pengumpulan: Pengumpulan | null
}

export default function GuruDetailPengumpulanTugasPage() {
  const router = useRouter()
  const params = useParams()
  const idTugas = String(params.id)

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [tugas, setTugas] = useState<Tugas | null>(null)
  const [siswaKelasList, setSiswaKelasList] = useState<SiswaKelas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>([])
  const [jawabanList, setJawabanList] = useState<Jawaban[]>([])

  const [search, setSearch] = useState("")
  const [selectedPengumpulan, setSelectedPengumpulan] =
    useState<Pengumpulan | null>(null)
  const [nilai, setNilai] = useState(0)
  const [catatan, setCatatan] = useState("")
  const [saving, setSaving] = useState(false)

  const getData = async (userProfile: Profile) => {
    try {
      if (!userProfile.id_guru) {
        router.replace("/guru/verifikasi-mengajar")
        return
      }

      const { data: tugasData, error: tugasError } = await supabase
        .from("tugas")
        .select(
          `
            id_tugas,
            id_mengajar,
            judul,
            deskripsi,
            deadline,
            mengajar:id_mengajar (
              id_mengajar,
              id_guru,
              id_kelas,
              mapel:id_mapel (
                nama_mapel
              ),
              kelas:id_kelas (
                nama_kelas
              )
            )
          `
        )
        .eq("id_tugas", idTugas)
        .maybeSingle()

      if (tugasError) {
        alert(tugasError.message)
        return
      }

      if (!tugasData) {
        alert("Tugas tidak ditemukan")
        router.replace("/guru/pengumpulan-tugas")
        return
      }

      if ((tugasData as any).mengajar?.id_guru !== userProfile.id_guru) {
        alert("Anda tidak berhak melihat tugas ini")
        router.replace("/guru/pengumpulan-tugas")
        return
      }

      const idKelas = (tugasData as any).mengajar?.id_kelas

      const [siswaKelasData, pengumpulanData, jawabanData] =
        await Promise.all([
          fetchAll(
            "siswa_kelas",
            `
              id_siswa,
              id_kelas,
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
            "pengumpulan_tugas",
            `
              id_pengumpulan,
              id_tugas,
              id_siswa,
              nilai,
              catatan_guru,
              status,
              mulai_at,
              selesai_at,
              dinilai_at,
              id_guru_penilai,
              siswa:id_siswa (
                id_siswa,
                nama_lengkap,
                nisn,
                nis
              )
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
              nilai,
              bank_soal:id_soal (
                pertanyaan,
                tipe_soal,
                pembahasan,
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

      const siswaKelas = (siswaKelasData || []).filter(
        (item: any) => item.id_kelas === idKelas && item.aktif === true
      )

      const pengumpulanTugas = (pengumpulanData || []).filter(
        (item: any) => item.id_tugas === idTugas
      )

      const pengumpulanIds = pengumpulanTugas.map(
        (item: any) => item.id_pengumpulan
      )

      const jawabanTugas = (jawabanData || []).filter((item: any) =>
        pengumpulanIds.includes(item.id_pengumpulan)
      )

      setTugas(tugasData as Tugas)
      setSiswaKelasList(siswaKelas as SiswaKelas[])
      setPengumpulanList(pengumpulanTugas as Pengumpulan[])
      setJawabanList(jawabanTugas as Jawaban[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil detail pengumpulan")
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
  }, [router, idTugas])

  const rows = useMemo<Row[]>(() => {
    return siswaKelasList
      .filter((item) => item.siswa)
      .map((item) => {
        const pengumpulan = pengumpulanList.find(
          (p) => p.id_siswa === item.id_siswa
        )

        return {
          siswa: item.siswa as Siswa,
          pengumpulan: pengumpulan || null,
        }
      })
  }, [siswaKelasList, pengumpulanList])

  const filteredRows = useMemo(() => {
    const keyword = search.toLowerCase()

    return rows.filter((item) => {
      return (
        item.siswa.nama_lengkap.toLowerCase().includes(keyword) ||
        (item.siswa.nisn || "").toLowerCase().includes(keyword) ||
        (item.siswa.nis || "").toLowerCase().includes(keyword) ||
        (item.pengumpulan?.status || "belum").toLowerCase().includes(keyword)
      )
    })
  }, [rows, search])

  const openDetail = (pengumpulan: Pengumpulan) => {
    setSelectedPengumpulan(pengumpulan)
    setNilai(Number(pengumpulan.nilai || 0))
    setCatatan(pengumpulan.catatan_guru || "")
  }

  const closeDetail = () => {
    setSelectedPengumpulan(null)
    setNilai(0)
    setCatatan("")
    setSaving(false)
  }

  const selectedJawaban = selectedPengumpulan
    ? jawabanList.filter(
        (item) => item.id_pengumpulan === selectedPengumpulan.id_pengumpulan
      )
    : []

  const handleSimpanNilai = async () => {
    if (!selectedPengumpulan) return

    setSaving(true)

    const payload: any = {
      nilai: Number(nilai),
      catatan_guru: catatan.trim() || null,
      status: "dinilai",
      dinilai_at: new Date().toISOString(),
    }

    if (profile?.id_guru) {
      payload.id_guru_penilai = profile.id_guru
    }

    const { error } = await supabase
      .from("pengumpulan_tugas")
      .update(payload)
      .eq("id_pengumpulan", selectedPengumpulan.id_pengumpulan)

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    closeDetail()

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

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        Belum
      </span>
    )
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Detail Pengumpulan"
      role="guru"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <Link
          href="/guru/pengumpulan-tugas"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Kembali
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {tugas?.judul}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tugas?.mengajar?.mapel?.nama_mapel || "-"} •{" "}
          {tugas?.mengajar?.kelas?.nama_kelas || "-"}
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Siswa
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {rows.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mengumpulkan
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {
              pengumpulanList.filter((item) =>
                ["selesai", "dinilai", "terlambat"].includes(item.status || "")
              ).length
            }
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Dinilai</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {
              pengumpulanList.filter(
                (item) => item.nilai !== null && item.nilai !== undefined
              ).length
            }
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Belum</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {rows.length -
              pengumpulanList.filter((item) =>
                ["selesai", "dinilai", "terlambat"].includes(item.status || "")
              ).length}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Daftar Siswa
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {filteredRows.length} siswa
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Cari siswa..."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">Nama</th>
                  <th className="p-4">NISN/NIS</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Nilai</th>
                  <th className="p-4">Selesai</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRows.map((item, index) => (
                  <tr
                    key={item.siswa.id_siswa}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {item.siswa.nama_lengkap}
                    </td>
                    <td className="p-4">
                      {item.siswa.nisn || item.siswa.nis || "-"}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(item.pengumpulan?.status)}
                    </td>
                    <td className="p-4">{item.pengumpulan?.nilai ?? "-"}</td>
                    <td className="p-4">
                      {item.pengumpulan?.selesai_at
                        ? new Date(
                            item.pengumpulan.selesai_at
                          ).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>
                    <td className="p-4 text-right">
                      {item.pengumpulan ? (
                        <button
                          onClick={() => openDetail(item.pengumpulan!)}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <Eye size={14} />
                          Lihat Jawaban
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          Belum mengerjakan
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data siswa tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPengumpulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Detail Jawaban
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedPengumpulan.siswa?.nama_lengkap || "-"}
                </p>
              </div>

              <button
                onClick={closeDetail}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedJawaban.map((jawaban, index) => {
                const opsiBenar = jawaban.bank_soal?.opsi_jawaban?.find(
                  (op) => op.is_benar
                )

                return (
                  <div
                    key={jawaban.id_jawaban}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <p className="font-semibold leading-7 text-slate-900 dark:text-white">
                      {index + 1}. {jawaban.bank_soal?.pertanyaan}
                    </p>

                    {jawaban.bank_soal?.tipe_soal === "pg" ? (
                      <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
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
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              Benar
                            </span>
                          ) : (
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              Salah
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {jawaban.jawaban_text || "-"}
                      </div>
                    )}

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Nilai soal: {jawaban.nilai || 0}
                    </p>
                  </div>
                )
              })}

              {selectedJawaban.length === 0 && (
                <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  Belum ada jawaban detail.
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[160px_1fr]">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nilai Akhir
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={nilai}
                  onChange={(e) => setNilai(Number(e.target.value))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Catatan Guru
                </label>
                <input
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  placeholder="Catatan opsional..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeDetail}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Tutup
              </button>

              <button
                onClick={handleSimpanNilai}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Menyimpan..." : "Simpan Nilai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}