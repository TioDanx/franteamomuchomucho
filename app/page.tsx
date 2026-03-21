"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/hooks/useAuth"

const FEATURES = [
  { num: "01", emoji: "📝", text: "Creen y descubran planes juntos" },
  { num: "02", emoji: "📅", text: "Confirmen fechas, lugar y horario" },
  { num: "03", emoji: "✨", text: "Revivan sus mejores momentos" },
]

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      if (user.coupleId) {
        router.replace("/dashboard")
      } else {
        router.replace("/onboarding")
      }
    }
  }, [user, loading, router])

  async function handleSignIn() {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      setError("No se pudo iniciar sesión. Intentá de nuevo.")
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="h-dvh flex flex-col relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #1f1030 0%, #0A0612 60%)" }}
    >
      {/* Ambient blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-secondary/6 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary-container/5 blur-[80px] pointer-events-none" />

      {/* Large decorative heart — background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute right-[-1rem] top-[10%] text-[18rem] leading-none text-primary/[0.04] pointer-events-none select-none font-serif"
        style={{ transform: "rotate(12deg)" }}
      >
        ♥
      </motion.div>

      {/* ── Top wordmark ─────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center gap-2 px-7 pt-12"
      >
        <span className="text-primary text-base leading-none">♥</span>
        <span className="font-serif italic text-base text-on-surface-variant tracking-wide">
          Nuestros Planes
        </span>
      </motion.header>

      {/* ── Hero headline ────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col justify-between px-7 pb-10 pt-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-serif italic font-bold text-white leading-[1.05] mb-2"
            style={{ fontSize: "clamp(2.8rem, 12vw, 4.2rem)" }}
          >
            Planeen,<br />
            vivan y<br />
            recuerden<br />
            <span className="text-primary">juntos.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-on-surface-variant text-sm mt-3"
          >
            Su espacio privado para todo lo que quieren hacer.
          </motion.p>
        </div>

        {/* ── Feature rows ─────────────────────────── */}
        <div className="my-6 space-y-0">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.55 + i * 0.1, ease: "easeOut" }}
              className="flex items-center gap-4 py-3.5 border-b border-outline-variant/15 last:border-0"
            >
              <span className="font-serif italic text-outline/50 text-xs w-5 flex-shrink-0">
                {f.num}
              </span>
              <span className="text-lg leading-none flex-shrink-0">{f.emoji}</span>
              <span className="text-on-surface text-[0.9rem] font-medium">{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* ── CTA ──────────────────────────────────── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold rounded-full py-4 px-6 shadow-[0_8px_32px_rgba(255,177,194,0.18)] transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {signingIn ? "Entrando…" : "Entrar con Google"}
            </button>

            {error && (
              <p className="mt-3 text-center text-error text-sm">{error}</p>
            )}

            <p className="text-center text-on-surface-variant/50 text-xs mt-4 tracking-wide">
              Solo para Dani y Fran · acceso privado ♥
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
