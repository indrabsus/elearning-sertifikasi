"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Award,
  BookOpen,
  CheckCircle,
  Circle,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Lock,
  MapPinned,
  Medal,
  Star,
  Trophy,
} from "lucide-react"

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
}

type Tugas = {
  id_tugas: string
  id_mengajar: string
  judul: string
  status: string | null
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
  deskripsi: string | null
  tingkat: number | null
  urutan: number | null
  syarat_lulus: number | null
  aktif: boolean
  jurusan?: {
    kode_jurusan: string
    nama_jurusan: string
  }
}

type PengumpulanKompetensi = {
  id_pengumpulan_kompetensi: string
  id_siswa: string
  nilai: number | null
  status: string
  kompetensi_tugas?: {
    id_kompetensi: string
  }
}

type Sertifikat = {
  id_sertifikat: string
  id_siswa: string
  id_kompetensi: string
  status: string | null
}

type RoadmapMapel = {
  id_mapel: string
  nama_mapel: string
  guru: string
  total_materi: number
  total_tugas: number
  tugas_dinilai: number
  rata_nilai: number
  progress: number
}

type RoadmapKompetensi = {
  id_kompetensi: string
  judul: string
  deskripsi: string | null
  tingkat: number | null
  urutan: number | null
  syarat_lulus: number
  nilai: number
  status: string
  punya_sertifikat: boolean
}

