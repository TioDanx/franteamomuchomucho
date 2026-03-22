"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import { confirmActivity, updateConfirmedActivity } from "@/lib/firestore/activities"
import { notifyPartner } from "@/lib/notifications"
import type { Activity } from "@/lib/types"

interface FormValues {
  date: string
  time: string
}

interface Props {
  open: boolean
  onClose: () => void
  activity: Activity
  coupleId: string
  senderUid: string
  senderName: string
  mode?: "confirm" | "edit"
}

// Module-level Maps loader (loads once per page session)
let mapsReady = false
let mapsLoading = false
const mapsQueue: Array<() => void> = []

function loadGoogleMaps(cb: () => void) {
  if (mapsReady) { cb(); return }
  mapsQueue.push(cb)
  if (mapsLoading) return
  mapsLoading = true
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return
  const s = document.createElement("script")
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
  s.async = true
  s.onload = () => {
    mapsReady = true
    mapsLoading = false
    mapsQueue.splice(0).forEach((fn) => fn())
  }
  document.head.appendChild(s)
}

export function ConfirmActivityModal({ open, onClose, activity, coupleId, senderUid, senderName, mode = "confirm" }: Props) {
  const [saving, setSaving] = useState(false)
  const [addressInput, setAddressInput] = useState("")
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const addressRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null)

  const { register, handleSubmit, reset, trigger, formState: { errors } } = useForm<FormValues>()

  const todayStr = new Date().toISOString().split("T")[0]

  // Init autocomplete each time the modal opens.
  // AnimatePresence unmounts the input when open=false, so each open gives a fresh DOM node.
  useEffect(() => {
    autocompleteRef.current = null

    if (mode === "edit" && open) {
      // Pre-fill location
      if (activity.location) {
        setAddressInput(activity.location.address)
        setLocationCoords(
          activity.location.lat !== undefined
            ? { lat: activity.location.lat!, lng: activity.location.lng! }
            : null
        )
      } else {
        setAddressInput("")
        setLocationCoords(null)
      }
      // Pre-fill date/time
      if (activity.date) {
        const d = activity.date.toDate()
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        reset({ date: `${yyyy}-${mm}-${dd}`, time: activity.time ?? "" })
      }
    } else {
      setAddressInput("")
      setLocationCoords(null)
      if (!open) reset()
    }

    if (!open || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return

    let cancelled = false

    const init = () => {
      if (cancelled || !addressRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google
      if (!g?.maps?.places) return
      const ac = new g.maps.places.Autocomplete(addressRef.current, {
        types: ["establishment", "geocode"],
        fields: ["formatted_address", "name", "geometry.location"],
      })
      ac.addListener("place_changed", () => {
        const place = ac.getPlace()
        const lat: number | undefined = place.geometry?.location?.lat()
        const lng: number | undefined = place.geometry?.location?.lng()
        const addr: string = place.formatted_address || place.name || ""
        setAddressInput(addr)
        setLocationCoords(lat !== undefined && lng !== undefined ? { lat, lng } : null)
      })
      autocompleteRef.current = ac
    }

    loadGoogleMaps(init)

    return () => { cancelled = true }
  }, [open])

  async function onSubmit({ date, time }: FormValues) {
    setSaving(true)
    try {
      const details = {
        date: Timestamp.fromDate(new Date(date)),
        time,
        ...(addressInput.trim()
          ? { location: { address: addressInput.trim(), ...locationCoords } }
          : {}),
      }
      if (mode === "edit") {
        await updateConfirmedActivity(coupleId, activity.id, details)
        toast.success("¡Plan actualizado!")
        notifyPartner({ coupleId, senderUid, senderName, event: "activity_updated", activityName: activity.name, activityId: activity.id })
      } else {
        await confirmActivity(coupleId, activity.id, details)
        toast.success("¡Plan confirmado!")
        notifyPartner({ coupleId, senderUid, senderName, event: "activity_confirmed", activityName: activity.name, activityId: activity.id })
      }
      reset()
      setAddressInput("")
      setLocationCoords(null)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : mode === "edit" ? "No se pudo actualizar" : "No se pudo confirmar")
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (saving) return
    reset()
    setAddressInput("")
    setLocationCoords(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          <motion.section
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2.5rem] border-t border-outline-variant/10 shadow-[0px_-20px_60px_rgba(22,17,28,0.8)]"
            style={{ background: "#1E1530" }}
          >
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-tertiary-fixed-dim/30 rounded-full" />
            </div>

            <div className="px-8 pb-10">
              <div className="text-center mb-8">
                <h2 className="font-serif italic text-3xl text-tertiary-fixed-dim mb-4">
                  {mode === "edit" ? "Editar plan" : "Confirmar plan"}
                </h2>
                <div className="bg-surface-container-lowest/40 p-4 rounded-xl flex items-center gap-4 border border-outline-variant/5">
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                    {activity.photoUrl ? (
                      <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/30 text-xl">♥</div>
                    )}
                  </div>
                  <p className="text-on-surface font-bold text-left">{activity.name}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2 ml-1">
                    Fecha
                  </label>
                  <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/10 rounded-full px-5 py-4 focus-within:border-primary/40 transition-all">
                    <span className="text-tertiary text-lg">📅</span>
                    <input
                      {...register("date", {
                        required: "Elegí una fecha",
                        validate: mode === "edit" ? undefined : (val) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return new Date(`${val}T00:00:00`) >= today || "La fecha debe ser hoy o posterior"
                        },
                        onChange: () => trigger("time"),
                      })}
                      type="date"
                      min={mode === "edit" ? undefined : todayStr}
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline-variant/60 font-medium outline-none"
                    />
                  </div>
                  {errors.date && <p className="text-error text-xs ml-1 mt-1">{errors.date.message}</p>}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2 ml-1">
                    Horario
                  </label>
                  <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/10 rounded-full px-5 py-4 focus-within:border-primary/40 transition-all">
                    <span className="text-tertiary text-lg">🕐</span>
                    <input
                      {...register("time", {
                        required: "Elegí un horario",
                        validate: mode === "edit" ? undefined : (time, { date }) => {
                          if (!date || !time) return true
                          return new Date(`${date}T${time}`) > new Date() || "La fecha y hora no pueden ser en el pasado"
                        },
                      })}
                      type="time"
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-medium outline-none"
                    />
                  </div>
                  {errors.time && <p className="text-error text-xs ml-1 mt-1">{errors.time.message}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-outline mb-2 ml-1">
                    Ubicación <span className="normal-case text-outline/60">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/10 rounded-full px-5 py-4 focus-within:border-primary/40 transition-all">
                    <span className="text-tertiary text-lg">📍</span>
                    <input
                      ref={addressRef}
                      type="text"
                      value={addressInput}
                      onChange={(e) => {
                        setAddressInput(e.target.value)
                        setLocationCoords(null)
                      }}
                      placeholder="Buscar lugar..."
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline-variant/60 font-medium outline-none"
                    />
                    {locationCoords && (
                      <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-5 rounded-full bg-gradient-to-r from-[#9B1D6A] to-primary-container text-on-primary-container font-bold text-lg shadow-[0_10px_30px_rgba(155,29,106,0.3)] active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-5 h-5 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                  ) : (
                    mode === "edit" ? "Guardar cambios ✓" : "Confirmar plan ✓"
                  )}
                </button>
              </form>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}
