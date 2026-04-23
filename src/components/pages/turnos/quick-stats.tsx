"use client"

import { Users, TriangleAlert, CarFront } from "lucide-react"
import Link from "next/link"
import { useShiftStore } from "@/store/useShiftStore"

interface QuickStatsProps {
  stats: {
    in_invitees?: number
    incidentes_pendites?: number
    total_vehiculos_dentro?: number
  } | null
}

export function QuickStats({ stats }: QuickStatsProps) {
  const { setTab, setFilter, setFrom } = useShiftStore()

  const items = [
    {
      icon: Users,
      value: stats?.in_invitees || 0,
      label: "Visitas",
      link: "/dashboard/bitacoras",
      tab: "Personal",
      filter: "today",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: TriangleAlert,
      value: stats?.incidentes_pendites || 0,
      label: "Incidencias",
      link: "/dashboard/incidencias",
      tab: "Incidencias",
      filter: "today",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: CarFront,
      value: stats?.total_vehiculos_dentro || 0,
      label: "Vehiculos",
      link: "/dashboard/bitacoras",
      tab: "Vehiculos",
      filter: "today",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ]

  const handleClick = (tab: string, filter: string) => {
    setTab(tab)
    setFilter(filter)
    setFrom("turnos")
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.link}
          onClick={() => handleClick(item.tab, item.filter)}
          className="flex flex-col items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className={`p-2 rounded-full ${item.bgColor} mb-1`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
          </div>
          <span className="text-xl font-bold">{item.value}</span>
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </Link>
      ))}
    </div>
  )
}
