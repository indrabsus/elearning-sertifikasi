"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"
import PageLoader from "@/components/ui/PageLoader"

type Profile = {
  id_profile: string
  nama_lengkap: string
  nama_role: string
  id_guru: string | null
}

type TahunAjaranStorage = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
}

type Mapel = {
  id_mapel: string
  nama_mapel: string
}

type Kelas = {
  id_kelas: string
  nama_kelas: string
  tingkat: number
  aktif: boolean
  id_tahun_ajaran: string
  jurusan?: {
    kode_jurusan: string
    nama_jurusan: string
  }
}

type PilihanMengajar = {
  id: string
  id_mapel: string
  id_kelas: string
}

export default function GuruVerifikasiMengajarPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranStorage | null>(
    null
  )

  const [mapelList, setMapelList] = useState<Mapel[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])

  const [pilihan, setPilihan] = useState<PilihanMengajar[]>([
    {
      id: crypto.randomUUID(),
      id_mapel: "",
      id_kelas: "",
    },
  ])

  const [errorMsg, setErrorMsg] = useState("")

  const getData = async (userProfile: Profile) => {
    try {
      const tahunRaw = localStorage.getItem("tahun_ajaran")
      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")

      if (!idTahunAjaran) {
        setErrorMsg("Tahun ajaran belum dipilih. Silakan login ulang.")
        setLoading(false)
        return
      }

      if (!userProfile.id_guru) {
        setErrorMsg("Data guru belum terhubung ke akun ini.")
        setLoading(false)
        return
      }

      if (tahunRaw) {
        setTahunAjaran(JSON.parse(tahunRaw))
      } else {
        setTahunAjaran({
          id_tahun_ajaran: idTahunAjaran,
          nama_tahun_ajaran: "",
          semester: "",
        })
      }

      const [mapelData, kelasData, mengajarData] = await Promise.all([
        fetchAll("mapel", "id_mapel, nama_mapel", "nama_mapel"),

        fetchAll(
          "kelas",
          `
            id_kelas,
            nama_kelas,
            tingkat,
            aktif,
            id_tahun_ajaran,
            jurusan:id_jurusan (
              kode_jurusan,
              nama_jurusan
            )
          `,
          "nama_kelas"
        ),

        fetchAll(
          "mengajar",
          "id_mengajar, id_guru, id_mapel, id_kelas, id_tahun_ajaran, aktif"
        ),
      ])

      const kelasTahunIni = (kelasData || []).filter(
        (item: any) =>
          item.id_tahun_ajaran === idTahunAjaran && item.aktif === true
      )

      const existingMengajar = (mengajarData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      if (existingMengajar.length > 0) {
        router.replace("/guru/dashboard")
        return
      }

      setMapelList((mapelData || []) as Mapel[])
      setKelasList(kelasTahunIni as Kelas[])
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengambil data")
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

  const tambahBaris = () => {
    setPilihan((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        id_mapel: "",
        id_kelas: "",
      },
    ])
  }

  const hapusBaris = (id: string) => {
    setPilihan((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((item) => item.id !== id)
    })
  }

  const updatePilihan = (
    id: string,
    field: "id_mapel" | "id_kelas",
    value: string
  ) => {
    setPilihan((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  const pilihanValid = useMemo(() => {
    return pilihan.filter((item) => item.id_mapel && item.id_kelas)
  }, [pilihan])

  const adaDuplikat = useMemo(() => {
    const keys = pilihanValid.map((item) => `${item.id_mapel}-${item.id_kelas}`)
    return new Set(keys).size !== keys.length
  }, [pilihanValid])

  const handleSimpan = async () => {
    setErrorMsg("")

    const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")

    if (!profile?.id_guru) {
      setErrorMsg("Data guru tidak ditemukan.")
      return
    }

    if (!idTahunAjaran) {
      setErrorMsg("Tahun ajaran belum dipilih. Silakan login ulang.")
      return
    }

    if (pilihanValid.length === 0) {
      setErrorMsg("Pilih minimal satu mapel dan kelas.")
      return
    }

    if (adaDuplikat) {
      setErrorMsg("Ada pilihan mapel dan kelas yang duplikat.")
      return
    }

    setSaving(true)

    const payload = pilihanValid.map((item) => ({
      id_guru: profile.id_guru,
      id_mapel: item.id_mapel,
      id_kelas: item.id_kelas,
      id_tahun_ajaran: idTahunAjaran,
      aktif: true,
    }))

    const { error } = await supabase.from("mengajar").upsert(payload, {
      onConflict: "id_guru,id_mapel,id_kelas,id_tahun_ajaran",
    })

    if (error) {
      setErrorMsg(error.message)
      setSaving(false)
      return
    }

    router.replace("/guru/dashboard")
  }

  if (loading) return <PageLoader />

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-blue-900/20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-blue-50">
                <BookOpen size={16} />
                Verifikasi Pembagian Mengajar
              </div>

              <h1 className="text-2xl font-bold">
                Halo, {profile?.nama_lengkap || "Guru"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Sebelum masuk dashboard, pilih mapel dan kelas yang Anda ajar
                pada tahun ajaran aktif.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <p className="text-blue-100">Tahun Ajaran</p>
              <p className="font-semibold">
                {tahunAjaran?.nama_tahun_ajaran || "-"}{" "}
                {tahunAjaran?.semester ? `- ${tahunAjaran.semester}` : ""}
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold">Pilih Pembagian Mengajar</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Bisa tambah beberapa baris sekaligus.
              </p>
            </div>

            <button
              type="button"
              onClick={tambahBaris}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Plus size={18} />
              Tambah Baris
            </button>
          </div>

          <div className="space-y-3">
            {pilihan.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[60px_1fr_1fr_48px]"
              >
                <div className="flex items-center">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {index + 1}
                  </span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Mapel
                  </label>
                  <select
                    value={item.id_mapel}
                    onChange={(e) =>
                      updatePilihan(item.id, "id_mapel", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Pilih mapel</option>
                    {mapelList.map((mapel) => (
                      <option key={mapel.id_mapel} value={mapel.id_mapel}>
                        {mapel.nama_mapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Kelas
                  </label>
                  <select
                    value={item.id_kelas}
                    onChange={(e) =>
                      updatePilihan(item.id, "id_kelas", e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Pilih kelas</option>
                    {kelasList.map((kelas) => (
                      <option key={kelas.id_kelas} value={kelas.id_kelas}>
                        {kelas.nama_kelas}
                        {kelas.jurusan?.kode_jurusan
                          ? ` - ${kelas.jurusan.kode_jurusan}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => hapusBaris(item.id)}
                    disabled={pilihan.length === 1}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <div className="flex gap-3">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Catatan</p>
                <p className="mt-1">
                  Data ini bisa diubah lagi oleh admin/kajur/kurikulum jika ada
                  kesalahan pembagian mengajar.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-end gap-3 md:flex-row">
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Kembali
            </button>

            <button
              type="button"
              onClick={handleSimpan}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Simpan & Masuk Dashboard
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}