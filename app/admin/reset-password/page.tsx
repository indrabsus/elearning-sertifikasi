"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  KeyRound,
  Search,
  ShieldCheck,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type UserLogin = {
  id_profile: string
  email: string | null
  nama_lengkap: string | null
  nama_role: string | null
  aktif: boolean | null
  id_guru?: string | null
  id_siswa?: string | null
  nisn?: string | null
  nama_kelas?: string | null
}

export default function ResetPasswordPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserLogin[]>([])
  const [search, setSearch] = useState("")
  const [resettingId, setResettingId] = useState<string | null>(null)

  const getData = async () => {
    const { data, error } = await supabase
      .from("view_user_login")
      .select("*")
      .order("nama_role", { ascending: true })
      .order("nama_lengkap", { ascending: true })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setUsers((data || []) as UserLogin[])
    setLoading(false)
  }

  useEffect(() => {
    const check = async () => {
      const profile = await protectPage(["admin"], router)
      if (!profile) return
      await getData()
    }

    check()
  }, [router])

  const handleResetPassword = async (user: UserLogin) => {
    if (!confirm(`Reset password ${user.nama_lengkap || user.email} menjadi 123456?`)) {
      return
    }

    setResettingId(user.id_profile)

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_profile: user.id_profile,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json.message || "Gagal reset password")
        return
      }

      alert("Password berhasil direset menjadi 123456")
    } catch {
      alert("Terjadi kesalahan saat reset password")
    } finally {
      setResettingId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase()

    return users.filter((item) => {
      return (
        (item.nama_lengkap || "").toLowerCase().includes(keyword) ||
        (item.email || "").toLowerCase().includes(keyword) ||
        (item.nama_role || "").toLowerCase().includes(keyword) ||
        (item.nisn || "").toLowerCase().includes(keyword) ||
        (item.nama_kelas || "").toLowerCase().includes(keyword)
      )
    })
  }, [users, search])

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Reset Password" role="admin">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Admin dapat mereset password user menjadi default: 123456.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Daftar User</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total {filteredUsers.length} user ditampilkan
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
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Cari user..."
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <th className="p-4">No</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsers.map((item, index) => (
                  <tr
                    key={item.id_profile}
                    className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70"
                  >
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                          <ShieldCheck size={18} />
                        </div>

                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.nama_lengkap || "-"}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.email || "-"}
                    </td>

                    <td className="p-4">
                      <span className="rounded-xl bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {item.nama_role || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.nama_role === "siswa"
                        ? `${item.nisn || "-"} / ${item.nama_kelas || "-"}`
                        : item.nama_role === "guru"
                        ? item.id_guru
                          ? "Guru terhubung"
                          : "Guru belum terhubung"
                        : "-"}
                    </td>

                    <td className="p-4">
                      {item.aktif ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                          Aktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleResetPassword(item)}
                          disabled={resettingId === item.id_profile}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          <KeyRound size={15} />
                          {resettingId === item.id_profile
                            ? "Reset..."
                            : "Reset"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Data user tidak ditemukan
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