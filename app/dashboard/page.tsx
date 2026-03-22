"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/lib/hooks/useAuth"
import { useActivities } from "@/lib/hooks/useActivities"
import { useCountdown } from "@/lib/hooks/useCountdown"
import { getCountdown, setCountdown, deleteCountdown } from "@/lib/firestore/config"
import { notifyPartner } from "@/lib/notifications"
import { usePushNotifications } from "@/lib/hooks/usePushNotifications"
import { CountdownTimer } from "@/components/activity/CountdownTimer"
import { ActivityCard } from "@/components/activity/ActivityCard"
import { AddActivityModal } from "@/components/modals/AddActivityModal"
import { ProfileSidebar } from "@/components/auth/ProfileSidebar"
import type { ActivityStatus, CountdownConfig, ImportanceLevel } from "@/lib/types"

const TABS: { status: ActivityStatus; label: string; emoji: string }[] = [
  { status: "todo", label: "Por hacer", emoji: "📝" },
  { status: "confirmed", label: "Confirmadas", emoji: "📅" },
  { status: "done", label: "Realizadas", emoji: "✅" },
]

export default function DashboardPage() {
  const { user, firebaseUser, loading: authLoading, signOut, updateUser } = useAuth()
  const { data: activities, loading } = useActivities(user?.coupleId ?? null)
  const [activeTab, setActiveTab] = useState<ActivityStatus>("todo")
  const [addOpen, setAddOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterImportance, setFilterImportance] = useState<ImportanceLevel | null>(null)
  const router = useRouter()
  const { permission, requestPermission } = usePushNotifications(user?.coupleId ?? null, firebaseUser?.uid ?? null)
  const [notifDismissed, setNotifDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("notif-dismissed") === "1"
  })

  function dismissNotifBanner() {
    localStorage.setItem("notif-dismissed", "1")
    setNotifDismissed(true)
  }

  // Countdown state — undefined = loading, null = no date set
  const [countdownConfig, setCountdownConfig] = useState<CountdownConfig | null | undefined>(undefined)
  const [cdOpen, setCdOpen] = useState(false)
  const [cdDateStr, setCdDateStr] = useState("")

  const countdownDate = useMemo(
    () => countdownConfig?.targetDate?.toDate() ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countdownConfig?.targetDate?.seconds]
  )
  const countdown = useCountdown(countdownDate)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user?.coupleId) return
    getCountdown(user.coupleId).then(setCountdownConfig)
  }, [user?.coupleId])

  async function handleSaveCountdown() {
    if (!user?.coupleId || !firebaseUser || !cdDateStr) return
    const isNew = countdownConfig === null
    const ts = Timestamp.fromDate(new Date(cdDateStr))
    await setCountdown(user.coupleId, firebaseUser.uid, ts)
    setCountdownConfig({ targetDate: ts, updatedBy: firebaseUser.uid, updatedAt: Timestamp.now() })
    setCdOpen(false)
    if (isNew) {
      notifyPartner({ coupleId: user.coupleId, senderUid: firebaseUser.uid, senderName: user.displayName, event: "countdown_created" })
    }
  }

  async function handleDeleteCountdown() {
    if (!user?.coupleId || !firebaseUser) return
    await deleteCountdown(user.coupleId)
    setCountdownConfig(null)
    notifyPartner({ coupleId: user.coupleId, senderUid: firebaseUser.uid, senderName: user.displayName, event: "countdown_deleted" })
  }

  function openCdSheet() {
    if (countdownConfig?.targetDate) {
      const d = countdownConfig.targetDate.toDate()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const hh = String(d.getHours()).padStart(2, "0")
      const min = String(d.getMinutes()).padStart(2, "0")
      setCdDateStr(`${yyyy}-${mm}-${dd}T${hh}:${min}`)
    } else {
      setCdDateStr("")
    }
    setCdOpen(true)
  }

  async function handleSignOut() {
    await signOut()
    router.replace("/")
  }

  const overdueConfirmed = useMemo(
    () => activities.filter((a) => a.status === "confirmed" && a.date && a.date.toDate() < new Date()),
    [activities]
  )

  const filtered = useMemo(() => {
    let list = activities.filter((a) => a.status === activeTab)
    if (activeTab === "done") {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        list = list.filter((a) => a.name.toLowerCase().includes(q))
      }
      if (filterImportance) {
        list = list.filter((a) => a.importance === filterImportance)
      }
    }
    return list
  }, [activities, activeTab, searchQuery, filterImportance])

  if (authLoading || !user || !firebaseUser) return null

  return (
    <div className="min-h-dvh bg-surface pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#16111C]/80 backdrop-blur-xl shadow-[0px_4px_40px_rgba(255,177,194,0.05)]">
        <h1 className="font-serif italic font-bold text-2xl tracking-tight text-primary-container">
          Nuestros Planes
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 bg-surface-container-highest px-3 py-1.5 rounded-full border border-outline-variant/15 text-sm font-medium transition-all hover:border-outline-variant/40 active:scale-95"
          >
            <span>{user.displayName}</span>
            {firebaseUser.photoURL ? (
              <img
                src={firebaseUser.photoURL}
                alt={user.displayName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                {user.displayName[0]?.toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Notification permission banner */}
      {permission === "default" && !notifDismissed && (
        <div className="px-4 pt-20">
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
            <span className="text-xl">🔔</span>
            <p className="flex-1 text-on-surface text-sm">Activá las notificaciones para saber cuando tu pareja actualiza algo</p>
            <button
              onClick={() => { requestPermission(); dismissNotifBanner() }}
              className="text-primary text-xs font-bold whitespace-nowrap"
            >
              Activar
            </button>
            <button
              onClick={() => dismissNotifBanner()}
              className="text-on-surface-variant text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Countdown section */}
      <div className={`px-4 pb-4 ${permission === "default" && !notifDismissed ? "pt-3" : "pt-20"}`}>
        {countdownConfig === undefined ? null : countdownConfig === null || countdown.isPast ? (
          <button
            onClick={openCdSheet}
            className="w-full glass-card border border-dashed border-outline-variant/25 rounded-2xl px-6 py-5 text-left flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <span className="text-2xl">✈️</span>
            <div>
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">
                {countdown.isPast && countdownConfig ? "¡Ya pasó!" : "Próxima fecha"}
              </p>
              <p className="text-on-surface text-sm font-medium">Agregar fecha de encuentro</p>
            </div>
          </button>
        ) : (
          <div className="glass-card border border-primary/15 rounded-2xl px-6 py-5 shadow-[0_0_40px_rgba(194,24,91,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-primary text-[10px] font-bold uppercase tracking-[0.22em]">✈️ Próximo encuentro</p>
              <div className="flex gap-4">
                <button
                  onClick={openCdSheet}
                  className="text-on-surface-variant text-xs hover:text-on-surface transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={handleDeleteCountdown}
                  className="text-error/50 text-xs hover:text-error transition-colors"
                >
                  Borrar
                </button>
              </div>
            </div>
            <CountdownTimer targetDate={countdownDate!} />
          </div>
        )}
      </div>

      {/* Overdue confirmed banner */}
      {overdueConfirmed.length > 0 && (
        <div className="px-4 pb-2">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              ⏰ ¿Ya las hicieron?
            </p>
            {overdueConfirmed.map((a) => (
              <button
                key={a.id}
                onClick={() => router.push(`/activity/${a.id}`)}
                className="w-full text-left flex items-center justify-between gap-3 py-1 group"
              >
                <span className="text-on-surface text-sm font-medium truncate">{a.name}</span>
                <span className="text-amber-400/70 text-xs whitespace-nowrap group-hover:text-amber-400 transition-colors">
                  Marcar como completada →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="px-6">
        {/* Tabs */}
        <nav className="sticky top-20 z-40 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => { setActiveTab(tab.status); setSearchQuery(""); setFilterImportance(null) }}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.status
                  ? "bg-gradient-to-r from-primary-container to-primary text-white shadow-md"
                  : "border border-outline-variant/30 text-on-surface-variant bg-surface-container-low/50 hover:border-outline-variant/60"
              }`}
            >
              {tab.label} {tab.emoji}
            </button>
          ))}
        </nav>

        {/* Search & filters — done tab only */}
        {activeTab === "done" && (
          <div className="space-y-3 mb-2">
            <input
              type="text"
              placeholder="Buscar actividad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-full px-5 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:border-primary/40 transition-colors"
            />
            <div className="flex gap-2 flex-wrap">
              {([null, "low", "medium", "urgent"] as const).map((imp) => (
                <button
                  key={imp ?? "all"}
                  onClick={() => setFilterImportance(imp)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filterImportance === imp
                      ? "bg-primary-container text-on-primary-container border-transparent"
                      : "border-outline-variant/30 text-on-surface-variant"
                  }`}
                >
                  {imp === null ? "Todas" : imp === "low" ? "Baja" : imp === "medium" ? "Media" : "Urgente"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        <section className="space-y-4 mt-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-16"
              >
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center px-8 py-16"
              >
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-surface-container mb-6 text-4xl">
                  ♥
                </div>
                <h4 className="font-serif text-2xl text-on-surface mb-2">Aún no hay planes</h4>
                <p className="text-on-surface-variant text-sm">
                  {activeTab === "todo" && "Agregá una actividad para empezar ✨"}
                  {activeTab === "confirmed" && "Confirmá una actividad para verla acá 📅"}
                  {activeTab === "done" && "Completen una actividad juntos ✅"}
                </p>
              </motion.div>
            ) : (
              filtered.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <ActivityCard activity={activity} coupleId={user.coupleId!} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary-container to-primary text-on-primary-container text-2xl font-bold shadow-[0_8px_24px_rgba(194,24,91,0.4)] active:scale-95 transition-all z-50 flex items-center justify-center"
        aria-label="Agregar plan"
      >
        +
      </button>

      <AddActivityModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        coupleId={user.coupleId!}
        uid={firebaseUser.uid}
        senderName={user.displayName}
      />

      <ProfileSidebar
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        firebaseUser={firebaseUser}
        onSignOut={handleSignOut}
        onUpdateUser={updateUser}
      />

      {/* Bottom sheet — date picker */}
      <AnimatePresence>
        {cdOpen && (
          <>
            <motion.div
              key="cd-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black"
              onClick={() => setCdOpen(false)}
            />
            <motion.div
              key="cd-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full z-[70] bg-surface-container rounded-t-[2rem] p-6"
            >
              <div className="w-10 h-1 rounded-full bg-outline-variant/30 mx-auto mb-6" />
              <h2 className="font-serif text-xl text-on-surface mb-5">Fecha de encuentro</h2>
              <input
                type="datetime-local"
                value={cdDateStr}
                onChange={(e) => setCdDateStr(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={handleSaveCountdown}
                disabled={!cdDateStr}
                className="w-full mt-4 bg-primary-container text-on-primary-container font-semibold rounded-xl py-3.5 transition-all active:scale-95 disabled:opacity-40"
              >
                Guardar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
