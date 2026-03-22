"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { updateUserDisplayName } from "@/lib/firestore/users"
import { getCouple } from "@/lib/firestore/couples"
import { usePushNotifications } from "@/lib/hooks/usePushNotifications"
import type { UserProfile } from "@/lib/types"
import type { User } from "firebase/auth"

interface Props {
  open: boolean
  onClose: () => void
  user: UserProfile
  firebaseUser: User
  onSignOut: () => void
  onUpdateUser: (patch: Partial<UserProfile>) => void
}

interface NameForm {
  displayName: string
}

interface PartnerInfo {
  displayName: string
  photoURL?: string
}

export function ProfileSidebar({ open, onClose, user, firebaseUser, onSignOut, onUpdateUser }: Props) {
  const [editingName, setEditingName] = useState(false)
  const [saving, setSaving] = useState(false)
  const [partner, setPartner] = useState<PartnerInfo | null>(null)
  const { permission, requestPermission } = usePushNotifications(user.coupleId ?? null, firebaseUser.uid)

  useEffect(() => {
    if (!open || !user.coupleId) return
    getCouple(user.coupleId).then((couple) => {
      if (!couple) return
      const partnerUid = couple.members.find((m) => m !== user.uid)
      if (!partnerUid) return
      setPartner({
        displayName: couple.memberNames?.[partnerUid] ?? "Pareja",
        photoURL: couple.memberPhotos?.[partnerUid] || undefined,
      })
    })
  }, [open, user.coupleId, user.uid])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NameForm>({
    defaultValues: { displayName: user.displayName },
  })

  async function onSaveName({ displayName }: NameForm) {
    setSaving(true)
    try {
      const trimmed = displayName.trim()
      await updateUserDisplayName(firebaseUser.uid, trimmed)
      onUpdateUser({ displayName: trimmed })
      toast.success("Nombre actualizado")
      setEditingName(false)
    } catch {
      toast.error("No se pudo actualizar el nombre")
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setEditingName(false)
    reset({ displayName: user.displayName })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface/60 backdrop-blur-sm z-[80]"
            onClick={handleClose}
          />

          {/* Sidebar */}
          <motion.aside
            key="sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 z-[90] flex flex-col border-l border-outline-variant/15 shadow-[-20px_0_60px_rgba(22,17,28,0.6)]"
            style={{ background: "rgba(30, 21, 48, 0.97)", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-outline-variant/15">
              <h2 className="font-serif text-xl text-on-surface">Mi perfil</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-8 space-y-8 overflow-y-auto">
              {/* Avatar + name */}
              <div className="flex flex-col items-center gap-4">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={user.displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-3xl font-serif text-on-primary-container">
                    {user.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-serif text-2xl text-on-surface">{user.displayName}</p>
                  <p className="text-on-surface-variant text-sm mt-0.5">{firebaseUser.email}</p>
                </div>
              </div>

              {/* Partner */}
              {partner && (
                <div className="bg-surface-container-low rounded-2xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Tu pareja</p>
                  <div className="flex items-center gap-3">
                    {partner.photoURL ? (
                      <img
                        src={partner.photoURL}
                        alt={partner.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-tertiary/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-xl font-serif text-on-tertiary-container">
                        {partner.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                    <p className="font-serif text-xl text-on-surface">{partner.displayName}</p>
                  </div>
                </div>
              )}

              {/* Edit name */}
              <div className="bg-surface-container-low rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-outline">
                    Nombre visible
                  </p>
                  {!editingName && (
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-primary text-xs font-semibold hover:text-primary/80 transition-colors"
                    >
                      Cambiar
                    </button>
                  )}
                </div>

                {editingName ? (
                  <form onSubmit={handleSubmit(onSaveName)} className="space-y-3">
                    <input
                      {...register("displayName", {
                        required: "Ingresá un nombre",
                        minLength: { value: 2, message: "Mínimo 2 caracteres" },
                        maxLength: { value: 20, message: "Máximo 20 caracteres" },
                      })}
                      autoFocus
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/60 transition-colors font-serif text-lg"
                    />
                    {errors.displayName && (
                      <p className="text-error text-xs">{errors.displayName.message}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingName(false); reset({ displayName: user.displayName }) }}
                        className="flex-1 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant text-sm transition-all hover:border-outline-variant/60"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center"
                      >
                        {saving ? (
                          <div className="w-4 h-4 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                        ) : "Guardar"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="font-serif text-lg text-on-surface">{user.displayName}</p>
                )}
              </div>
              {/* Notifications */}
              <div className="bg-surface-container-low rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Notificaciones</p>
                {permission === "granted" && (
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <p className="text-on-surface-variant text-sm">Activadas</p>
                  </div>
                )}
                {permission === "denied" && (
                  <p className="text-on-surface-variant text-sm">
                    Bloqueadas por el navegador. Para activarlas, permitilas desde la configuración del sitio.
                  </p>
                )}
                {permission === "default" && (
                  <button
                    onClick={requestPermission}
                    className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold transition-all active:scale-95"
                  >
                    🔔 Activar notificaciones
                  </button>
                )}
              </div>
            </div>

            {/* Footer: logout */}
            <div className="px-6 pb-10 pt-4 border-t border-outline-variant/15">
              <button
                onClick={onSignOut}
                className="w-full py-3.5 rounded-full border border-error/30 text-error font-semibold text-sm transition-all hover:bg-error/5 active:scale-95"
              >
                Cerrar sesión
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
