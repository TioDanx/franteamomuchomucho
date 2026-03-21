import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const { cloudinaryId } = await req.json()

  if (!cloudinaryId || typeof cloudinaryId !== "string") {
    return NextResponse.json({ error: "cloudinaryId requerido" }, { status: 400 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 500 })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${cloudinaryId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const body = new URLSearchParams({
    public_id: cloudinaryId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  })

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body }
  )

  if (!res.ok) {
    const data = await res.json()
    return NextResponse.json({ error: data.error?.message ?? "Error al eliminar" }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
