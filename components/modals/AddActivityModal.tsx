"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { addActivity, updateActivity } from "@/lib/firestore/activities"
import { uploadHeroPhoto } from "@/lib/firestore/gallery"
import type { ImportanceLevel } from "@/lib/types"

interface FormValues {
  name: string
  importance: ImportanceLevel
}

interface Props {
  open: boolean
  onClose: () => void
  coupleId: string
  uid: string
  // Edit mode
  activityId?: string
  initialValues?: { name: string; photoUrl: string; importance: ImportanceLevel }
}

const importanceOptions: { value: ImportanceLevel; label: string; classes: string; dot: string }[] = [
  {
    value: "low",
    label: "Baja",
    classes: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/20",
    dot: "bg-emerald-500",
  },
  {
    value: "medium",
    label: "Media",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20",
    dot: "bg-amber-500",
  },
  {
    value: "urgent",
    label: "Urgente",
    classes: "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20",
    dot: "bg-red-500 animate-pulse",
  },
]

export function AddActivityModal({ open, onClose, coupleId, uid, activityId, initialValues }: Props) {
  const isEditMode = Boolean(activityId && initialValues)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadStep, setUploadStep] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "", importance: "medium" },
  })
  const importance = watch("importance")

  // Sync form when modal opens
  useEffect(() => {
    if (open) {
      if (isEditMode && initialValues) {
        reset({ name: initialValues.name, importance: initialValues.importance })
        setPhotoPreview(initialValues.photoUrl || null)
      } else {
        reset({ name: "", importance: "medium" })
        setPhotoPreview(null)
      }
      setPhotoFile(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("La imagen no puede superar 20 MB")
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function onSubmit({ name, importance }: FormValues) {
    setSaving(true)
    try {
      if (isEditMode && activityId) {
        // Edit mode: update only changed fields
        const patch: { name?: string; importance?: ImportanceLevel; photoUrl?: string } = {}
        if (name.trim() !== initialValues?.name) patch.name = name.trim()
        if (importance !== initialValues?.importance) patch.importance = importance

        if (photoFile) {
          setUploadStep("Comprimiendo imagen…")
          const photoUrl = await uploadHeroPhoto(coupleId, activityId, photoFile)
          setUploadStep("Subiendo foto…")
          patch.photoUrl = photoUrl
        }

        if (Object.keys(patch).length > 0) {
          setUploadStep("Guardando cambios…")
          await updateActivity(coupleId, activityId, patch)
        }

        toast.success("¡Plan actualizado!")
      } else {
        // Create mode
        setUploadStep("Guardando plan…")
        const newId = await addActivity(coupleId, {
          name: name.trim(),
          photoUrl: "",
          importance,
          createdBy: uid,
        })

        if (photoFile) {
          setUploadStep("Comprimiendo imagen…")
          const photoUrl = await uploadHeroPhoto(coupleId, newId, photoFile)
          setUploadStep("Subiendo foto…")
          await updateActivity(coupleId, newId, { photoUrl })
        }

        toast.success("¡Plan agregado!")
      }

      reset()
      setPhotoFile(null)
      setPhotoPreview(null)
      onClose()
    } catch {
      toast.error("No se pudo guardar el plan. Intentá de nuevo.")
    } finally {
      setSaving(false)
      setUploadStep(null)
    }
  }

  function handleClose() {
    if (saving) return
    reset()
    setPhotoFile(null)
    setPhotoPreview(null)
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
            className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] border-t border-outline-variant/15 shadow-[0px_-10px_40px_rgba(22,17,28,0.6)] overflow-hidden"
            style={{ background: "rgba(30, 21, 48, 0.97)", backdropFilter: "blur(20px)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full" />
            </div>

            <div className="px-8 pb-10 pt-4">
              <div className="mb-8 text-center">
                <h2 className="font-serif text-3xl text-primary-fixed tracking-tight">
                  {isEditMode ? "Editar actividad" : "Nueva actividad"}
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Photo upload */}
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative w-full h-40 flex flex-col items-center justify-center transition-colors rounded-[24px]"
                    style={{
                      backgroundImage: photoPreview ? "none" : `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='24' ry='24' stroke='%23C2185B' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                    }}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-[24px]"
                      />
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-3 shadow-lg">
                          <span className="text-primary text-3xl">📷</span>
                        </div>
                        <span className="text-outline text-xs uppercase tracking-[0.2em] font-bold">
                          Subir imagen
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-secondary-fixed-dim px-1">
                    Nombre del Plan
                  </label>
                  <input
                    {...register("name", {
                      required: "Poné un nombre al plan",
                      minLength: { value: 3, message: "Mínimo 3 caracteres" },
                      maxLength: { value: 60, message: "Máximo 60 caracteres" },
                    })}
                    placeholder="¿Qué vamos a hacer?"
                    className="w-full bg-surface-container-lowest border-none rounded-xl h-14 px-5 font-serif text-xl italic text-on-surface placeholder:text-outline-variant/60 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                  />
                  {errors.name && (
                    <p className="text-error text-xs px-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Importance */}
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-secondary-fixed-dim text-center">
                    Nivel de Importancia
                  </p>
                  <div className="flex gap-3">
                    {importanceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue("importance", opt.value)}
                        className={`flex-1 py-3 px-2 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${opt.classes} ${
                          importance === opt.value ? "ring-1 ring-current" : ""
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-16 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary-container font-bold uppercase tracking-widest text-sm shadow-[0px_10px_30px_rgba(194,24,91,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                      {uploadStep && <span className="text-xs">{uploadStep}</span>}
                    </>
                  ) : (
                    <>{isEditMode ? "Guardar cambios" : "Guardar plan ♥"}</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
