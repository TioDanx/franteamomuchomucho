"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/useAuth"
import { getActivity, completeActivity, deleteActivity } from "@/lib/firestore/activities"
import { setReview, deleteReview, subscribeReviews } from "@/lib/firestore/reviews"
import { CountdownTimer } from "@/components/activity/CountdownTimer"
import { ImportanceBadge } from "@/components/activity/ImportanceBadge"
import { StarRating } from "@/components/activity/StarRating"
import { Pencil, Trash2 } from "lucide-react"
import { MapsButton } from "@/components/activity/MapsButton"
import { AddToCalendar } from "@/components/activity/AddToCalendar"
import { PhotoGallery } from "@/components/activity/PhotoGallery"
import { ConfirmActivityModal } from "@/components/modals/ConfirmActivityModal"
import { AddActivityModal } from "@/components/modals/AddActivityModal"
import type { Activity, Review } from "@/lib/types"

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, firebaseUser } = useAuth()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [loading, setLoading] = useState(true)
  type ReviewMode = "write" | "view" | "edit"
  const [reviewMode, setReviewMode] = useState<ReviewMode>("write")
  const [draftRating, setDraftRating] = useState(0)
  const [draftComment, setDraftComment] = useState("")
  const [saving, setSaving] = useState(false)

  const coupleId = user?.coupleId

  useEffect(() => {
    if (!coupleId) return
    getActivity(coupleId, id).then((a) => {
      setActivity(a)
      setLoading(false)
    })
  }, [coupleId, id])

  useEffect(() => {
    if (!coupleId || !activity || activity.status !== "done") return
    const unsub = subscribeReviews(coupleId, id, setReviews)
    return unsub
  }, [coupleId, id, activity?.status])

  async function handleComplete() {
    if (!coupleId) return
    setCompleting(true)
    try {
      await completeActivity(coupleId, id)
      const updated = await getActivity(coupleId, id)
      setActivity(updated)
      toast.success("¡Actividad completada!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar")
    } finally {
      setCompleting(false)
    }
  }

  // Sync review mode from Firestore snapshot
  useEffect(() => {
    const myReview = reviews.find((r) => r.author === firebaseUser?.uid)
    if (myReview) {
      setReviewMode((prev) => prev === "edit" ? prev : "view")
      setDraftRating((prev) => prev === 0 ? myReview.rating : prev)
      setDraftComment((prev) => prev === "" ? (myReview.comment ?? "") : prev)
    } else {
      setReviewMode("write")
      setDraftRating(0)
      setDraftComment("")
    }
  }, [reviews, firebaseUser?.uid])

  async function handleSubmitReview() {
    if (draftRating === 0 || !coupleId || !firebaseUser || !user) return
    setSaving(true)
    try {
      await setReview(
        coupleId, id, firebaseUser.uid,
        { rating: draftRating, comment: draftComment },
        user.displayName,
        user.photoURL ?? firebaseUser.photoURL ?? undefined
      )
      setReviewMode("view")
    } catch {
      toast.error("No se pudo guardar la reseña")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReview() {
    if (!coupleId || !firebaseUser) return
    setSaving(true)
    try {
      await deleteReview(coupleId, id, firebaseUser.uid)
      toast.success("Reseña eliminada")
    } catch {
      toast.error("No se pudo eliminar la reseña")
    } finally {
      setSaving(false)
    }
  }

  function handleStartEdit() {
    const myReview = reviews.find((r) => r.author === firebaseUser?.uid)
    if (!myReview) return
    setDraftRating(myReview.rating)
    setDraftComment(myReview.comment ?? "")
    setReviewMode("edit")
  }

  function handleCancelEdit() {
    setReviewMode("view")
  }

  async function handleDelete() {
    if (!coupleId) return
    setDeleting(true)
    try {
      await deleteActivity(coupleId, id)
      toast.success("Actividad eliminada")
      router.back()
    } catch {
      toast.error("No se pudo eliminar la actividad")
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  if (loading || !activity) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const myReview = reviews.find((r) => r.author === firebaseUser?.uid)

  return (
    <div className="min-h-dvh bg-surface pb-36 text-on-surface">
      {/* Hero */}
      <header className="relative h-[335px] w-full overflow-hidden rounded-b-[24px]">
        {activity.photoUrl ? (
          <img
            src={activity.photoUrl}
            alt={activity.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-container-high flex items-center justify-center text-6xl">
            ♥
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-transparent to-surface" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 pt-12 z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/20 backdrop-blur-md text-white active:scale-95 transition-all"
            aria-label="Volver"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <ImportanceBadge level={activity.importance} />
            <button
              onClick={() => setEditOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface/20 backdrop-blur-md text-white active:scale-95 transition-all"
              aria-label="Editar actividad"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <h1 className="font-serif text-4xl font-bold text-white leading-tight drop-shadow-lg">
            {activity.name}
          </h1>
        </div>
      </header>

      <main className="px-6 -mt-4 relative z-20 space-y-6">
        {/* ── TODO state ─────────────────────────── */}
        {activity.status === "todo" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-low rounded-2xl p-6 text-center"
          >
            <p className="text-on-surface-variant text-sm mb-4">
              Todavía no tiene fecha confirmada
            </p>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary-container font-bold tracking-widest uppercase text-sm shadow-[0px_8px_24px_rgba(194,24,91,0.3)] active:scale-95 transition-all"
            >
              Confirmar plan ✓
            </button>
          </motion.div>
        )}

        {/* ── CONFIRMED state ────────────────────── */}
        {activity.status === "confirmed" && activity.date && (
          <>
            {/* Countdown card */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary-container/10 backdrop-blur-xl border border-primary/10 rounded-2xl p-6 flex flex-col items-center text-center"
            >
              <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
                Falta para este plan
              </p>
              <CountdownTimer targetDate={activity.date.toDate()} />
            </motion.section>

            {/* Info grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-outline font-bold">Detalles</span>
                <button
                  onClick={() => setEditConfirmOpen(true)}
                  className="flex items-center gap-1 text-on-surface-variant text-xs hover:text-primary transition-colors"
                >
                  <Pencil size={12} />
                  Editar fecha / lugar
                </button>
              </div>
              <InfoRow icon="📅" label="Fecha">
                {format(activity.date.toDate(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
              </InfoRow>
              {activity.time && (
                <InfoRow icon="🕐" label="Hora">{activity.time}</InfoRow>
              )}
              {activity.location && (
                <InfoRow icon="📍" label="Lugar">{activity.location.address}</InfoRow>
              )}
            </div>

            {/* Map */}
            {activity.location && <MapsButton location={activity.location} />}
            {/* Calendar */}
            <AddToCalendar activity={activity} />
          </>
        )}

        {/* ── DONE state ─────────────────────────── */}
        {activity.status === "done" && (
          <>
            {activity.completedAt && (
              <div className="text-center text-on-surface-variant text-sm">
                Realizada el{" "}
                <span className="text-on-surface font-medium">
                  {format(activity.completedAt.toDate(), "d 'de' MMMM yyyy", { locale: es })}
                </span>
              </div>
            )}

            {activity.date && (
              <div className="space-y-3">
                <InfoRow icon="📅" label="Fecha">
                  {format(activity.date.toDate(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </InfoRow>
                {activity.time && <InfoRow icon="🕐" label="Hora">{activity.time}</InfoRow>}
                {activity.location && <InfoRow icon="📍" label="Lugar">{activity.location.address}</InfoRow>}
              </div>
            )}

            {/* Reviews */}
            <section className="bg-surface-container-low rounded-2xl p-6 space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-outline">Reseñas</h2>

              {/* My review */}
              <AnimatePresence mode="wait">
                {(reviewMode === "write" || reviewMode === "edit") && (
                  <motion.div
                    key={reviewMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      {(user?.photoURL || firebaseUser?.photoURL) ? (
                        <img
                          src={(user?.photoURL || firebaseUser?.photoURL)!}
                          alt={user?.displayName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                          {user?.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-on-surface-variant font-medium">{user?.displayName}</p>
                        <StarRating value={draftRating} onChange={setDraftRating} size="sm" />
                      </div>
                    </div>
                    <textarea
                      value={draftComment}
                      onChange={(e) => setDraftComment(e.target.value)}
                      placeholder="¿Qué les pareció? (opcional)"
                      rows={2}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:border-primary/40 transition-colors resize-none"
                    />
                    {reviewMode === "edit" ? (
                      <div className="flex gap-3">
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface text-sm font-medium active:scale-95 transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSubmitReview}
                          disabled={draftRating === 0 || saving}
                          className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary-container text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
                        >
                          {saving ? (
                            <div className="w-4 h-4 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                          ) : "Guardar cambios"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmitReview}
                        disabled={draftRating === 0 || saving}
                        className="w-full py-3 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary-container font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
                      >
                        {saving ? (
                          <div className="w-4 h-4 rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container animate-spin" />
                        ) : "Enviar reseña"}
                      </button>
                    )}
                  </motion.div>
                )}

                {reviewMode === "view" && myReview && (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {(user?.photoURL || firebaseUser?.photoURL) ? (
                          <img
                            src={(user?.photoURL || firebaseUser?.photoURL)!}
                            alt={user?.displayName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                            {user?.displayName[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-on-surface-variant font-medium">{user?.displayName}</p>
                          <StarRating value={myReview.rating} readonly size="sm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleStartEdit}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all"
                          aria-label="Editar reseña"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={handleDeleteReview}
                          disabled={saving}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-error/60 hover:text-error hover:bg-error/10 active:scale-90 transition-all disabled:opacity-40"
                          aria-label="Eliminar reseña"
                        >
                          {saving ? (
                            <div className="w-3 h-3 rounded-full border border-error/40 border-t-error animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                    {myReview.comment && (
                      <p className="text-sm text-on-surface-variant ml-11">{myReview.comment}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Partner reviews */}
              {reviews.filter((r) => r.author !== firebaseUser?.uid).map((r) => (
                <div key={r.author} className="border-t border-outline-variant/15 pt-4 space-y-2">
                  <div className="flex items-center gap-3">
                    {r.authorPhotoUrl ? (
                      <img
                        src={r.authorPhotoUrl}
                        alt={r.authorName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-xs font-bold text-on-tertiary-container">
                        {r.authorName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">{r.authorName}</p>
                      <StarRating value={r.rating} readonly size="sm" />
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-on-surface-variant ml-11">{r.comment}</p>
                  )}
                </div>
              ))}
            </section>

            {/* Gallery */}
            {coupleId && firebaseUser && (
              <section className="bg-surface-container-low rounded-2xl p-6">
                <PhotoGallery
                  coupleId={coupleId}
                  activityId={id}
                  uid={firebaseUser.uid}
                />
              </section>
            )}
          </>
        )}
        {/* Delete section */}
        <div className="pt-4 pb-2">
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full py-3 rounded-2xl border border-error/20 text-error/60 text-sm font-medium hover:border-error/40 hover:text-error hover:bg-error/5 active:scale-95 transition-all"
            >
              Eliminar actividad
            </button>
          ) : (
            <div className="bg-error/10 border border-error/20 rounded-2xl p-4 space-y-3">
              <p className="text-error text-sm text-center font-medium">
                ¿Seguro que querés eliminar &ldquo;{activity.name}&rdquo;?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full border border-outline-variant text-on-surface text-sm font-medium active:scale-95 transition-all disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-full bg-error text-on-error text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                >
                  {deleting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-on-error/40 border-t-on-error animate-spin" />
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed bottom: complete button for confirmed activities */}
      {activity.status === "confirmed" && (
        <div className="fixed bottom-0 left-0 w-full px-6 pb-8 pt-4 bg-gradient-to-t from-surface via-surface/95 to-transparent z-50">
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-5 rounded-full bg-on-primary-fixed-variant text-secondary font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-3 shadow-[0px_-10px_30px_rgba(22,17,28,0.5)] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {completing ? (
              <div className="w-5 h-5 rounded-full border-2 border-secondary/40 border-t-secondary animate-spin" />
            ) : (
              "✓ Completar actividad"
            )}
          </button>
        </div>
      )}

      {/* Edit confirmed modal */}
      {activity.status === "confirmed" && coupleId && (
        <ConfirmActivityModal
          open={editConfirmOpen}
          onClose={() => {
            setEditConfirmOpen(false)
            if (coupleId) getActivity(coupleId, id).then(setActivity)
          }}
          activity={activity}
          coupleId={coupleId}
          mode="edit"
        />
      )}

      {/* Confirm modal */}
      {activity.status === "todo" && (
        <ConfirmActivityModal
          open={confirmOpen}
          onClose={() => {
            setConfirmOpen(false)
            // Refresh activity after confirm
            if (coupleId) getActivity(coupleId, id).then(setActivity)
          }}
          activity={activity}
          coupleId={coupleId!}
        />
      )}

      {/* Edit modal */}
      {coupleId && firebaseUser && (
        <AddActivityModal
          open={editOpen}
          onClose={() => {
            setEditOpen(false)
            if (coupleId) getActivity(coupleId, id).then(setActivity)
          }}
          coupleId={coupleId}
          uid={firebaseUser.uid}
          activityId={id}
          initialValues={{
            name: activity.name,
            photoUrl: activity.photoUrl,
            importance: activity.importance,
          }}
        />
      )}
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
      <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-xl mr-4 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-0.5">{label}</p>
        <p className="text-on-surface font-medium truncate">{children}</p>
      </div>
    </div>
  )
}
