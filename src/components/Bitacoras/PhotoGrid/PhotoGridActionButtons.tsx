"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PhotoGridActionButtonsProps {
  actions: React.ReactNode[]
  className?: string
}

export function PhotoGridActionButtons({
  actions,
  className
}: PhotoGridActionButtonsProps) {
  if (!actions || actions.length === 0) return null

  return (
    <div className={cn("flex flex-row items-center gap-2", className)}>
      {actions.map((action, index) => (
        <React.Fragment key={index}>
          {action}
        </React.Fragment>
      ))}
    </div>
  )
}
