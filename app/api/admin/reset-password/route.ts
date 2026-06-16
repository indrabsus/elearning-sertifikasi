import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id_profile } = body

    if (!id_profile) {
      return NextResponse.json(
        { message: "id_profile wajib diisi" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      id_profile,
      {
        password: "123456",
      }
    )

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Password berhasil direset menjadi 123456",
    })
  } catch {
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}