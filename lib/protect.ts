"use client"

import { supabase } from "@/lib/supabase"
import { getRedirectByRole } from "@/lib/auth"

export async function protectPage(
  allowedRoles: string[],
  router: any,
  setLoading?: (value: boolean) => void
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    router.push("/login")
    return null
  }

  const { data: profile } = await supabase
    .from("view_user_login")
    .select("*")
    .eq("id_profile", user.id)
    .single()

  if (!profile) {
    router.push("/login")
    return null
  }

  if (!profile.aktif) {
    await supabase.auth.signOut()
    router.push("/login")
    return null
  }

  if (!allowedRoles.includes(profile.nama_role)) {
    router.push(getRedirectByRole(profile.nama_role))
    return null
  }

  if (setLoading) setLoading(false)

  return profile
}