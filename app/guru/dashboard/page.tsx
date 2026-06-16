"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Layers3,
  School,
  Sparkles,
  Trophy,
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
import { protectPage } from "@/lib/protect"
import { fetchAll } from "@/lib/fetchAll"

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
  kelas?: {
    nama_kelas: string
    tingkat: number
    jurusan?: {
      kode_jurusan: string
      nama_jurusan: string
    }
  }
}

type SiswaKelas = {
  id_siswa_kelas: string
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
}

type Materi = {
  id_materi: string
  id_mengajar: string
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
}

type PengumpulanTugas = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  status: string | null
}

export default function GuruDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranStorage | null>(
    null
  )

  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [siswaKelasList, setSiswaKelasList] = useState<SiswaKelas[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  const getDashboardData = async (userProfile: Profile) => {
    try {
      setErrorMsg("")

      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")
      const tahunRaw = localStorage.getItem("tahun_ajaran")

      if (!idTahunAjaran) {
        router.replace("/login")
        return
      }

      if (!userProfile.id_guru) {
        router.replace("/guru/verifikasi-mengajar")
        return
      }

      if (tahunRaw) {
        try {
          setTahunAjaran(JSON.parse(tahunRaw))
        } catch {
          setTahunAjaran(null)
        }
      }

      const mengajarData = await fetchAll(
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
            nama_kelas,
            tingkat,
            jurusan:id_jurusan (
              kode_jurusan,
              nama_jurusan
            )
          )
        `
      )

      const mengajarGuru = (mengajarData || []).filter(
        (item: any) =>
          item.id_guru === userProfile.id_guru &&
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true
      )

      if (mengajarGuru.length === 0) {
        router.replace("/guru/verifikasi-mengajar")
        return
      }

      const mengajarIds = mengajarGuru.map((item: any) => item.id_mengajar)

      const kelasIds = [
        ...new Set(mengajarGuru.map((item: any) => item.id_kelas)),
      ]

      const [siswaKelasData, materiData, tugasData, pengumpulanData] =
        await Promise.all([
          fetchAll(
            "siswa_kelas",
            "id_siswa_kelas, id_siswa, id_kelas, id_tahun_ajaran, aktif"
          ),

          fetchAll("materi", "id_materi, id_mengajar"),

          fetchAll("tugas", "id_tugas, id_mengajar"),

          fetchAll(
            "pengumpulan_tugas",
            "id_pengumpulan, id_tugas, id_siswa, nilai, status"
          ),
        ])

      const siswaKelasGuru = (siswaKelasData || []).filter(
        (item: any) =>
          item.id_tahun_ajaran === idTahunAjaran &&
          item.aktif === true &&
          kelasIds.includes(item.id_kelas)
      )

      const materiGuru = (materiData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasGuru = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugasGuru.map((item: any) => item.id_tugas)

      const pengumpulanGuru = (pengumpulanData || []).filter((item: any) =>
        tugasIds.includes(item.id_tugas)
      )

      setMengajarList(mengajarGuru as Mengajar[])
      setSiswaKelasList(siswaKelasGuru as SiswaKelas[])
      setMateriList(materiGuru as Materi[])
      setTugasList(tugasGuru as Tugas[])
      setPengumpulanList(pengumpulanGuru as PengumpulanTugas[])
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengambil data dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["guru"], router)

      if (!userProfile) return

      setProfile(userProfile as Profile)
      await getDashboardData(userProfile as Profile)
    }

    check()
  }, [router])

  const totalKelas = useMemo(() => {
    return new Set(mengajarList.map((item) => item.id_kelas)).size
  }, [mengajarList])

  const totalMapel = useMemo(() => {
    return new Set(mengajarList.map((item) => item.id_mapel)).size
  }, [mengajarList])

  const totalSiswa = useMemo(() => {
    return new Set(siswaKelasList.map((item) => item.id_siswa)).size
  }, [siswaKelasList])

  const totalDinilai = useMemo(() => {
    return pengumpulanList.filter(
      (item) => item.nilai !== null && item.nilai !== undefined
    ).length
  }, [pengumpulanList])

  const chartMapel = useMemo(() => {
    const map: Record<string, number> = {}

    mengajarList.forEach((item) => {
      const nama = item.mapel?.nama_mapel || "Tanpa Mapel"
      map[nama] = (map[nama] || 0) + 1
    })

    return Object.entries(map).map(([nama, total]) => ({
      nama,
      total,
    }))
  }, [mengajarList])

  const chartKelas = useMemo(() => {
    return mengajarList.map((item) => {
      const totalSiswaKelas = siswaKelasList.filter(
        (sk) => sk.id_kelas === item.id_kelas
      ).length

      return {
        nama: item.kelas?.nama_kelas || "-",
        siswa: totalSiswaKelas,
      }
    })
  }, [mengajarList, siswaKelasList])

  const recentMengajar = mengajarList.slice(0, 6)

  const stats = [
    {
      title: "Kelas Diampu",
      value: totalKelas,
      icon: School,
      bg: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      title: "Mapel",
      value: totalMapel,
      icon: BookOpen,
      bg: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      title: "Total Siswa",
      value: totalSiswa,
      icon: Users,
      bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      title: "Materi",
      value: materiList.length,
      icon: Layers3,
      bg: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      title: "Tugas",
      value: tugasList.length,
      icon: ClipboardList,
      bg: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      title: "Dinilai",
      value: totalDinilai,
      icon: Trophy,
      bg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
    },
  ]

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Dashboard Guru"
      role="guru"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-blue-900/20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-blue-50">
              <Sparkles size={16} />
              Dashboard Pembelajaran Guru
            </div>

            <h1 className="text-2xl font-bold">
              Selamat datang, {profile?.nama_lengkap || "Guru"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Pantau kelas, mapel, siswa, materi, tugas, dan nilai berdasarkan
              tahun ajaran yang dipilih.
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5">
            <h2 className="font-semibold">Jumlah Siswa per Kelas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Berdasarkan kelas yang Anda ampu.
            </p>
          </div>

          <div className="h-80">
            {chartKelas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartKelas}>
                  <defs>
                    <linearGradient
                      id="guruBarGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="nama"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
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
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                  <Bar
                    dataKey="siswa"
                    fill="url(#guruBarGradient)"
                    radius={[14, 14, 0, 0]}
                    barSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada data kelas
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5">
            <h2 className="font-semibold">Sebaran Mapel</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Jumlah kelas per mata pelajaran.
            </p>
          </div>

          <div className="h-80">
            {chartMapel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                  <Pie
                    data={chartMapel}
                    dataKey="total"
                    nameKey="nama"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {chartMapel.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
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
                Belum ada data mapel
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chartMapel.map((item, index) => (
              <span
                key={item.nama}
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
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
                {item.nama}: {item.total}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Pembagian Mengajar</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Daftar mapel dan kelas yang sedang Anda ampu.
              </p>
            </div>

            <GraduationCap className="text-blue-600" size={24} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Mapel</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Jurusan</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentMengajar.map((item, index) => (
                  <tr key={item.id_mengajar}>
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {item.mapel?.nama_mapel || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.kelas?.nama_kelas || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {item.kelas?.jurusan?.kode_jurusan || "-"}
                      </span>
                    </td>
                  </tr>
                ))}

                {recentMengajar.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Belum ada pembagian mengajar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <h2 className="mb-4 font-semibold">Akses Cepat</h2>

          <div className="grid gap-3">
            <Link
              href="/guru/materi"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <BookOpen className="mb-2 text-blue-600" size={22} />
              <p className="font-medium">Materi</p>
              <p className="text-xs text-slate-500">Kelola materi belajar</p>
            </Link>

            <Link
              href="/guru/tugas"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-amber-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <ClipboardList className="mb-2 text-amber-600" size={22} />
              <p className="font-medium">Tugas</p>
              <p className="text-xs text-slate-500">Buat dan nilai tugas</p>
            </Link>

            <Link
              href="/guru/nilai"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <Trophy className="mb-2 text-emerald-600" size={22} />
              <p className="font-medium">Nilai</p>
              <p className="text-xs text-slate-500">Rekap nilai siswa</p>
            </Link>

            <Link
              href="/guru/laporan"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-violet-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <GraduationCap className="mb-2 text-violet-600" size={22} />
              <p className="font-medium">Laporan</p>
              <p className="text-xs text-slate-500">Cetak laporan siswa</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}