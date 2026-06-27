"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
// import { protectPage } from "@/lib/protect"
import PageLoader from "@/components/ui/PageLoader"

type SertifikatDetail = {
  id_sertifikat: string
  nama_kajur: string | null
jabatan_kajur: string | null
  nomor_sertifikat: string
  nilai: number
  kode_verifikasi: string
  status: string
  created_at: string
  siswa?: {
    nama_lengkap: string
    nisn: string | null
    nis: string | null
  }
  kompetensi?: {
    judul: string
    jurusan?: {
      nama_jurusan: string
      kode_jurusan: string
    }
  }
  penerbit?: {
    nama_lengkap: string
  }
}

export default function PrintSertifikatPage() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [sertifikat, setSertifikat] = useState<SertifikatDetail | null>(null)

  useEffect(() => {
    const init = async () => {
    //   const userProfile = await protectPage(["kajur"], router)
    //   if (!userProfile) return

      const { data, error } = await supabase
        .from("sertifikat")
        .select(`
          id_sertifikat,
          nomor_sertifikat,
          nama_kajur,
          nilai,
          kode_verifikasi,
          status,
          created_at,
          siswa:id_siswa (
            nama_lengkap,
            nisn,
            nis
          ),
          kompetensi:id_kompetensi (
            judul,
            jurusan:id_jurusan (
              nama_jurusan,
              kode_jurusan
            )
          ),
          penerbit:diterbitkan_oleh (
            nama_lengkap
          )
        `)
        .eq("id_sertifikat", id)
        .single()

      if (error || !data) {
        alert("Sertifikat tidak ditemukan")
        router.back()
        return
      }

      setSertifikat(data as SertifikatDetail)
      setLoading(false)
    }

    init()
  }, [id, router])

  useEffect(() => {
    if (!loading && sertifikat) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, sertifikat])

  if (loading) return <PageLoader />

  const tanggal = sertifikat?.created_at
    ? new Date(sertifikat.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"

  return (
    <>
      {/* Tombol aksi */}
      <div className="flex gap-3 p-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Print / Simpan PDF
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Kembali
        </button>
      </div>

      {/* Wrapper */}
      <div className="flex min-h-screen items-center justify-center bg-slate-800 print:bg-white print:p-0">
        <div
          id="sertifikat"
          className="relative overflow-hidden bg-white print:shadow-none"
          style={{
            width: "297mm",
            height: "210mm",
            fontFamily: "Georgia, serif",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Border dekoratif */}
          <div className="pointer-events-none absolute inset-3 z-10 border-4 border-yellow-500" />
          <div className="pointer-events-none absolute inset-5 z-10 border border-yellow-400" />

          {/* SVG Circuit Background */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 900 636"
            xmlns="http://www.w3.org/2000/svg"
            style={{ zIndex: 1 }}
          >
            <defs>
              <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0d2b5e" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#c8a84b" stopOpacity="0.03" />
              </linearGradient>
            </defs>
            <rect width="900" height="636" fill="#ffffff" />
            <rect width="900" height="636" fill="url(#gl)" />
            <ellipse cx="0" cy="0" rx="160" ry="160" fill="#c8a84b" opacity="0.07" />
            <ellipse cx="900" cy="636" rx="160" ry="160" fill="#c8a84b" opacity="0.07" />
            <ellipse cx="900" cy="0" rx="100" ry="100" fill="#0d2b5e" opacity="0.04" />
            <ellipse cx="0" cy="636" rx="100" ry="100" fill="#0d2b5e" opacity="0.04" />
            {/* circuit kiri */}
            <line x1="44" y1="100" x2="44" y2="530" stroke="#c8a84b" strokeWidth="1" opacity="0.35" />
            <line x1="44" y1="140" x2="110" y2="140" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="44" y1="200" x2="90" y2="200" stroke="#c8a84b" strokeWidth="1" opacity="0.25" />
            <line x1="44" y1="260" x2="120" y2="260" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="44" y1="320" x2="80" y2="320" stroke="#c8a84b" strokeWidth="1" opacity="0.25" />
            <line x1="44" y1="380" x2="105" y2="380" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="44" y1="450" x2="90" y2="450" stroke="#c8a84b" strokeWidth="1" opacity="0.25" />
            <line x1="44" y1="490" x2="120" y2="490" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="110" y1="140" x2="110" y2="180" stroke="#c8a84b" strokeWidth="1" opacity="0.22" />
            <line x1="110" y1="180" x2="140" y2="180" stroke="#c8a84b" strokeWidth="1" opacity="0.22" />
            <line x1="90" y1="200" x2="90" y2="240" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="120" y1="260" x2="120" y2="300" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="120" y1="300" x2="145" y2="300" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="105" y1="380" x2="105" y2="420" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="105" y1="420" x2="130" y2="420" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <circle cx="44" cy="140" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="44" cy="200" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="44" cy="260" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="44" cy="320" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="44" cy="380" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="44" cy="450" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="44" cy="490" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="110" cy="140" r="2.5" fill="#c8a84b" opacity="0.4" />
            <circle cx="90" cy="200" r="2" fill="#c8a84b" opacity="0.35" />
            <circle cx="120" cy="260" r="2.5" fill="#c8a84b" opacity="0.4" />
            <circle cx="80" cy="320" r="2" fill="#c8a84b" opacity="0.35" />
            <circle cx="105" cy="380" r="2.5" fill="#c8a84b" opacity="0.4" />
            <circle cx="140" cy="180" r="2" fill="#c8a84b" opacity="0.3" />
            <circle cx="145" cy="300" r="2" fill="#c8a84b" opacity="0.3" />
            <circle cx="130" cy="420" r="2" fill="#c8a84b" opacity="0.3" />
            <rect x="56" y="136" width="18" height="8" rx="2" fill="none" stroke="#c8a84b" strokeWidth="0.8" opacity="0.4" />
            <rect x="96" y="196" width="18" height="8" rx="2" fill="none" stroke="#c8a84b" strokeWidth="0.8" opacity="0.35" />
            <rect x="50" y="316" width="18" height="8" rx="2" fill="none" stroke="#c8a84b" strokeWidth="0.8" opacity="0.35" />
            {/* circuit kanan */}
            <line x1="856" y1="100" x2="856" y2="530" stroke="#c8a84b" strokeWidth="1" opacity="0.35" />
            <line x1="856" y1="140" x2="790" y2="140" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="856" y1="200" x2="810" y2="200" stroke="#c8a84b" strokeWidth="1" opacity="0.25" />
            <line x1="856" y1="260" x2="780" y2="260" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="856" y1="320" x2="820" y2="320" stroke="#c8a84b" strokeWidth="1" opacity="0.25" />
            <line x1="856" y1="380" x2="795" y2="380" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="856" y1="450" x2="810" y2="450" stroke="#c8a84b" strokeWidth="1" opacity="0.25" />
            <line x1="856" y1="490" x2="780" y2="490" stroke="#c8a84b" strokeWidth="1" opacity="0.3" />
            <line x1="790" y1="140" x2="790" y2="180" stroke="#c8a84b" strokeWidth="1" opacity="0.22" />
            <line x1="790" y1="180" x2="760" y2="180" stroke="#c8a84b" strokeWidth="1" opacity="0.22" />
            <line x1="810" y1="200" x2="810" y2="240" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="780" y1="260" x2="780" y2="300" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="780" y1="300" x2="755" y2="300" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="795" y1="380" x2="795" y2="420" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <line x1="795" y1="420" x2="770" y2="420" stroke="#c8a84b" strokeWidth="1" opacity="0.2" />
            <circle cx="856" cy="140" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="856" cy="200" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="856" cy="260" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="856" cy="320" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="856" cy="380" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="856" cy="450" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="856" cy="490" r="3" fill="#c8a84b" opacity="0.5" />
            <circle cx="790" cy="140" r="2.5" fill="#c8a84b" opacity="0.4" />
            <circle cx="810" cy="200" r="2" fill="#c8a84b" opacity="0.35" />
            <circle cx="780" cy="260" r="2.5" fill="#c8a84b" opacity="0.4" />
            <circle cx="820" cy="320" r="2" fill="#c8a84b" opacity="0.35" />
            <circle cx="795" cy="380" r="2.5" fill="#c8a84b" opacity="0.4" />
            <circle cx="760" cy="180" r="2" fill="#c8a84b" opacity="0.3" />
            <circle cx="755" cy="300" r="2" fill="#c8a84b" opacity="0.3" />
            <circle cx="770" cy="420" r="2" fill="#c8a84b" opacity="0.3" />
            <rect x="826" y="136" width="18" height="8" rx="2" fill="none" stroke="#c8a84b" strokeWidth="0.8" opacity="0.4" />
            <rect x="786" y="196" width="18" height="8" rx="2" fill="none" stroke="#c8a84b" strokeWidth="0.8" opacity="0.35" />
            <rect x="832" y="316" width="18" height="8" rx="2" fill="none" stroke="#c8a84b" strokeWidth="0.8" opacity="0.35" />
            {/* circuit atas */}
            <line x1="150" y1="44" x2="750" y2="44" stroke="#0d2b5e" strokeWidth="1" opacity="0.2" />
            <line x1="200" y1="44" x2="200" y2="80" stroke="#0d2b5e" strokeWidth="1" opacity="0.18" />
            <line x1="350" y1="44" x2="350" y2="70" stroke="#0d2b5e" strokeWidth="1" opacity="0.15" />
            <line x1="550" y1="44" x2="550" y2="70" stroke="#0d2b5e" strokeWidth="1" opacity="0.15" />
            <line x1="700" y1="44" x2="700" y2="80" stroke="#0d2b5e" strokeWidth="1" opacity="0.18" />
            <circle cx="200" cy="44" r="2.5" fill="#0d2b5e" opacity="0.3" />
            <circle cx="350" cy="44" r="2" fill="#0d2b5e" opacity="0.25" />
            <circle cx="550" cy="44" r="2" fill="#0d2b5e" opacity="0.25" />
            <circle cx="700" cy="44" r="2.5" fill="#0d2b5e" opacity="0.3" />
            <rect x="210" y="40" width="16" height="8" rx="2" fill="none" stroke="#0d2b5e" strokeWidth="0.8" opacity="0.3" />
            <rect x="580" y="40" width="16" height="8" rx="2" fill="none" stroke="#0d2b5e" strokeWidth="0.8" opacity="0.3" />
            {/* circuit bawah */}
            <line x1="150" y1="592" x2="750" y2="592" stroke="#0d2b5e" strokeWidth="1" opacity="0.2" />
            <line x1="220" y1="592" x2="220" y2="556" stroke="#0d2b5e" strokeWidth="1" opacity="0.18" />
            <line x1="380" y1="592" x2="380" y2="565" stroke="#0d2b5e" strokeWidth="1" opacity="0.15" />
            <line x1="520" y1="592" x2="520" y2="565" stroke="#0d2b5e" strokeWidth="1" opacity="0.15" />
            <line x1="680" y1="592" x2="680" y2="556" stroke="#0d2b5e" strokeWidth="1" opacity="0.18" />
            <circle cx="220" cy="592" r="2.5" fill="#0d2b5e" opacity="0.3" />
            <circle cx="380" cy="592" r="2" fill="#0d2b5e" opacity="0.25" />
            <circle cx="520" cy="592" r="2" fill="#0d2b5e" opacity="0.25" />
            <circle cx="680" cy="592" r="2.5" fill="#0d2b5e" opacity="0.3" />
            <rect x="248" y="588" width="16" height="8" rx="2" fill="none" stroke="#0d2b5e" strokeWidth="0.8" opacity="0.3" />
            <rect x="556" y="588" width="16" height="8" rx="2" fill="none" stroke="#0d2b5e" strokeWidth="0.8" opacity="0.3" />
            {/* IC chip sudut */}
            {([
              { x: 30, y: 82, pins: [34, 42, 50, 58], pinY1: 82, pinY2: 76, pinY3: 106, pinY4: 112 },
              { x: 834, y: 82, pins: [838, 846, 854, 862], pinY1: 82, pinY2: 76, pinY3: 106, pinY4: 112 },
              { x: 30, y: 530, pins: [34, 42, 50, 58], pinY1: 530, pinY2: 524, pinY3: 554, pinY4: 560 },
              { x: 834, y: 530, pins: [838, 846, 854, 862], pinY1: 530, pinY2: 524, pinY3: 554, pinY4: 560 },
            ] as Array<{ x: number; y: number; pins: number[]; pinY1: number; pinY2: number; pinY3: number; pinY4: number }>).map((chip, i) => (
              <g key={i}>
                <rect x={chip.x} y={chip.y} width="36" height="24" rx="3" fill="none" stroke="#c8a84b" strokeWidth="1" opacity="0.4" />
                {chip.pins.map((px) => (
                  <g key={px}>
                    <line x1={px} y1={chip.pinY1} x2={px} y2={chip.pinY2} stroke="#c8a84b" strokeWidth="0.8" opacity="0.35" />
                    <line x1={px} y1={chip.pinY3} x2={px} y2={chip.pinY4} stroke="#c8a84b" strokeWidth="0.8" opacity="0.35" />
                  </g>
                ))}
              </g>
            ))}
          </svg>

          {/* Konten utama */}
          <div
            className="absolute inset-0 z-20 flex flex-col"
            style={{ padding: "36px 52px" }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-5"
              style={{ paddingBottom: "18px", borderBottom: "2px solid #c8a84b" }}
            >
              <img
                src="/logo.png"
                alt="Logo SMK Sangkuriang 1 Cimahi"
                style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0 }}
              />
              <div className="flex-1 text-center">
                <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#888", fontFamily: "sans-serif" }}>
                  SMK Sangkuriang 1 Cimahi
                </p>
                <h1 style={{ fontSize: 26, fontWeight: "bold", color: "#0d2b5e", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>
                  Sertifikat Kompetensi
                </h1>
                <p style={{ fontSize: 11, color: "#aaa", fontFamily: "sans-serif", marginTop: 2, letterSpacing: 1 }}>
                  Certificate of Competency
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#aaa", fontFamily: "sans-serif" }}>
                  No. Sertifikat
                </p>
                <p style={{ fontSize: 11, fontWeight: "bold", color: "#333", marginTop: 3, fontFamily: "sans-serif" }}>
                  {sertifikat?.nomor_sertifikat}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <p style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: "#999", fontFamily: "sans-serif" }}>
                Diberikan kepada
              </p>
              <h2 style={{ fontSize: 42, fontWeight: "bold", color: "#0d2b5e", letterSpacing: 1, lineHeight: 1.1 }}>
                {sertifikat?.siswa?.nama_lengkap || "-"}
              </h2>
              <p style={{ fontSize: 11, color: "#bbb", fontFamily: "sans-serif", marginTop: 2 }}>
                NISN: {sertifikat?.siswa?.nisn || sertifikat?.siswa?.nis || "-"}
              </p>
              <p style={{ fontSize: 13, color: "#555", fontFamily: "sans-serif", marginTop: 6 }}>
                Telah dinyatakan{" "}
                <span style={{ fontWeight: "bold", color: "#2a7a2a" }}>LULUS</span>{" "}
                dan memenuhi kompetensi pada:
              </p>
              <div style={{ marginTop: 8, border: "1.5px solid #d4b86a", background: "rgba(212,184,106,0.08)", borderRadius: 10, padding: "10px 36px" }}>
                <p style={{ fontSize: 18, fontWeight: "bold", color: "#222" }}>
                  {sertifikat?.kompetensi?.judul || "-"}
                </p>
                <p style={{ fontSize: 11, color: "#999", fontFamily: "sans-serif", marginTop: 2 }}>
                  {sertifikat?.kompetensi?.jurusan?.nama_jurusan || "-"}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span style={{ fontSize: 13, color: "#888", fontFamily: "sans-serif" }}>Nilai:</span>
                <span style={{ fontSize: 30, fontWeight: "bold", color: "#0d2b5e" }}>{sertifikat?.nilai}</span>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-end justify-between"
              style={{ paddingTop: 14, borderTop: "1px solid #e8e0cc" }}
            >
              {/* Penerbit + Stamp + TTD */}
              <div>
                <p style={{ fontSize: 10, color: "#bbb", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
                  Diterbitkan pada
                </p>
                <p style={{ fontSize: 13, fontWeight: "bold", color: "#333", marginTop: 2, fontFamily: "sans-serif" }}>
                  {tanggal}
                </p>

                {/* Area TTD + Stamp */}
                <div style={{ marginTop: 16, position: "relative", width: 200, height: 100 }}>

                  {/* Stamp transparan di belakang TTD */}
                  <div style={{
                    position: "absolute",
                    top: -22,
                    left: -18,
                    width: 130,
                    height: 130,
                    opacity: 0.22,
                    transform: "rotate(-12deg)",
                    pointerEvents: "none",
                  }}>
                    <svg viewBox="0 0 370 370" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <clipPath id="logoClipStamp">
                          <circle cx="185" cy="170" r="44"/>
                        </clipPath>
                        <path id="topArcStamp" d="M 8,185 A 177,177 0 0,1 362,185"/>
                        <path id="botArcStamp" d="M 22,185 A 163,163 0 0,0 348,185"/>
                      </defs>
                      <g transform="translate(185,185)">
                        <circle cx="0" cy="0" r="178" fill="#faf7f0"/>
                        <circle cx="0" cy="0" r="178" fill="none" stroke="#0d2b5e" strokeWidth="6"/>
                        <circle cx="0" cy="0" r="170" fill="none" stroke="#c8a84b" strokeWidth="3"/>
                        <circle cx="0" cy="0" r="160" fill="none" stroke="#0d2b5e" strokeWidth="1.5" strokeDasharray="6 4"/>
                        <line x1="-160" y1="0"   x2="-125" y2="0"   stroke="#c8a84b" strokeWidth="2"/>
                        <line x1="125"  y1="0"   x2="160"  y2="0"   stroke="#c8a84b" strokeWidth="2"/>
                        <line x1="-125" y1="0"   x2="-125" y2="-35" stroke="#c8a84b" strokeWidth="2"/>
                        <line x1="-125" y1="-35" x2="-98"  y2="-35" stroke="#c8a84b" strokeWidth="2"/>
                        <line x1="125"  y1="0"   x2="125"  y2="-35" stroke="#c8a84b" strokeWidth="2"/>
                        <line x1="98"   y1="-35" x2="125"  y2="-35" stroke="#c8a84b" strokeWidth="2"/>
                        <circle cx="-125" cy="0"   r="4" fill="none" stroke="#c8a84b" strokeWidth="2"/>
                        <circle cx="125"  cy="0"   r="4" fill="none" stroke="#c8a84b" strokeWidth="2"/>
                        <circle cx="-98"  cy="-35" r="3.5" fill="#c8a84b"/>
                        <circle cx="98"   cy="-35" r="3.5" fill="#c8a84b"/>
                        <rect x="-108" y="-41" width="18" height="9" rx="2" fill="none" stroke="#c8a84b" strokeWidth="1.5"/>
                        <rect x="90"   y="-41" width="18" height="9" rx="2" fill="none" stroke="#c8a84b" strokeWidth="1.5"/>
                        <image href="/logo.png" x="-44" y="-59" width="88" height="88" clipPath="url(#logoClipStamp)" preserveAspectRatio="xMidYMid meet"/>
                        <line x1="-75" y1="44" x2="75" y2="44" stroke="#c8a84b" strokeWidth="3"/>
                        <circle cx="-79" cy="44" r="4" fill="#c8a84b"/>
                        <circle cx="79"  cy="44" r="4" fill="#c8a84b"/>
                        <text x="0" y="65"  textAnchor="middle" fontFamily="sans-serif" fontSize="16" fontWeight="bold" fill="#0d2b5e" letterSpacing="1">KETUA JURUSAN PPLG</text>
                        <text x="0" y="88"  textAnchor="middle" fontFamily="sans-serif" fontSize="13" fill="#555" letterSpacing="1">TAHUN PELAJARAN 2024/2025</text>
                        <rect x="-72" y="95" width="144" height="20" rx="4" fill="none" stroke="#c8a84b" strokeWidth="1.5"/>
                        <text x="0" y="109" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#0d2b5e" letterSpacing="2">CIMAHI — JAWA BARAT</text>
                      </g>
                      <text fontFamily="sans-serif" fontSize="17" fontWeight="bold" fill="#0d2b5e" letterSpacing="4">
                        <textPath href="#topArcStamp" startOffset="50%" textAnchor="middle">SMK SANGKURIANG 1 CIMAHI</textPath>
                      </text>
                      <text fontFamily="sans-serif" fontSize="14" fill="#c8a84b" letterSpacing="3">
                        <textPath href="#botArcStamp" startOffset="50%" textAnchor="middle">KOMPETENSI ✦ INTEGRITAS ✦ INOVASI</textPath>
                      </text>
                      <circle cx="185" cy="185" r="6" fill="#c8a84b"/>
                      <circle cx="185" cy="185" r="3" fill="#0d2b5e"/>
                    </svg>
                  </div>

                  {/* Garis TTD */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, width: 150, borderTop: "1px solid #999" }}>
                    <p style={{ fontSize: 12, fontWeight: "bold", color: "#222", marginTop: 4, fontFamily: "sans-serif" }}>
                     {sertifikat?.nama_kajur || "Ketua Jurusan"}
                    </p>
                    <p style={{ fontSize: 10, color: "#aaa", fontFamily: "sans-serif" }}>Ketua Jurusan</p>
                  </div>

                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${sertifikat?.kode_verifikasi}`}
                  alt="QR Code"
                  style={{ width: 72, height: 72 }}
                />
                <p style={{ fontSize: 9, letterSpacing: 2, color: "#bbb", fontFamily: "sans-serif", marginTop: 2 }}>
                  {sertifikat?.kode_verifikasi}
                </p>
                <p style={{ fontSize: 9, color: "#ccc", fontFamily: "sans-serif" }}>Kode Verifikasi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          #sertifikat {
            width: 297mm !important;
            height: 210mm !important;
            page-break-after: avoid;
          }
        }
      `}</style>
    </>
  )
}