"use client"

import { useEffect, useState } from "react"

interface TimerDisplayProps {
  startTime: string | null
  isActive: boolean
}

export function TimerDisplay({ startTime, isActive }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed({ hours: 0, minutes: 0, seconds: 0 })
      return
    }

    const calculateElapsed = () => {
      const start = new Date(startTime).getTime()
      const now = Date.now()
      const diff = Math.max(0, now - start)

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setElapsed({ hours, minutes, seconds })
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 1000)

    return () => clearInterval(interval)
  }, [startTime, isActive])

  const formatTime = (value: number) => value.toString().padStart(2, "0")

  if (!isActive) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <span className="text-2xl font-mono font-bold tabular-nums">--:--:--</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-baseline gap-0.5">
        <span className="text-3xl font-mono font-bold tabular-nums text-foreground">
          {formatTime(elapsed.hours)}
        </span>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <span className="text-3xl font-mono font-bold tabular-nums text-foreground">
          {formatTime(elapsed.minutes)}
        </span>
        <span className="text-2xl font-bold text-muted-foreground">:</span>
        <span className="text-3xl font-mono font-bold tabular-nums text-foreground">
          {formatTime(elapsed.seconds)}
        </span>
      </div>
    </div>
  )
}