export default function SiswaRoadmapPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [siswaKelas, setSiswaKelas] = useState<SiswaKelas | null>(null)
  const [mengajarList, setMengajarList] = useState<Mengajar[]>([])
  const [materiList, setMateriList] = useState<Materi[]>([])
  const [tugasList, setTugasList] = useState<Tugas[]>([])
  const [pengumpulanTugasList, setPengumpulanTugasList] = useState<
    PengumpulanTugas[]
  >([])
  const [kompetensiList, setKompetensiList] = useState<Kompetensi[]>([])
  const [pengumpulanKompetensiList, setPengumpulanKompetensiList] = useState<
    PengumpulanKompetensi[]
  >([])
  const [sertifikatList, setSertifikatList] = useState<Sertifikat[]>([])

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
        materiData,
        tugasData,
        pengumpulanTugasData,
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

        fetchAll("materi", "id_materi, id_mengajar, judul"),

        fetchAll(
          "tugas",
          `
            id_tugas,
            id_mengajar,
            judul,
            status,
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
          `
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
            deskripsi,
            tingkat,
            urutan,
            syarat_lulus,
            aktif,
            jurusan:id_jurusan (
              kode_jurusan,
              nama_jurusan
            )
          `,
          "urutan"
        ),

        fetchAll(
          "pengumpulan_kompetensi",
          `
            id_pengumpulan_kompetensi,
            id_siswa,
            nilai,
            status,
            kompetensi_tugas:id_kompetensi_tugas (
              id_kompetensi
            )
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

      const tugasSiswa = (tugasData || []).filter((item: any) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugasSiswa.map((item: any) => item.id_tugas)

      const pengumpulanTugasSiswa = (pengumpulanTugasData || []).filter(
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
      setPengumpulanTugasList(pengumpulanTugasSiswa as PengumpulanTugas[])
      setKompetensiList(
        ((kompetensiData || []) as Kompetensi[]).filter((item) => item.aktif)
      )
      setPengumpulanKompetensiList(
        pengumpulanKompetensiSiswa as PengumpulanKompetensi[]
      )
      setSertifikatList(sertifikatSiswa as Sertifikat[])
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data roadmap")
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

  const roadmapMapel = useMemo<RoadmapMapel[]>(() => {
    const map = new Map<string, Mengajar[]>()

    mengajarList.forEach((item) => {
      if (!map.has(item.id_mapel)) map.set(item.id_mapel, [])
      map.get(item.id_mapel)?.push(item)
    })

    return Array.from(map.entries()).map(([idMapel, mengajarItems]) => {
      const mengajarIds = mengajarItems.map((item) => item.id_mengajar)

      const materi = materiList.filter((item) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugas = tugasList.filter((item) =>
        mengajarIds.includes(item.id_mengajar)
      )

      const tugasIds = tugas.map((item) => item.id_tugas)

      const pengumpulan = pengumpulanTugasList.filter((item) =>
        tugasIds.includes(item.id_tugas)
      )

      const nilaiValid = pengumpulan
        .filter((item) => item.nilai !== null && item.nilai !== undefined)
        .map((item) => Number(item.nilai || 0))

      const rata =
        nilaiValid.length > 0
          ? Math.round(
              nilaiValid.reduce((sum, item) => sum + item, 0) /
                nilaiValid.length
            )
          : 0

      const progress =
        tugas.length > 0
          ? Math.round((nilaiValid.length / tugas.length) * 100)
          : materi.length > 0
          ? 30
          : 0

      return {
        id_mapel: idMapel,
        nama_mapel: mengajarItems[0]?.mapel?.nama_mapel || "-",
        guru: mengajarItems[0]?.guru?.nama_lengkap || "-",
        total_materi: materi.length,
        total_tugas: tugas.length,
        tugas_dinilai: nilaiValid.length,
        rata_nilai: rata,
        progress,
      }
    })
  }, [mengajarList, materiList, tugasList, pengumpulanTugasList])

  const roadmapKompetensi = useMemo<RoadmapKompetensi[]>(() => {
    return kompetensiList
      .map((kompetensi) => {
        const pengumpulan = pengumpulanKompetensiList.filter(
          (item) =>
            item.kompetensi_tugas?.id_kompetensi === kompetensi.id_kompetensi
        )

        const nilaiTerbaik =
          pengumpulan.length > 0
            ? Math.max(...pengumpulan.map((item) => Number(item.nilai || 0)))
            : 0

        const punyaSertifikat = sertifikatList.some(
          (item) => item.id_kompetensi === kompetensi.id_kompetensi
        )

        let status = "terkunci"

        if (punyaSertifikat) {
          status = "sertifikat"
        } else if (pengumpulan.some((item) => item.status === "lulus")) {
          status = "lulus"
        } else if (
          pengumpulan.some((item) => item.status === "menunggu_acc")
        ) {
          status = "menunggu_acc"
        } else if (pengumpulan.some((item) => item.status === "dinilai")) {
          status = "dinilai"
        } else if (pengumpulan.some((item) => item.status === "selesai")) {
          status = "selesai"
        } else if (pengumpulan.some((item) => item.status === "dikerjakan")) {
          status = "dikerjakan"
        } else {
          status = "belum"
        }

        return {
          id_kompetensi: kompetensi.id_kompetensi,
          judul: kompetensi.judul,
          deskripsi: kompetensi.deskripsi,
          tingkat: kompetensi.tingkat,
          urutan: kompetensi.urutan,
          syarat_lulus: Number(kompetensi.syarat_lulus || 75),
          nilai: nilaiTerbaik,
          status,
          punya_sertifikat: punyaSertifikat,
        }
      })
      .sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0))
  }, [kompetensiList, pengumpulanKompetensiList, sertifikatList])

  const totalMapel = roadmapMapel.length
  const mapelSelesai = roadmapMapel.filter((item) => item.progress >= 100).length
  const kompetensiSertifikat = roadmapKompetensi.filter(
    (item) => item.punya_sertifikat
  ).length
  const kompetensiBerjalan = roadmapKompetensi.filter((item) =>
    ["dikerjakan", "selesai", "dinilai", "menunggu_acc", "lulus"].includes(
      item.status
    )
  ).length

  const rataNilai =
    roadmapMapel.filter((item) => item.rata_nilai > 0).length > 0
      ? Math.round(
          roadmapMapel
            .filter((item) => item.rata_nilai > 0)
            .reduce((sum, item) => sum + item.rata_nilai, 0) /
            roadmapMapel.filter((item) => item.rata_nilai > 0).length
        )
      : 0

  const getKompetensiBadge = (status: string) => {
    if (status === "sertifikat") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Sertifikat
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

    if (status === "lulus" || status === "dinilai") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          Lulus
        </span>
      )
    }

    if (status === "selesai") {
      return (
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          Selesai
        </span>
      )
    }

    if (status === "dikerjakan") {
      return (
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
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

  const getIconKompetensi = (status: string) => {
    if (status === "sertifikat") {
      return <Award size={22} />
    }

    if (["lulus", "dinilai", "menunggu_acc"].includes(status)) {
      return <CheckCircle size={22} />
    }

    if (["dikerjakan", "selesai"].includes(status)) {
      return <Star size={22} />
    }

    return <Lock size={22} />
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Roadmap Belajar"
      role="siswa"
      nama={profile?.nama_lengkap}
    >
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-blue-900/20">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-blue-50">
              <MapPinned size={16} />
              Roadmap Pembelajaran
            </div>

            <h1 className="text-2xl font-bold">
              Perjalanan Belajar {profile?.nama_lengkap || "Siswa"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Pantau perkembangan mapel, tugas, nilai, kompetensi, dan
              sertifikat yang sudah kamu capai.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm backdrop-blur">
            <p className="text-blue-100">Kelas</p>
            <p className="text-xl font-bold">
              {siswaKelas?.kelas?.nama_kelas || "-"}
            </p>
            <p className="text-xs text-blue-100">
              {siswaKelas?.kelas?.jurusan?.kode_jurusan || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mb-3 text-blue-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Mapel</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {totalMapel}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="mb-3 text-amber-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tugas Dinilai
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {pengumpulanTugasList.filter((item) => item.nilai !== null).length}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <Trophy className="mb-3 text-violet-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rata Nilai
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {rataNilai}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <FileCheck className="mb-3 text-emerald-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kompetensi
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {kompetensiBerjalan}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <Award className="mb-3 text-cyan-600" size={24} />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sertifikat
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {kompetensiSertifikat}
          </h2>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Roadmap Mapel
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Progress berdasarkan materi dan tugas yang sudah dinilai.
            </p>
          </div>

          <GraduationCap className="text-blue-600" size={24} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roadmapMapel.map((item) => (
            <div
              key={item.id_mapel}
              className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {item.nama_mapel}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.guru}
                  </p>
                </div>

                {item.progress >= 100 ? (
                  <Medal className="text-amber-500" size={24} />
                ) : (
                  <Circle className="text-slate-400" size={22} />
                )}
              </div>

              <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.min(item.progress, 100)}%` }}
                />
              </div>

              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Progress {item.progress}%
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {item.total_materi}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Materi
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <p className="font-bold">{item.tugas_dinilai}</p>
                  <p className="text-xs">Dinilai</p>
                </div>

                <div className="rounded-2xl bg-green-50 p-3 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <p className="font-bold">{item.rata_nilai}</p>
                  <p className="text-xs">Rata</p>
                </div>
              </div>
            </div>
          ))}

          {roadmapMapel.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Roadmap mapel belum tersedia.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Roadmap Kompetensi & Sertifikat
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ikuti kompetensi jurusan sampai mendapatkan sertifikat.
            </p>
          </div>

          <Link
            href="/siswa/sertifikat"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Award size={16} />
            Lihat Sertifikat
          </Link>
        </div>

        <div className="relative space-y-4">
  {roadmapKompetensi.map((item, index) => (
    <Link
      key={item.id_kompetensi}
      href={`/siswa/kompetensi/${item.id_kompetensi}`}
      className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-800"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className={
              item.punya_sertifikat
                ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : item.status !== "belum"
                ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
            }
          >
            {getIconKompetensi(item.status)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Step {index + 1}
              </span>

              {getKompetensiBadge(item.status)}
            </div>

            <h3 className="line-clamp-1 font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {item.judul}
            </h3>

            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {item.deskripsi || "Tidak ada deskripsi kompetensi."}
            </p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 text-center text-sm md:w-56">
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
            <p className="font-bold text-slate-900 dark:text-white">
              {item.nilai}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nilai
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <p className="font-bold">{item.syarat_lulus}</p>
            <p className="text-xs">Syarat</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
        <span className="text-slate-500 dark:text-slate-400">
          Klik untuk melihat tugas kompetensi
        </span>

        <span className="font-semibold text-blue-600 dark:text-blue-400">
          Buka →
        </span>
      </div>
    </Link>
  ))}

  {roadmapKompetensi.length === 0 && (
    <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      Roadmap kompetensi belum tersedia.
    </div>
  )}
</div>
      </div>
    </DashboardLayout>
  )
}