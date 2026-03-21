"use client"

import { useState, useEffect } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserProfile, createUserProfile, updateUserPhotoURL } from "@/lib/firestore/users"
import type { UserProfile } from "@/lib/types"

interface AuthState {
  user: UserProfile | null
  firebaseUser: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (patch: Partial<UserProfile>) => void
}

const provider = new GoogleAuthProvider()

function setSessionCookies(uid: string, coupleId: string | null) {
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  document.cookie = `uid=${uid}; path=/; max-age=${maxAge}; SameSite=Lax`
  if (coupleId) {
    document.cookie = `couple_id=${coupleId}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else {
    document.cookie = `couple_id=; path=/; max-age=0`
  }
}

function clearSessionCookies() {
  document.cookie = `uid=; path=/; max-age=0`
  document.cookie = `couple_id=; path=/; max-age=0`
}

export function useAuth(): AuthState {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (!fbUser) {
        setUser(null)
        clearSessionCookies()
        setLoading(false)
        return
      }

      let profile = await getUserProfile(fbUser.uid)

      if (!profile) {
        await createUserProfile(fbUser.uid, fbUser.displayName ?? "", fbUser.photoURL ?? undefined)
        profile = await getUserProfile(fbUser.uid)
      } else if (fbUser.photoURL && profile.photoURL !== fbUser.photoURL) {
        // Keep photoURL in sync with Google
        await updateUserPhotoURL(fbUser.uid, fbUser.photoURL)
        profile = { ...profile, photoURL: fbUser.photoURL }
      }

      setUser(profile)
      setSessionCookies(fbUser.uid, profile?.coupleId ?? null)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Sync couple_id cookie when profile.coupleId changes
  useEffect(() => {
    if (user && firebaseUser) {
      setSessionCookies(firebaseUser.uid, user.coupleId)
    }
  }, [user?.coupleId, firebaseUser])

  async function signInWithGoogle() {
    await signInWithPopup(auth, provider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
    setUser(null)
    setFirebaseUser(null)
    clearSessionCookies()
  }

  function updateUser(patch: Partial<UserProfile>) {
    setUser((prev) => prev ? { ...prev, ...patch } : prev)
  }

  return { user, firebaseUser, loading, signInWithGoogle, signOut, updateUser }
}
