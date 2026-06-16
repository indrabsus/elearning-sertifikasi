import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedRoutes = [
    "/admin",
    "/kurikulum",
    "/kajur",
    "/guru",
    "/siswa",
  ]

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const token =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("supabase-auth-token")?.value

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [],
}