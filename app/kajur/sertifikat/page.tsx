"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle,
  Printer,
  Search,
  ShieldCheck,
  XCircle,
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
}

type PengumpulanKompetensi = {
  id_pengumpulan_kompetensi: string
  id_kompetensi_tugas: string
  id_siswa: string
  nilai: number
  status: string
  catatan_kajur: string | null
  selesai_at: string | null
  kompetensi_tugas?: {
    id_kompetensi_tugas: string
    judul: string
    kompetensi?: {
      id_kompetensi: string
      judul: string
      syarat_lulus: number
      jurusan?: {
        kode_jurusan: string
      }
    }
  }
  siswa?: {
    id_siswa: string
    nama_lengkap: string
    nisn: string | null
    nis: string | null
  }
}

type Sertifikat = {
  id_sertifikat: string
  id_siswa: string
  id_kompetensi: string
  nomor_sertifikat: string
}

export default function KajurSertifikatPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pengumpulanList, setPengumpulanList] = useState<
    PengumpulanKompetensi[]
  >([])
  const [sertifikatList, setSertifikatList] = useState<Sertifikat[]>([])
  const [search, setSearch] = useState("")

  const getData = async () => {
    try {
      const [pengumpulanData, sertifikatData] = await Promise.all([
        fetchAll(
          "pengumpulan_kompetensi",
          `
            id_pengumpulan_kompetensi,
            id_kompetensi_tugas,
            id_siswa,
            nilai,
            status,
            catatan_kajur,
            selesai_at,
            kompetensi_tugas:id_kompetensi_tugas (
              id_kompetensi_tugas,
              judul,
              kompetensi:id_kompetensi (
                id_kompetensi,
                judul,
                syarat_lulus,
                jurusan:id_jurusan (
                  kode_jurusan
                )
              )
            ),
            siswa:id_siswa (
              id_siswa,
              nama_lengkap,
              nisn,
              nis
            )
          `,
          "created_at",
          false
        ),

        fetchAll(
          "sertifikat",
          `
            id_sertifikat,
            id_siswa,
            id_kompetensi,
            nomor_sertifikat
          `
        ),
      ])

      setPengumpulanList((pengumpulanData || []) as PengumpulanKompetensi[])
      setSertifikatList((sertifikatData || []) as Sertifikat[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data sertifikat")
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

    return pengumpulanList
      .filter((item) => {
        return (
          item.status === "menunggu_acc" ||
          item.status === "lulus" ||
          item.status === "tidak_lulus"
        )
      })
      .filter((item) => {
        return (
          (item.siswa?.nama_lengkap || "").toLowerCase().includes(keyword) ||
          (item.siswa?.nisn || "").toLowerCase().includes(keyword) ||
          (item.siswa?.nis || "").toLowerCase().includes(keyword) ||
          (item.kompetensi_tugas?.kompetensi?.judul || "")
            .toLowerCase()
            .includes(keyword) ||
          (item.kompetensi_tugas?.judul || "").toLowerCase().includes(keyword)
        )
      })
  }, [pengumpulanList, search])

  const getSertifikat = (item: PengumpulanKompetensi) => {
    const idKompetensi = item.kompetensi_tugas?.kompetensi?.id_kompetensi
    if (!idKompetensi) return null

    return (
      sertifikatList.find(
        (s) =>
          s.id_siswa === item.id_siswa && s.id_kompetensi === idKompetensi
      ) || null
    )
  }

  const sudahAdaSertifikat = (item: PengumpulanKompetensi) => {
    return Boolean(getSertifikat(item))
  }

  const generateNomor = (kodeJurusan?: string) => {
    const tahun = new Date().getFullYear()
    const random = String(Date.now()).slice(-6)
    return `SK-${kodeJurusan || "KOMP"}-${tahun}-${random}`
  }

  const generateKodeVerifikasi = () => {
    return crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()
  }

  const handleAcc = async (item: PengumpulanKompetensi) => {
    const kompetensi = item.kompetensi_tugas?.kompetensi

    if (!kompetensi) {
      alert("Data kompetensi tidak ditemukan")
      return
    }

    if (Number(item.nilai || 0) < Number(kompetensi.syarat_lulus || 75)) {
      alert("Nilai belum memenuhi syarat lulus")
      return
    }

    if (sudahAdaSertifikat(item)) {
      alert("Sertifikat sudah pernah diterbitkan")
      return
    }

    const nomor = generateNomor(kompetensi.jurusan?.kode_jurusan)
    const kodeVerifikasi = generateKodeVerifikasi()

    const { error: updateError } = await supabase
      .from("pengumpulan_kompetensi")
      .update({
        status: "lulus",
        catatan_kajur: "Disetujui Kajur",
      })
      .eq("id_pengumpulan_kompetensi", item.id_pengumpulan_kompetensi)

    if (updateError) {
      alert(updateError.message)
      return
    }

    const { error: sertifikatError } = await supabase.from("sertifikat").insert({
  nomor_sertifikat: nomor,
  id_siswa: item.id_siswa,
  id_kompetensi: kompetensi.id_kompetensi,
  nilai: item.nilai,
  qr_code: kodeVerifikasi,
  kode_verifikasi: kodeVerifikasi,
  diterbitkan_oleh: profile?.id_profile || null,
  nama_kajur: profile?.nama_lengkap || "Kepala Jurusan",
  jabatan_kajur: "Kepala Program Keahlian PPLG",
  status: "aktif",
})

    if (sertifikatError) {
      alert(sertifikatError.message)
      return
    }

    await getData()
  }

  const handleTolak = async (item: PengumpulanKompetensi) => {
    const catatan = prompt("Catatan penolakan:", "Perlu perbaikan jawaban")

    if (catatan === null) return

    const { error } = await supabase
      .from("pengumpulan_kompetensi")
      .update({
        status: "tidak_lulus",
        catatan_kajur: catatan,
      })
      .eq("id_pengumpulan_kompetensi", item.id_pengumpulan_kompetensi)

    if (error) {
      alert(error.message)
      return
    }

    await getData()
  }

  const getStatusBadge = (item: PengumpulanKompetensi) => {
    const sert = getSertifikat(item)

    if (sert) {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Sertifikat Terbit
        </span>
      )
    }

    if (item.status === "lulus") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Lulus
        </span>
      )
    }

    if (item.status === "menunggu_acc") {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Menunggu ACC
        </span>
      )
    }

    if (item.status === "tidak_lulus") {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
          Tidak Lulus
        </span>
      )
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {item.status}
      </span>
    )
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Validasi Sertifikat"
      role="kajur"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Validasi Sertifikat Kompetensi
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          ACC siswa yang sudah menyelesaikan tugas kompetensi.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Menunggu ACC
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {
              pengumpulanList.filter((item) => item.status === "menunggu_acc")
                .length
            }
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">Lulus</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {pengumpulanList.filter((item) => item.status === "lulus").length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tidak Lulus
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {
              pengumpulanList.filter((item) => item.status === "tidak_lulus")
                .length
            }
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sertifikat
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {sertifikatList.length}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Data Validasi
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan {filteredData.length} data
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Cari siswa / kompetensi..."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-slate-700 dark:text-slate-200">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">Siswa</th>
                  <th className="p-4">Kompetensi</th>
                  <th className="p-4">Tugas</th>
                  <th className="p-4">Nilai</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredData.map((item, index) => {
                  const sert = getSertifikat(item)

                  return (
                    <tr
                      key={item.id_pengumpulan_kompetensi}
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                    >
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        {index + 1}
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.siswa?.nama_lengkap || "-"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.siswa?.nisn || item.siswa?.nis || "-"}
                        </p>
                      </td>

                      <td className="p-4">
                        {item.kompetensi_tugas?.kompetensi?.judul || "-"}
                      </td>

                      <td className="p-4">
                        {item.kompetensi_tugas?.judul || "-"}
                      </td>

                      <td className="p-4 font-semibold">{item.nilai || 0}</td>

                      <td className="p-4">{getStatusBadge(item)}</td>

                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {item.status === "menunggu_acc" && !sert && (
                            <>
                              <button
                                onClick={() => handleAcc(item)}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                              >
                                <CheckCircle size={14} />
                                ACC
                              </button>

                              <button
                                onClick={() => handleTolak(item)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                <XCircle size={14} />
                                Tolak
                              </button>
                            </>
                          )}

                          {item.status === "lulus" && !sert && (
                            <button
                              onClick={() => handleAcc(item)}
                              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                            >
                              <CheckCircle size={14} />
                              Terbitkan Sertifikat
                            </button>
                          )}

                          {sert && (
                            <>
                              <span className="inline-flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <ShieldCheck size={14} />
                                Sertifikat Terbit
                              </span>

                              <Link
                                href={`/kajur/sertifikat/print/${sert.id_sertifikat}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                <Printer size={14} />
                                Print
                              </Link>
                            </>
                          )}

                          {item.status === "tidak_lulus" && !sert && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Tidak ada aksi
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Belum ada data validasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}