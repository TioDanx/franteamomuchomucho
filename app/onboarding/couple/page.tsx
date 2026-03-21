"use client"

import { Suspense } from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import { createCouple, joinCouple, getInvitePreview } from "@/lib/firestore/couples"
import type { InvitePreview } from "@/lib/firestore/couples"

type Mode = "choose" | "create" | "join" | "preview"

interface JoinForm {
  code: string
}

function CouplePageInner() {
  const { user, firebaseUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledCode = searchParams.get("code")?.toUpperCase() ?? ""
  const [mode, setMode] = useState<Mode>(prefilledCode ? "join" : "choose")
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [pendingCode, setPendingCode] = useState<string>("")
  const [preview, setPreview] = useState<InvitePreview | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<JoinForm>({
    defaultValues: { code: prefilledCode },
  })

  async function handleCreate() {
    if (!firebaseUser || !user) return
    setLoading(true)
    try {
      const photo = user.photoURL ?? firebaseUser.photoURL ?? undefined
      const code = await createCouple(firebaseUser.uid, user.displayName, photo)
      setInviteCode(code)
      setMode("create")
      router.refresh()
    } catch {
      toast.error("No se pudo crear la pareja. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleLookupCode({ code }: JoinForm) {
    if (!firebaseUser || !user) return
    setLoading(true)
    try {
      const result = await getInvitePreview(code.trim().toUpperCase())
      if (!result) {
        toast.error("Código inválido o expirado")
        return
      }
      setPendingCode(code.trim().toUpperCase())
      setPreview(result)
      setMode("preview")
    } catch {
      toast.error("No se pudo verificar el código")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmJoin() {
    if (!firebaseUser || !user || !pendingCode) return
    setLoading(true)
    try {
      const photo = user.photoURL ?? firebaseUser.photoURL ?? undefined
      const coupleId = await joinCouple(firebaseUser.uid, user.displayName, pendingCode, photo)
      const maxAge = 60 * 60 * 24 * 30
      document.cookie = `couple_id=${coupleId}; path=/; max-age=${maxAge}; SameSite=Lax`
      toast.success("¡Te uniste a la pareja!")
      router.push("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido")
      setLoading(false)
    }
  }

  async function handleGoToDashboard() {
    router.push("/dashboard")
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at center, #1A1025 0%, #0A0612 100%)" }}
    >
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">

          {/* Choose mode */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-on-surface-variant text-sm mb-6 hover:text-on-surface transition-colors"
              >
                ← Volver
              </button>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Tu pareja</h1>
                <p className="text-on-surface-variant text-sm">
                  ¿Creás el espacio o te unís a uno existente?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full glass-card border border-primary/20 rounded-2xl p-5 text-left transition-all hover:border-primary/40 active:scale-[0.98] disabled:opacity-60"
                >
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-semibold text-on-surface">Crear pareja</div>
                  <div className="text-on-surface-variant text-sm mt-1">
                    Generás un código para invitar a tu pareja
                  </div>
                </button>

                <button
                  onClick={() => setMode("join")}
                  className="w-full glass-card border border-outline-variant/20 rounded-2xl p-5 text-left transition-all hover:border-outline-variant/40 active:scale-[0.98]"
                >
                  <div className="text-2xl mb-2">🔗</div>
                  <div className="font-semibold text-on-surface">Unirme con código</div>
                  <div className="text-on-surface-variant text-sm mt-1">
                    Tu pareja ya creó el espacio
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Created — show invite code */}
          {mode === "create" && inviteCode && (
            <motion.div
              key="created"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="mb-6">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">¡Listo!</h1>
                <p className="text-on-surface-variant text-sm">
                  Compartí este código con tu pareja
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 border border-primary/20 mb-6">
                <div className="text-5xl font-serif font-bold text-primary tracking-[0.3em] select-all">
                  {inviteCode}
                </div>
                <p className="text-on-surface-variant text-xs mt-3">Válido por 7 días</p>
              </div>

              <button
                onClick={async () => {
                  const url = `${window.location.origin}/join/${inviteCode}`
                  if (navigator.share) {
                    await navigator.share({ title: "Nuestros Planes", text: "Unite a nuestra pareja ♥", url })
                  } else {
                    await navigator.clipboard.writeText(url)
                    toast.success("Link copiado")
                  }
                }}
                className="w-full bg-primary-container text-on-primary-container font-semibold rounded-full py-3.5 mb-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                Compartir link de invitación
              </button>

              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteCode)
                  toast.success("Código copiado")
                }}
                className="w-full border border-outline-variant/30 text-on-surface-variant rounded-full py-3 mb-3 transition-all hover:border-primary/30 hover:text-primary active:scale-95"
              >
                Copiar solo el código
              </button>

              <button
                onClick={handleGoToDashboard}
                className="w-full text-on-surface-variant text-sm py-2 transition-colors hover:text-on-surface"
              >
                Ir al dashboard →
              </button>
            </motion.div>
          )}

          {/* Join mode — enter code */}
          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => setMode("choose")}
                className="flex items-center gap-1 text-on-surface-variant text-sm mb-6 hover:text-on-surface transition-colors"
              >
                ← Volver
              </button>

              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">Unirme</h1>
                <p className="text-on-surface-variant text-sm">
                  Ingresá el código que te compartió tu pareja
                </p>
              </div>

              <form onSubmit={handleSubmit(handleLookupCode)} className="glass-card rounded-2xl p-8 border border-outline-variant/10">
                <input
                  {...register("code", {
                    required: "Ingresá el código",
                    minLength: { value: 6, message: "El código tiene 6 caracteres" },
                    maxLength: { value: 6, message: "El código tiene 6 caracteres" },
                  })}
                  placeholder="XXXXXX"
                  autoFocus
                  maxLength={6}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/60 transition-colors text-center font-serif text-3xl tracking-[0.3em] uppercase mb-4"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase()
                  }}
                />
                {errors.code && (
                  <p className="text-error text-xs text-center mb-4">{errors.code.message}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-container text-on-primary-container font-semibold rounded-full py-3.5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                  ) : (
                    "Siguiente →"
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Preview — confirm joining */}
          {mode === "preview" && preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-white mb-2">¿Te unís?</h1>
              </div>

              <div className="glass-card rounded-2xl p-8 border border-primary/20 mb-6 flex flex-col items-center gap-4">
                {preview.creatorPhoto ? (
                  <img
                    src={preview.creatorPhoto}
                    alt={preview.creatorName}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-3xl font-bold text-on-primary-container">
                    {preview.creatorName[0]?.toUpperCase()}
                  </div>
                )}
                <p className="text-on-surface text-lg">
                  ¿Te querés unir a la pareja de{" "}
                  <span className="font-bold text-primary-fixed">{preview.creatorName}</span>?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setMode("join"); setPreview(null) }}
                  disabled={loading}
                  className="flex-1 border border-outline-variant/30 text-on-surface-variant rounded-full py-3.5 transition-all hover:border-outline-variant/60 active:scale-95 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={loading}
                  className="flex-1 bg-primary-container text-on-primary-container font-semibold rounded-full py-3.5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                  ) : (
                    "Unirme ♥"
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default function CouplePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <CouplePageInner />
    </Suspense>
  )
}
