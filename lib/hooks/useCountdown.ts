"use client"

import { useState, useEffect } from "react"

interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

export function useCountdown(targetDate: Date | null): CountdownState {
  const [state, setState] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  })

  useEffect(() => {
    if (!targetDate) return

    function tick() {
      const diff = targetDate!.getTime() - Date.now()

      if (diff <= 0) {
        setState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setState({ days, hours, minutes, seconds, isPast: false })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return state
}
