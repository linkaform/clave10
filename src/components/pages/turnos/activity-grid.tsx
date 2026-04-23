"use client"

import Link from "next/link"
import { useShiftStore } from "@/store/useShiftStore"
import {
  CarFront,
  FileBox,
  Flame,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ActivityGridProps {
  stats: {
    in_invitees?: number
    incidentes_pendites?: number
    fallas_pendientes?: number
    articulos_concesionados?: number
    total_vehiculos_dentro?: number
    total_equipos_dentro?: number
  } | null
}

export function ActivityGrid({ stats }: ActivityGridProps) {
  const { setTab, setFilter, setFrom } = useShiftStore()

  const items = [
    {
      icon: Users,
      title: "Visitas",
      count: stats?.in_invitees || 0,
      link: "/dashboard/bitacoras",
      tab: "Personal",
      filter: "today",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: TriangleAlert,
      title: "Incidencias",
      count: stats?.incidentes_pendites || 0,
      link: "/dashboard/incidencias",
      tab: "Incidencias",
      filter: "today",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      highlight: (stats?.incidentes_pendites || 0) > 0,
    },
    {
      icon: Flame,
      title: "Fallas",
      count: stats?.fallas_pendientes || 0,
      link: "/dashboard/incidencias",
      tab: "Fallas",
      filter: "abierto",
      color: "text-red-600",
      bgColor: "bg-red-50",
      highlight: (stats?.fallas_pendientes || 0) > 0,
    },
    {
      icon: FileBox,
      title: "Articulos",
      count: stats?.articulos_concesionados || 0,
      link: "/dashboard/articulos",
      tab: "Concecionados",
      filter: "today",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      icon: CarFront,
      title: "Vehiculos",
      count: stats?.total_vehiculos_dentro || 0,
      link: "/dashboard/bitacoras",
      tab: "Vehiculos",
      filter: "today",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: Wrench,
      title: "Equipos",
      count: stats?.total_equipos_dentro || 0,
      link: "/dashboard/bitacoras",
      tab: "Equipos",
      filter: "today",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
  ]

  function handleClick(tab: string, filter: string) {
    setTab(tab)
    setFilter(filter)
    setFrom("turnos")
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-slate-100">
          {items.map((item) => (
            <Link key={item.title} href={item.link}>
              <div
                onClick={() => handleClick(item.tab, item.filter)}
                className={`
                  group relative flex flex-col items-center py-3 px-2
                  transition-all duration-150 cursor-pointer
                  hover:bg-slate-50
                `}
              >
                {item.highlight && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}

                <div className={`p-2 rounded-lg ${item.bgColor} mb-1.5`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>

                <span className="text-xl font-bold text-foreground leading-none">
                  {item.count}
                </span>

                <span className="text-[10px] text-muted-foreground text-center mt-1">
                  {item.title}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
