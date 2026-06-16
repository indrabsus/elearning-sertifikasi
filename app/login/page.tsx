"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { getRedirectByRole } from "@/lib/auth"

type TahunAjaran = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
  aktif: boolean
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingTahun, setLoadingTahun] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  const [tahunList, setTahunList] = useState<TahunAjaran[]>([])
  const [idTahunAjaran, setIdTahunAjaran] = useState("")

  useEffect(() => {
    const getTahunAjaran = async () => {
      const { data, error } = await supabase
        .from("tahun_ajaran")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        setErrorMsg(error.message)
        setLoadingTahun(false)
        return
      }

      const list = (data || []) as TahunAjaran[]
      setTahunList(list)

      const tahunAktif = list.find((item) => item.aktif)
      if (tahunAktif) setIdTahunAjaran(tahunAktif.id_tahun_ajaran)
      else if (list.length > 0) setIdTahunAjaran(list[0].id_tahun_ajaran)

      setLoadingTahun(false)
    }

    getTahunAjaran()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!idTahunAjaran) {
      setErrorMsg("Pilih tahun ajaran terlebih dahulu")
      return
    }

    setLoading(true)

    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (loginError || !loginData.user) {
        setErrorMsg("Email atau password salah")
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("view_user_login")
        .select("*")
        .eq("id_profile", loginData.user.id)
        .maybeSingle()

      if (profileError) {
        setErrorMsg(profileError.message)
        setLoading(false)
        return
      }

      if (!profile) {
        setErrorMsg("Profile tidak ditemukan")
        setLoading(false)
        return
      }

      if (!profile.nama_role) {
        setErrorMsg("Akun belum memiliki role")
        setLoading(false)
        return
      }

      if (!profile.aktif) {
        setErrorMsg("Akun tidak aktif")
        setLoading(false)
        return
      }

      const tahunDipilih = tahunList.find(
        (item) => item.id_tahun_ajaran === idTahunAjaran
      )

      localStorage.setItem("id_tahun_ajaran", idTahunAjaran)
      localStorage.setItem(
        "tahun_ajaran",
        JSON.stringify({
          id_tahun_ajaran: idTahunAjaran,
          nama_tahun_ajaran: tahunDipilih?.nama_tahun_ajaran || "",
          semester: tahunDipilih?.semester || "",
        })
      )

      if (profile.nama_role === "guru") {
        if (!profile.id_guru) {
          router.replace("/guru/verifikasi-mengajar")
          return
        }

        const { count } = await supabase
          .from("mengajar")
          .select("*", { count: "exact", head: true })
          .eq("id_guru", profile.id_guru)
          .eq("id_tahun_ajaran", idTahunAjaran)
          .eq("aktif", true)

        if (!count || count === 0) {
          router.replace("/guru/verifikasi-mengajar")
          return
        }
      }

      if (profile.nama_role === "siswa") {
        if (!profile.id_siswa) {
          router.replace("/siswa/verifikasi-kelas")
          return
        }

        const { count } = await supabase
          .from("siswa_kelas")
          .select("*", { count: "exact", head: true })
          .eq("id_siswa", profile.id_siswa)
          .eq("id_tahun_ajaran", idTahunAjaran)
          .eq("aktif", true)

        if (!count || count === 0) {
          router.replace("/siswa/verifikasi-kelas")
          return
        }
      }

      router.replace(getRedirectByRole(profile.nama_role))
    } catch (err) {
      console.error(err)
      setErrorMsg("Terjadi kesalahan saat login")
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />

      <section className="relative hidden w-1/2 flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <BookOpen size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold">E-Learning Sekolah</h1>
            <p className="text-sm text-slate-400">
              Learning Management & Sertifikasi
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <h2 className="text-5xl font-bold leading-tight">
            Kelola pembelajaran, kompetensi, dan sertifikat dalam satu aplikasi.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Login sesuai role, pilih tahun ajaran, lalu sistem otomatis
            mengarahkan ke dashboard yang sesuai.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Aplikasi E-Learning Sekolah
        </p>
      </section>

      <section className="relative flex min-h-screen w-full items-center justify-center px-5 py-10 lg:w-1/2">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl shadow-black/30 dark:bg-slate-900 dark:text-slate-100"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <BookOpen size={26} />
            </div>

            <h1 className="text-2xl font-bold">Selamat Datang</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Pilih tahun ajaran dan masuk ke dashboard.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tahun Ajaran</label>
              <div className="relative mt-1">
                <CalendarRange
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={idTahunAjaran}
                  onChange={(e) => setIdTahunAjaran(e.target.value)}
                  required
                  disabled={loadingTahun}
                >
                  <option value="">
                    {loadingTahun
                      ? "Memuat tahun ajaran..."
                      : "Pilih tahun ajaran"}
                  </option>

                  {tahunList.map((item) => (
                    <option
                      key={item.id_tahun_ajaran}
                      value={item.id_tahun_ajaran}
                    >
                      {item.nama_tahun_ajaran} - {item.semester}
                      {item.aktif ? " (Aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="relative mt-1">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@sekolah.sch.id"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingTahun}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Login
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/aktivasi-akun")}
            className="mt-4 w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Aktivasi Akun Guru / Siswa
          </button>
        </form>
      </section>
    </main>
  )
}