"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { protectPage } from "@/lib/protect"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const check = async () => {
      const userProfile = await protectPage(["kurikulum"], router, setLoading)
      if (userProfile) setProfile(userProfile)
    }

    check()
  }, [router])

  if (loading) return <div className="p-6">Memuat...</div>

  return (
    <DashboardLayout title="Dashboard Kurikulum" role="kurikulum" nama={profile?.nama_lengkap}>
    Isi dashboard kurikulum...
    </DashboardLayout>
  )
}