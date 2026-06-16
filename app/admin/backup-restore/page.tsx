"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DatabaseBackup, Download, FileUp } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { protectPage } from "@/lib/protect"
import DashboardLayout from "@/components/layout/DashboardLayout"
import PageLoader from "@/components/ui/PageLoader"

type TahunAjaran = {
  id_tahun_ajaran: string
  nama_tahun_ajaran: string
  semester: string
  aktif: boolean
}

export default function BackupRestorePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([])
  const [idTahunAjaran, setIdTahunAjaran] = useState("")
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)

  const getData = async () => {
    const { data, error } = await supabase
      .from("tahun_ajaran")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setTahunList((data || []) as TahunAjaran[])
    setIdTahunAjaran("")
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

  const handleBackup = async () => {
    if (!idTahunAjaran) {
      alert("Pilih tahun ajaran terlebih dahulu")
      return
    }

    const tahun = tahunList.find(
      (item) => item.id_tahun_ajaran === idTahunAjaran
    )

    if (!tahun) {
      alert("Tahun ajaran tidak valid. Refresh halaman dan pilih ulang.")
      return
    }

    setBackupLoading(true)

    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_tahun_ajaran: idTahunAjaran,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        alert(json.message || "Gagal backup")
        return
      }

      const filename = `backup-${tahun.nama_tahun_ajaran}-${tahun.semester}.json`

      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename.replaceAll("/", "-")
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Terjadi kesalahan saat backup")
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreFile) {
      alert("Pilih file backup JSON terlebih dahulu")
      return
    }

    if (!confirm("Restore akan menimpa data dengan ID yang sama. Lanjutkan?")) {
      return
    }

    setRestoreLoading(true)

    try {
      const text = await restoreFile.text()
      const json = JSON.parse(text)

      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
      })

      const result = await res.json()

      if (!res.ok) {
        alert(result.message || "Gagal restore")
        return
      }

      alert("Restore berhasil")
      setRestoreFile(null)
      await getData()
    } catch {
      alert("File backup tidak valid atau restore gagal")
    } finally {
      setRestoreLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Backup Restore" role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Backup & Restore</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Backup dan restore data akademik berdasarkan tahun ajaran.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <DatabaseBackup size={22} />
            </div>

            <div>
              <h2 className="font-semibold">Backup Data</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Download data tahun ajaran menjadi file JSON.
              </p>
            </div>
          </div>

          <label className="text-sm font-medium">Tahun Ajaran</label>
          <select
            value={idTahunAjaran}
            onChange={(e) => setIdTahunAjaran(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">Pilih tahun ajaran</option>
            {tahunList.map((item) => (
              <option key={item.id_tahun_ajaran} value={item.id_tahun_ajaran}>
                {item.nama_tahun_ajaran} - {item.semester}
                {item.aktif ? " (Aktif)" : ""}
              </option>
            ))}
          </select>

          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={18} />
            {backupLoading ? "Membuat Backup..." : "Download Backup"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <FileUp size={22} />
            </div>

            <div>
              <h2 className="font-semibold">Restore Data</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload file backup JSON untuk mengembalikan data.
              </p>
            </div>
          </div>

          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />

          <button
            onClick={handleRestore}
            disabled={restoreLoading}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <FileUp size={18} />
            {restoreLoading ? "Restore..." : "Restore Backup"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}