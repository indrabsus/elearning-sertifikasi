"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Award,
  BookOpen,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Layers3,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"
import { fetchAll } from "@/lib/fetchAll"
import { protectPage } from "@/lib/protect"

type Profile = {
  id_profile: string
  nama_lengkap: string
  nama_role: string
}

type Guru = {
  id_guru: string
  nama_lengkap: string
}

type Siswa = {
  id_siswa: string
  nama_lengkap: string
  aktif: boolean
}

type Kelas = {
  id_kelas: string
  nama_kelas: string
  aktif: boolean
  jurusan?: {
    kode_jurusan: string
    nama_jurusan: string
  }
}

type Mengajar = {
  id_mengajar: string
  id_guru: string
  id_mapel: string
  id_kelas: string
  aktif: boolean
  guru?: {
    nama_lengkap: string
  }
  mapel?: {
    nama_mapel: string
  }
  kelas?: {
    nama_kelas: string
  }
}

type Kompetensi = {
  id_kompetensi: string
  judul: string
  aktif: boolean
  jurusan?: {
    kode_jurusan: string
  }
}

type KompetensiTugas = {
  id_kompetensi_tugas: string
  id_kompetensi: string
  judul: string
  status: string
}

type PengumpulanKompetensi = {
  id_pengumpulan_kompetensi: string
  id_kompetensi_tugas: string
  id_siswa: string
  nilai: number | null
  status: string
  kompetensi_tugas?: {
    id_kompetensi_tugas: string
    id_kompetensi: string
    judul: string
    kompetensi?: {
      id_kompetensi: string
      judul: string
    }
  }
}

type Sertifikat = {
  id_sertifikat: string
  id_siswa: string
  id_kompetensi: string
  nilai: number | null
  status: string | null
  kompetensi?: {
    judul: string
  }
}

