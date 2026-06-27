import {
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CalendarRange,
  CheckCircle,
  ClipboardList,
  Database,
  FileQuestion,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Map,
  Route,
  School,
  Trophy,
  UserCog,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type MenuItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type MenuGroup = {
  title: string
  items: MenuItem[]
}

export const menus: Record<string, MenuGroup[]> = {
  admin: [
    {
      title: "Utama",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Master Data",
      items: [
        {
          label: "Jurusan",
          href: "/admin/jurusan",
          icon: GraduationCap,
        },
        {
          label: "Tahun Ajaran",
          href: "/admin/tahun-ajaran",
          icon: CalendarRange,
        },
        {
          label: "Kelas",
          href: "/admin/kelas",
          icon: School,
        },
        {
          label: "Guru",
          href: "/admin/guru",
          icon: UserCog,
        },
        {
          label: "Siswa",
          href: "/admin/siswa",
          icon: Users,
        },
        {
          label: "Mapel",
          href: "/admin/mapel",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Sistem",
      items: [
        {
          label: "Reset Password",
          href: "/admin/reset-password",
          icon: KeyRound,
        },
        {
          label: "Backup Restore",
          href: "/admin/backup-restore",
          icon: Database,
        },
      ],
    },
  ],

  kurikulum: [
    {
      title: "Utama",
      items: [
        {
          label: "Dashboard",
          href: "/kurikulum/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Akademik",
      items: [
        {
          label: "Guru",
          href: "/kurikulum/guru",
          icon: UserCog,
        },
        {
          label: "Siswa",
          href: "/kurikulum/siswa",
          icon: Users,
        },
        {
          label: "Mapel",
          href: "/kurikulum/mapel",
          icon: BookOpen,
        },
        {
          label: "Kelas",
          href: "/kurikulum/kelas",
          icon: School,
        },
        {
          label: "Pembagian Mengajar",
          href: "/kurikulum/mengajar",
          icon: CalendarRange,
        },
      ],
    },
  ],

  kajur: [
    {
      title: "Utama",
      items: [
        {
          label: "Dashboard",
          href: "/kajur/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Sertifikasi",
      items: [
        {
          label: "Roadmap Kompetensi",
          href: "/kajur/kompetensi",
          icon: Route,
        },
        {
  label: "Bank Soal",
  href: "/kajur/bank-soal",
  icon: ClipboardList,
},
        {
          label: "Validasi Kompetensi",
          href: "/kajur/validasi",
          icon: BadgeCheck,
        },
        {
          label: "Sertifikat",
          href: "/kajur/sertifikat",
          icon: Award,
        },
        {
          label: "Rekap Kompetensi",
          href: "/kajur/rekap-kompetensi",
          icon: BarChart3,
        },
      ],
    },
  ],

  guru: [
    {
      title: "Utama",
      items: [
        {
          label: "Dashboard",
          href: "/guru/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Pembelajaran",
      items: [
        {
          label: "Pembagian Mengajar",
          href: "/guru/mengajar",
          icon: CalendarRange,
        },
        {
          label: "Materi",
          href: "/guru/materi",
          icon: BookOpen,
        },
        {
          label: "Tugas",
          href: "/guru/tugas",
          icon: ClipboardList,
        },
        {
          label: "Pengumpulan Tugas",
          href: "/guru/pengumpulan-tugas",
          icon: CheckCircle,
        },
        {
          label: "Bank Soal",
          href: "/guru/bank-soal",
          icon: FileQuestion,
        },
        {
          label: "Nilai",
          href: "/guru/nilai",
          icon: Trophy,
        },
        {
          label: "Laporan",
          href: "/guru/laporan",
          icon: BarChart3,
        },
      ],
    },
  ],

  siswa: [
    {
      title: "Utama",
      items: [
        {
          label: "Dashboard",
          href: "/siswa/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Belajar",
      items: [
        {
          label: "Materi",
          href: "/siswa/materi",
          icon: BookOpen,
        },
        {
          label: "Tugas",
          href: "/siswa/tugas",
          icon: ClipboardList,
        },
        {
          label: "Nilai",
          href: "/siswa/nilai",
          icon: Trophy,
        },
        {
          label: "Roadmap Belajar",
          href: "/siswa/roadmap",
          icon: Map,
        },
        {
          label: "Sertifikat Saya",
          href: "/siswa/sertifikat",
          icon: Award,
        },
      ],
    },
  ],
}