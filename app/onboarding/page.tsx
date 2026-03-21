"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import { updateUserDisplayName } from "@/lib/firestore/users"

interface FormValues {
  displayName: string
}

export default function OnboardingPage() {
  const { user, firebaseUser, signOut } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [autoSkipping, setAutoSkipping] = useState(false)

  const googleName = firebaseUser?.displayName?.split(" ")[0] ?? ""

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { displayName: googleName },
  })

  // Si Google ya provee un nombre, guardarlo automáticamente y saltar este paso
  useEffect(() => {
    if (!firebaseUser || !googleName) return
    setAutoSkipping(true)
    updateUserDisplayName(firebaseUser.uid, googleName)
      .then(() => router.replace("/onboarding/couple"))
      .catch(() => setAutoSkipping(false))
  }, [firebaseUser, googleName, router])

  async function onSubmit({ displayName }: FormValues) {
    if (!firebaseUser) return
    setSaving(true)
    try {
      await updateUserDisplayName(firebaseUser.uid, displayName.trim())
      router.push("/onboarding/couple")
    } catch {
      toast.error("No se pudo guardar el nombre. Intentá de nuevo.")
      setSaving(false)
    }
  }

  async function handleBack() {
    await signOut()
    router.replace("/")
  }

  // Mostrar loading mientras se auto-salta
  if (autoSkipping || googleName) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: "radial-gradient(circle at center, #1A1025 0%, #0A0612 100%)" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // Solo mostrar el form si Google no provee nombre (caso raro)
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at center, #1A1025 0%, #0A0612 100%)" }}
    >
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-on-surface-variant text-sm mb-6 hover:text-on-surface transition-colors"
        >
          ← Salir
        </button>

        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-white mb-2">¡Hola!</h1>
          <p className="text-on-surface-variant text-sm">¿Cómo te llamamos?</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-2xl p-8 border border-outline-variant/10">
          <div className="mb-6">
            <input
              {...register("displayName", {
                required: "Necesitamos un nombre",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
                maxLength: { value: 20, message: "Máximo 20 caracteres" },
              })}
              placeholder="Tu nombre"
              autoFocus
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors text-center font-serif text-xl"
            />
            {errors.displayName && (
              <p className="mt-2 text-error text-xs text-center">{errors.displayName.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary-container text-on-primary-container font-semibold rounded-full py-3.5 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
            ) : "Continuar →"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