export default function KajurDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [guruList, setGuruList] = useState<Guru[]>([])
  const [siswaList, setSiswaList] = useState<Siswa[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [kompetensiList, setKompetensiList] = useState<Kompetensi[]>([])
  const [kompetensiTugasList, setKompetensiTugasList] = useState<
    KompetensiTugas[]
  >([])
  const [pengumpulanList, setPengumpulanList] = useState<
    PengumpulanKompetensi[]
  >([])
  const [sertifikatList, setSertifikatList] = useState<Sertifikat[]>([])

  const [errorMsg, setErrorMsg] = useState("")

  const getData = async () => {
    try {
      setErrorMsg("")

      const [
        guruData,
        siswaData,
        kelasData,
        mengajarData,
        kompetensiData,
        kompetensiTugasData,
        pengumpulanData,
        sertifikatData,
      ] = await Promise.all([
        fetchAll("guru", "id_guru, nama_lengkap", "nama_lengkap"),

        fetchAll("siswa", "id_siswa, nama_lengkap, aktif", "nama_lengkap"),

        fetchAll(
          "kelas",
          `
            id_kelas,
            nama_kelas,
            aktif,
            jurusan:id_jurusan (
              kode_jurusan,
              nama_jurusan
            )
          `,
          "nama_kelas"
        ),

        fetchAll(
          "mengajar",
          `
            id_mengajar,
            id_guru,
            id_mapel,
            id_kelas,
            aktif,
            guru:id_guru (
              nama_lengkap
            ),
            mapel:id_mapel (
              nama_mapel
            ),
            kelas:id_kelas (
              nama_kelas
            )
          `
        ),

        fetchAll(
          "kompetensi",
          `
            id_kompetensi,
            judul,
            aktif,
            jurusan:id_jurusan (
              kode_jurusan
            )
          `,
          "urutan"
        ),

        fetchAll(
          "kompetensi_tugas",
          `
            id_kompetensi_tugas,
            id_kompetensi,
            judul,
            status
          `
        ),

        fetchAll(
          "pengumpulan_kompetensi",
          `
            id_pengumpulan_kompetensi,
            id_kompetensi_tugas,
            id_siswa,
            nilai,
            status,
            kompetensi_tugas:id_kompetensi_tugas (
              id_kompetensi_tugas,
              id_kompetensi,
              judul,
              kompetensi:id_kompetensi (
                id_kompetensi,
                judul
              )
            )
          `
        ),

        fetchAll(
          "sertifikat",
          `
            id_sertifikat,
            id_siswa,
            id_kompetensi,
            nilai,
            status,
            kompetensi:id_kompetensi (
              judul
            )
          `
        ),
      ])

      setGuruList((guruData || []) as Guru[])
      setSiswaList((siswaData || []) as Siswa[])
      setKelasList((kelasData || []) as Kelas[])
      setMengajarList((mengajarData || []) as Mengajar[])
      setKompetensiList((kompetensiData || []) as Kompetensi[])
      setKompetensiTugasList((kompetensiTugasData || []) as KompetensiTugas[])
      setPengumpulanList((pengumpulanData || []) as PengumpulanKompetensi[])
      setSertifikatList((sertifikatData || []) as Sertifikat[])
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengambil data dashboard kajur")
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

  const siswaAktif = useMemo(() => {
    return siswaList.filter((item) => item.aktif !== false).length
  }, [siswaList])

  const kelasAktif = useMemo(() => {
    return kelasList.filter((item) => item.aktif !== false).length
  }, [kelasList])

  const kompetensiAktif = useMemo(() => {
    return kompetensiList.filter((item) => item.aktif !== false).length
  }, [kompetensiList])

  const menungguAcc = useMemo(() => {
    return pengumpulanList.filter((item) => item.status === "menunggu_acc")
      .length
  }, [pengumpulanList])

  const sertifikatAktif = useMemo(() => {
    return sertifikatList.filter((item) => item.status !== "dicabut").length
  }, [sertifikatList])

  const rataNilaiSertifikat = useMemo(() => {
    const nilai = sertifikatList
      .filter((item) => item.status !== "dicabut")
      .map((item) => Number(item.nilai || 0))
      .filter((item) => item > 0)

    if (nilai.length === 0) return 0

    return Math.round(
      nilai.reduce((total, item) => total + item, 0) / nilai.length
    )
  }, [sertifikatList])

  const chartStatusKompetensi = useMemo(() => {
    const statusMap: Record<string, number> = {
      belum: 0,
      dikerjakan: 0,
      selesai: 0,
      menunggu_acc: 0,
      lulus: 0,
      tidak_lulus: 0,
    }

    pengumpulanList.forEach((item) => {
      statusMap[item.status] = (statusMap[item.status] || 0) + 1
    })

    return Object.entries(statusMap)
      .filter(([, total]) => total > 0)
      .map(([status, total]) => ({
        status:
          status === "menunggu_acc"
            ? "Menunggu ACC"
            : status.replace("_", " "),
        total,
      }))
  }, [pengumpulanList])

  const chartSertifikatKompetensi = useMemo(() => {
    const map: Record<string, number> = {}

    sertifikatList
      .filter((item) => item.status !== "dicabut")
      .forEach((item) => {
        const nama = item.kompetensi?.judul || "Tanpa Kompetensi"
        map[nama] = (map[nama] || 0) + 1
      })

    return Object.entries(map)
      .map(([nama, total]) => ({
        nama,
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [sertifikatList])

  const monitoringGuru = useMemo(() => {
    return guruList
      .map((guru) => {
        const mengajarGuru = mengajarList.filter(
          (item) => item.id_guru === guru.id_guru && item.aktif !== false
        )

        return {
          id_guru: guru.id_guru,
          nama: guru.nama_lengkap,
          totalMengajar: mengajarGuru.length,
          mapel: new Set(mengajarGuru.map((item) => item.id_mapel)).size,
          kelas: new Set(mengajarGuru.map((item) => item.id_kelas)).size,
        }
      })
      .sort((a, b) => b.totalMengajar - a.totalMengajar)
      .slice(0, 8)
  }, [guruList, mengajarList])

  const recentKompetensi = useMemo(() => {
    return kompetensiList.slice(0, 6)
  }, [kompetensiList])

  const stats = [
    {
      title: "Guru Produktif",
      value: guruList.length,
      icon: GraduationCap,
      bg: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      title: "Siswa Aktif",
      value: siswaAktif,
      icon: Users,
      bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      title: "Kelas",
      value: kelasAktif,
      icon: School,
      bg: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      title: "Kompetensi",
      value: kompetensiAktif,
      icon: Layers3,
      bg: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      title: "Menunggu ACC",
      value: menungguAcc,
      icon: ShieldCheck,
      bg: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      title: "Sertifikat",
      value: sertifikatAktif,
      icon: Award,
      bg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
    },
  ]

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Dashboard Kajur"
      role="kajur"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-blue-900/20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-blue-50">
              <Sparkles size={16} />
              Dashboard Monitoring Jurusan
            </div>

            <h1 className="text-2xl font-bold">
              Selamat datang, {profile?.nama_lengkap || "Kajur"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Pantau guru, kelas, kompetensi, tugas sertifikasi, validasi, dan
              sertifikat siswa dalam satu dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm backdrop-blur">
            <p className="text-blue-100">Rata-rata Nilai Sertifikat</p>
            <p className="text-3xl font-bold">{rataNilaiSertifikat}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.title}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">{item.value}</h2>
                </div>

                <div className={`rounded-2xl p-3 ${item.bg}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Status Kompetensi Siswa</h2>
            <p className="text-sm text-slate-500">
              Rekap status pengerjaan kompetensi.
            </p>
          </div>

          <div className="h-80">
            {chartStatusKompetensi.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Pie
                    data={chartStatusKompetensi}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {chartStatusKompetensi.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          [
                            "#2563eb",
                            "#7c3aed",
                            "#059669",
                            "#f59e0b",
                            "#e11d48",
                            "#0891b2",
                          ][index % 6]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada data kompetensi siswa.
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chartStatusKompetensi.map((item, index) => (
              <span
                key={item.status}
                className="rounded-full px-3 py-1 text-xs font-medium text-white capitalize"
                style={{
                  backgroundColor: [
                    "#2563eb",
                    "#7c3aed",
                    "#059669",
                    "#f59e0b",
                    "#e11d48",
                    "#0891b2",
                  ][index % 6],
                }}
              >
                {item.status}: {item.total}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Sertifikat per Kompetensi</h2>
            <p className="text-sm text-slate-500">
              Kompetensi yang paling banyak diterbitkan.
            </p>
          </div>

          <div className="h-80">
            {chartSertifikatKompetensi.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSertifikatKompetensi}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="nama"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar dataKey="total" fill="#2563eb" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada sertifikat terbit.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Monitoring Guru Produktif</h2>
            <p className="text-sm text-slate-500">
              Ringkasan pembagian mengajar guru.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Guru</th>
                  <th className="px-4 py-3">Mapel</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Mengajar</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {monitoringGuru.map((item, index) => (
                  <tr key={item.id_guru}>
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{item.nama}</td>
                    <td className="px-4 py-3">{item.mapel}</td>
                    <td className="px-4 py-3">{item.kelas}</td>
                    <td className="px-4 py-3">{item.totalMengajar}</td>
                  </tr>
                ))}

                {monitoringGuru.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Belum ada data guru mengajar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Akses Cepat</h2>

          <div className="grid gap-3">
            <Link
              href="/kajur/kompetensi"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <Layers3 className="mb-2 text-blue-600" size={22} />
              <p className="font-medium">Kompetensi</p>
              <p className="text-xs text-slate-500">Kelola kompetensi jurusan</p>
            </Link>

            <Link
              href="/kajur/sertifikat"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <Award className="mb-2 text-emerald-600" size={22} />
              <p className="font-medium">Validasi Sertifikat</p>
              <p className="text-xs text-slate-500">ACC kompetensi siswa</p>
            </Link>

            <Link
              href="/guru/bank-soal"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-amber-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <BookOpen className="mb-2 text-amber-600" size={22} />
              <p className="font-medium">Bank Soal</p>
              <p className="text-xs text-slate-500">Lihat soal kompetensi</p>
            </Link>

            <Link
              href="/kajur/laporan"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-violet-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <FileCheck className="mb-2 text-violet-600" size={22} />
              <p className="font-medium">Laporan Jurusan</p>
              <p className="text-xs text-slate-500">Rekap capaian kompetensi</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5">
          <h2 className="font-semibold">Kompetensi Terbaru</h2>
          <p className="text-sm text-slate-500">
            Daftar kompetensi aktif yang tersedia.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recentKompetensi.map((item) => (
            <div
              key={item.id_kompetensi}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <p className="font-semibold">{item.judul}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.jurusan?.kode_jurusan || "-"} •{" "}
                {item.aktif ? "Aktif" : "Nonaktif"}
              </p>
            </div>
          ))}

          {recentKompetensi.length === 0 && (
            <div className="rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">
              Belum ada kompetensi.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}