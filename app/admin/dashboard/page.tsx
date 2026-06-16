"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  GraduationCap,
  School,
  UserCog,
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
import { protectPage } from "@/lib/protect"
import { supabase } from "@/lib/supabase"
import PageLoader from "@/components/ui/PageLoader"

type Profile = {
  nama_lengkap: string
}

type JurusanChart = {
  nama: string
  total: number
}

const COLORS = [
  "#2563eb",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
]

export default function AdminDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [totalGuru, setTotalGuru] = useState(0)
  const [totalSiswa, setTotalSiswa] = useState(0)
  const [totalJurusan, setTotalJurusan] = useState(0)
  const [totalKelas, setTotalKelas] = useState(0)
  const [totalMapel, setTotalMapel] = useState(0)
  const [chartJurusan, setChartJurusan] = useState<JurusanChart[]>([])

  const getDashboardData = async () => {
    const [
      guruRes,
      siswaRes,
      jurusanRes,
      kelasRes,
      mapelRes,
      kelasWithSiswaRes,
    ] = await Promise.all([
      supabase.from("guru").select("*", { count: "exact", head: true }),
      supabase.from("siswa").select("*", { count: "exact", head: true }),
      supabase.from("jurusan").select("*", { count: "exact", head: true }),
      supabase.from("kelas").select("*", { count: "exact", head: true }),
      supabase.from("mapel").select("*", { count: "exact", head: true }),
      supabase.from("kelas").select(`
        id_kelas,
        nama_kelas,
        jurusan:id_jurusan (
          kode_jurusan,
          nama_jurusan
        ),
        siswa (
          id_siswa
        )
      `),
    ])

    setTotalGuru(guruRes.count || 0)
    setTotalSiswa(siswaRes.count || 0)
    setTotalJurusan(jurusanRes.count || 0)
    setTotalKelas(kelasRes.count || 0)
    setTotalMapel(mapelRes.count || 0)

    const mapJurusan: Record<string, number> = {}

    kelasWithSiswaRes.data?.forEach((kelas: any) => {
      const nama =
        kelas.jurusan?.kode_jurusan ||
        kelas.jurusan?.nama_jurusan ||
        "Tanpa Jurusan"

      mapJurusan[nama] = (mapJurusan[nama] || 0) + (kelas.siswa?.length || 0)
    })

    setChartJurusan(
      Object.entries(mapJurusan).map(([nama, total]) => ({
        nama,
        total,
      }))
    )

    setLoading(false)
  }

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["admin"], router)
      if (!userProfile) return

      setProfile(userProfile)
      await getDashboardData()
    }

    check()
  }, [router])

  if (loading) {
  return <PageLoader />
}

  const stats = [
    {
      title: "Total Guru",
      value: totalGuru,
      icon: UserCog,
      bg: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      title: "Total Siswa",
      value: totalSiswa,
      icon: Users,
      bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      title: "Total Jurusan",
      value: totalJurusan,
      icon: GraduationCap,
      bg: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      title: "Total Kelas",
      value: totalKelas,
      icon: School,
      bg: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      title: "Total Mapel",
      value: totalMapel,
      icon: BookOpen,
      bg: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    },
  ]

  const barData = [
    { nama: "Guru", total: totalGuru },
    { nama: "Siswa", total: totalSiswa },
    { nama: "Jurusan", total: totalJurusan },
    { nama: "Kelas", total: totalKelas },
    { nama: "Mapel", total: totalMapel },
  ]

  return (
    <DashboardLayout
      title="Dashboard Admin"
      role="admin"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-blue-900/20">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-100">
          Ringkasan data utama aplikasi e-learning dan sertifikasi sekolah.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.title}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">{item.value}</h2>
                </div>

                <div className={`rounded-2xl p-3 ${item.bg}`}>
                  <Icon size={24} />
                </div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{
                    width: `${Math.min(item.value || 5, 100)}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5">
            <h2 className="font-semibold">Statistik Master Data</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Perbandingan jumlah data utama.
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
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
                  cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="url(#barGradient)"
                  radius={[14, 14, 0, 0]}
                  barSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5">
            <h2 className="font-semibold">Jumlah Siswa per Jurusan</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Distribusi siswa berdasarkan jurusan.
            </p>
          </div>

          {chartJurusan.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartJurusan}
                    dataKey="total"
                    nameKey="nama"
                    outerRadius={110}
                    innerRadius={58}
                    paddingAngle={4}
                    label
                  >
                    {chartJurusan.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500 dark:bg-slate-800">
              Belum ada data siswa per jurusan
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <h2 className="mb-4 font-semibold">Status Sistem</h2>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Database</span>
              <span className="font-medium text-green-600">Terhubung</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Role Login</span>
              <span className="font-medium text-green-600">Aktif</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Mode Aplikasi</span>
              <span className="font-medium">Admin</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 xl:col-span-2">
          <h2 className="mb-4 font-semibold">Akses Cepat</h2>

          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/admin/jurusan"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <GraduationCap className="mb-2 text-blue-600" size={22} />
              <p className="font-medium">Kelola Jurusan</p>
              <p className="text-xs text-slate-500">Tambah dan edit jurusan</p>
            </Link>

            <Link
              href="/admin/guru"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <UserCog className="mb-2 text-emerald-600" size={22} />
              <p className="font-medium">Kelola Guru</p>
              <p className="text-xs text-slate-500">CRUD dan import CSV</p>
            </Link>

            <Link
              href="/admin/kelas"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-amber-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <School className="mb-2 text-amber-600" size={22} />
              <p className="font-medium">Kelola Kelas</p>
              <p className="text-xs text-slate-500">Atur kelas per jurusan</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}