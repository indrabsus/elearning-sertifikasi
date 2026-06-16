import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      tipe_soal,
      materi,
      jumlah,
      tingkat_kesulitan,
      mapel,
    } = body

    if (!materi || !jumlah || !tipe_soal) {
      return NextResponse.json(
        { message: "Materi, jumlah, dan tipe soal wajib diisi" },
        { status: 400 }
      )
    }

    const prompt = `
Buatkan ${jumlah} soal ${tipe_soal === "pg" ? "pilihan ganda" : "essay"}.

Mapel: ${mapel || "-"}
Materi: ${materi}
Tingkat kesulitan: ${tingkat_kesulitan || "sedang"}

WAJIB balas JSON valid saja, tanpa markdown.

Jika PG:
[
  {
    "pertanyaan": "...",
    "opsi": [
      {"label":"A","isi_opsi":"...","is_benar":false},
      {"label":"B","isi_opsi":"...","is_benar":true},
      {"label":"C","isi_opsi":"...","is_benar":false},
      {"label":"D","isi_opsi":"...","is_benar":false},
      {"label":"E","isi_opsi":"...","is_benar":false}
    ],
    "pembahasan": "..."
  }
]

Jika essay:
[
  {
    "pertanyaan": "...",
    "opsi": [],
    "pembahasan": "Rubrik atau jawaban ideal..."
  }
]
`

    const res = await fetch(
      `${process.env.API_AI_URL}/api/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen2.5:7b",
          prompt,
          stream: false,
        }),
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { message: "Gagal menghubungi server AI" },
        { status: 500 }
      )
    }

    const data = await res.json()
    const text = data.response || ""

    const start = text.indexOf("[")
    const end = text.lastIndexOf("]")

    if (start === -1 || end === -1) {
      return NextResponse.json(
        { message: "Format jawaban AI tidak valid", raw: text },
        { status: 400 }
      )
    }

    const soal = JSON.parse(text.slice(start, end + 1))

    return NextResponse.json({ soal })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Terjadi kesalahan AI" },
      { status: 500 }
    )
  }
}