"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Award,
  BookOpen,
  CheckCircle,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Layers3,
  School,
  Sparkles,
  Trophy,
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
  id_siswa: string | null
}

type TahunAjaranStorage = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
}

type SiswaKelas = {
  id_siswa_kelas: string
  id_siswa: string
  id_kelas: string
  id_tahun_ajaran: string
  aktif: boolean
  kelas?: {
    id_kelas: string
    nama_kelas: string
    tingkat: number
    jurusan?: {
      kode_jurusan: string
      nama_jurusan: string
    }
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

type Materi = {
  id_materi: string
  id_mengajar: string
  judul: string
  created_at: string | null
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  deadline: string | null
  status: string | null
  created_at: string | null
  mengajar?: Mengajar
}

type PengumpulanTugas = {
  id_pengumpulan: string
  id_tugas: string
  id_siswa: string
  nilai: number | null
  status: string | null
}

type Kompetensi = {
  id_kompetensi: string
  judul: string
  aktif: boolean
}

type PengumpulanKompetensi = {
  id_pengumpulan_kompetensi: string
  id_siswa: string
  nilai: number | null
  status: string
}

type Sertifikat = {
  id_sertifikat: string
  id_siswa: string
  id_kompetensi: string
  status: string | null
}

export default function SiswaDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaranStorage | null>(
    null
  )

  const [siswaKelas, setSiswaKelas] = useState<SiswaKelas | null>(null)
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanTugas[]>([])
  const [kompetensiList, setKompetensiList] = useState<Kompetensi[]>([])
  const [pengumpulanKompetensiList, setPengumpulanKompetensiList] = useState<
    PengumpulanKompetensi[]
  >([])
  const [sertifikatList, setSertifikatList] = useState<Sertifikat[]>([])

  const [errorMsg, setErrorMsg] = useState("")

  const getData = async (userProfile: Profile) => {
    try {
      setErrorMsg("")

      const idTahunAjaran = localStorage.getItem("id_tahun_ajaran")
      const tahunRaw = localStorage.getItem("tahun_ajaran")

      if (!idTahunAjaran) {
        router.replace("/login")
        return
      }

      if (!userProfile.id_siswa) {
        router.replace("/login")
        return
      }

      if (tahunRaw) {
        try {
          setTahunAjaran(JSON.parse(tahunRaw))
        } catch {
          setTahunAjaran(null)
        }
      }

      const [
        siswaKelasData,
        mengajarData,
        materiData,
        tugasData,
        pengumpulanData,
        kompetensiData,
        pengumpulanKompetensiData,
        sertifikatData,
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
              id_kelas,
              nama_kelas,
              tingkat,
              jurusan:id_jurusan (
                kode_jurusan,
                nama_jurusan
              )
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
          "materi",
          `
            id_materi,
            id_mengajar,
            judul,
            created_at
          `,
          "created_at",
          false
        ),

        fetchAll(
          "tugas",
          `
            id_tugas,
            id_mengajar,
            judul,
            deadline,
            status,
            created_at,
            mengajar:id_mengajar (
              id_mengajar,
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
            status
          `
        ),

        fetchAll(
          "kompetensi",
          `
            id_kompetensi,
            judul,
            aktif
          `
        ),

        fetchAll(
          "pengumpulan_kompetensi",
          `
            id_pengumpulan_kompetensi,
            id_siswa,
            nilai,
            status
          `
        ),

        fetchAll(
          "sertifikat",
          `
            id_sertifikat,
            id_siswa,
            id_kompetensi,
            status
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

      const materiSiswa = (materiData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasSiswa = (tugasData || []).filter(
        (item: any) =>
          mengajarIds.includes(item.id_mengajar) && item.status === "aktif"
      )

      const tugasIds = tugasSiswa.map((item: any) => item.id_tugas)

      const pengumpulanSiswa = (pengumpulanData || []).filter(
        (item: any) =>
          item.id_siswa === userProfile.id_siswa &&
          tugasIds.includes(item.id_tugas)
      )

      const pengumpulanKompetensiSiswa = (
        pengumpulanKompetensiData || []
      ).filter((item: any) => item.id_siswa === userProfile.id_siswa)

      const sertifikatSiswa = (sertifikatData || []).filter(
        (item: any) =>
          item.id_siswa === userProfile.id_siswa && item.status !== "dicabut"
      )

      setSiswaKelas(kelasAktif as SiswaKelas)
      setMengajarList(mengajarSiswa as Mengajar[])
      setMateriList(materiSiswa as Materi[])
      setTugasList(tugasSiswa as Tugas[])
      setPengumpulanList(pengumpulanSiswa as PengumpulanTugas[])
      setKompetensiList(
        ((kompetensiData || []) as Kompetensi[]).filter((item) => item.aktif)
      )
      setPengumpulanKompetensiList(
        pengumpulanKompetensiSiswa as PengumpulanKompetensi[]
      )
      setSertifikatList(sertifikatSiswa as Sertifikat[])
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengambil data dashboard siswa")
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

  const totalMapel = useMemo(() => {
    return new Set(mengajarList.map((item) => item.id_mapel)).size
  }, [mengajarList])

  const tugasDikerjakan = useMemo(() => {
    return pengumpulanList.filter((item) =>
      ["selesai", "dinilai", "terlambat"].includes(item.status || "")
    ).length
  }, [pengumpulanList])

  const tugasDinilai = useMemo(() => {
    return pengumpulanList.filter(
      (item) => item.nilai !== null && item.nilai !== undefined
    ).length
  }, [pengumpulanList])

  const rataNilaiTugas = useMemo(() => {
    const nilai = pengumpulanList
      .filter((item) => item.nilai !== null && item.nilai !== undefined)
      .map((item) => Number(item.nilai || 0))

    if (nilai.length === 0) return 0

    return Math.round(
      nilai.reduce((total, item) => total + item, 0) / nilai.length
    )
  }, [pengumpulanList])

  const chartTugas = useMemo(() => {
    const selesai = tugasDikerjakan
    const belum = Math.max(tugasList.length - selesai, 0)

    return [
      { nama: "Selesai", total: selesai },
      { nama: "Belum", total: belum },
    ].filter((item) => item.total > 0)
  }, [tugasList, tugasDikerjakan])

  const chartMapelMateri = useMemo(() => {
    return mengajarList.map((mengajar) => {
      const totalMateri = materiList.filter(
        (materi) => materi.id_mengajar === mengajar.id_mengajar
      ).length

      return {
        nama: mengajar.mapel?.nama_mapel || "-",
        materi: totalMateri,
      }
    })
  }, [mengajarList, materiList])

  const recentTugas = useMemo(() => {
    return tugasList.slice(0, 5)
  }, [tugasList])

  const stats = [
    {
      title: "Mapel",
      value: totalMapel,
      icon: BookOpen,
      bg: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      title: "Materi",
      value: materiList.length,
      icon: Layers3,
      bg: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      title: "Tugas Aktif",
      value: tugasList.length,
      icon: ClipboardList,
      bg: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      title: "Tugas Selesai",
      value: tugasDikerjakan,
      icon: CheckCircle,
      bg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      title: "Rata Nilai",
      value: rataNilaiTugas,
      icon: Trophy,
      bg: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    },
    {
      title: "Sertifikat",
      value: sertifikatList.length,
      icon: Award,
      bg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300",
    },
  ]

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Dashboard Siswa"
      role="siswa"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-blue-900/20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-blue-50">
              <Sparkles size={16} />
              Dashboard Pembelajaran Siswa
            </div>

            <h1 className="text-2xl font-bold">
              Selamat datang, {profile?.nama_lengkap || "Siswa"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Pantau materi, tugas, nilai, kompetensi, dan sertifikat yang sudah
              kamu capai.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur">
            <p className="text-blue-100">Kelas / Tahun Ajaran</p>
            <p className="font-semibold">
              {siswaKelas?.kelas?.nama_kelas || "-"}
            </p>
            <p className="text-xs text-blue-100">
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Progress Tugas</h2>
            <p className="text-sm text-slate-500">
              Perbandingan tugas selesai dan belum selesai.
            </p>
          </div>

          <div className="h-80">
            {chartTugas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Pie
                    data={chartTugas}
                    dataKey="total"
                    nameKey="nama"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {chartTugas.map((_, index) => (
                      <Cell
                        key={index}
                        fill={["#059669", "#e11d48"][index % 2]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada tugas aktif.
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {chartTugas.map((item, index) => (
              <span
                key={item.nama}
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{
                  backgroundColor: ["#059669", "#e11d48"][index % 2],
                }}
              >
                {item.nama}: {item.total}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5">
            <h2 className="font-semibold">Materi per Mapel</h2>
            <p className="text-sm text-slate-500">
              Jumlah materi yang tersedia di kelas kamu.
            </p>
          </div>

          <div className="h-80">
            {chartMapelMateri.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMapelMateri}>
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
                    }}
                  />
                  <Bar
                    dataKey="materi"
                    fill="#2563eb"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada materi.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Tugas Terbaru</h2>
              <p className="text-sm text-slate-500">
                Daftar tugas aktif di kelas kamu.
              </p>
            </div>

            <ClipboardList className="text-blue-600" size={24} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Tugas</th>
                  <th className="px-4 py-3">Mapel</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {recentTugas.map((item, index) => {
                  const pengumpulan = pengumpulanList.find(
                    (p) => p.id_tugas === item.id_tugas
                  )

                  return (
                    <tr key={item.id_tugas}>
                      <td className="px-4 py-3 text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">{item.judul}</td>
                      <td className="px-4 py-3">
                        {item.mengajar?.mapel?.nama_mapel || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {item.deadline
                          ? new Date(item.deadline).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {pengumpulan?.status || "belum"}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {recentTugas.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Belum ada tugas aktif
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Akses Cepat</h2>

          <div className="grid gap-3">
            <Link
              href="/siswa/materi"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <BookOpen className="mb-2 text-blue-600" size={22} />
              <p className="font-medium">Materi</p>
              <p className="text-xs text-slate-500">Buka materi belajar</p>
            </Link>

            <Link
              href="/siswa/tugas"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-amber-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <ClipboardList className="mb-2 text-amber-600" size={22} />
              <p className="font-medium">Tugas</p>
              <p className="text-xs text-slate-500">Kerjakan tugas aktif</p>
            </Link>

            <Link
              href="/siswa/sertifikat"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-emerald-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <Award className="mb-2 text-emerald-600" size={22} />
              <p className="font-medium">Sertifikat</p>
              <p className="text-xs text-slate-500">
                Lihat sertifikat kompetensi
              </p>
            </Link>

            <Link
              href="/siswa/nilai"
              className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:bg-violet-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <FileCheck className="mb-2 text-violet-600" size={22} />
              <p className="font-medium">Nilai</p>
              <p className="text-xs text-slate-500">Lihat nilai tugas</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}