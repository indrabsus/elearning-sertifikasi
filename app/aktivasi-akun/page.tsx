"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  UserCheck,
} from "lucide-react"

export default function AktivasiAkunPage() {
  const router = useRouter()

  const [role, setRole] = useState<"guru" | "siswa">("guru")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [uidFp, setUidFp] = useState("")
  const [noHp, setNoHp] = useState("")

  const [nisn, setNisn] = useState("")
  const [nis, setNis] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")
    setLoading(true)

    try {
      const res = await fetch("/api/aktivasi-akun", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          email,
          password,
          uid_fp: uidFp,
          no_hp: noHp,
          nisn,
          nis,
          tanggal_lahir: tanggalLahir,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.message || "Gagal aktivasi akun")
        setLoading(false)
        return
      }

      setSuccessMsg("Akun berhasil dibuat. Silakan login.")
      setLoading(false)

      setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch {
      setErrorMsg("Terjadi kesalahan saat aktivasi akun")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-7 text-slate-900 shadow-2xl shadow-black/30 dark:bg-slate-900 dark:text-slate-100">
        <button
          onClick={() => router.push("/login")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Kembali ke login
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <BookOpen size={26} />
          </div>

          <h1 className="text-2xl font-bold">Aktivasi Akun</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Aktivasi akun hanya untuk data guru/siswa yang sudah terdaftar.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Jenis Akun</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "guru" | "siswa")}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="guru">Guru</option>
              <option value="siswa">Siswa</option>
            </select>
          </div>

          {role === "guru" ? (
            <>
              <div>
                <label className="text-sm font-medium">UID Fingerprint</label>
                <input
                  value={uidFp}
                  onChange={(e) => setUidFp(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  placeholder="UID fingerprint"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">No HP</label>
                <input
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  placeholder="08123456789"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium">NISN</label>
                <input
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  placeholder="NISN"
                />
              </div>

              <div>
                <label className="text-sm font-medium">NIS</label>
                <input
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  placeholder="NIS"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tanggal Lahir</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium">Email Login</label>
            <div className="relative mt-1">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                placeholder="Minimal 6 karakter"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <UserCheck size={18} />
                Aktivasi Akun
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  )
}