"use client"

import { useState, useEffect } from "react"
import { subscribeActivities } from "@/lib/firestore/activities"
import type { Activity } from "@/lib/types"

interface ActivitiesState {
  data: Activity[]
  loading: boolean
  error: Error | null
}

export function useActivities(coupleId: string | null): ActivitiesState {
  const [data, setData] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!coupleId) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeActivities(
      coupleId,
      (activities) => {
        setData(activities)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [coupleId])

  return { data, loading, error }
}
