"use client"

import Link from "next/link"
import { ReactNode, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { menus } from "@/lib/menu"
import { applyTheme, getInitialTheme, Theme } from "@/lib/theme"

type Role = "admin" | "kurikulum" | "kajur" | "guru" | "siswa"

type Props = {
  children: ReactNode
  title: string
  role: Role
  nama?: string
}

export default function DashboardLayout({
  children,
  title,
  role,
  nama,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<Theme>("light")

  const menuGroups = menus[role] || []

  useEffect(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light"
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`fixed left-0 top-0 z-40 min-h-screen border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
              <BookOpen size={20} />
            </div>

            {!collapsed && (
              <div>
                <h1 className="text-sm font-bold leading-tight">
                  E-Learning
                </h1>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                  {role}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center border-b border-slate-200 py-3 dark:border-slate-800">
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        <nav className="space-y-5 p-3">
          {menuGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/")

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-blue-600 text-white shadow"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />

                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>

            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {nama ? `Selamat datang, ${nama}` : "Dashboard aplikasi"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              title="Ganti tema"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}