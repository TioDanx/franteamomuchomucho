import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/"]
const ONBOARDING_ROUTES = ["/onboarding", "/onboarding/couple"]
const PROTECTED_ROUTES = ["/dashboard", "/activity"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const uid = request.cookies.get("uid")?.value
  const coupleId = request.cookies.get("couple_id")?.value

  const isAuthenticated = Boolean(uid)
  const hasCouple = Boolean(coupleId)

  // Public route: redirect authenticated users with couple to dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isAuthenticated && hasCouple) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    if (isAuthenticated && !hasCouple) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
    return NextResponse.next()
  }

  // Onboarding routes: need auth, redirect to "/" if not authenticated
  if (ONBOARDING_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (hasCouple) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Protected routes: need auth + couple
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (!hasCouple) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
