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
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
      title: "Visitas Dentro",
      count: stats?.in_invitees || 0,
      link: "/dashboard/bitacoras",
      tab: "Personal",
      filter: "today",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: TriangleAlert,
      title: "Incidencias Pendientes",
      count: stats?.incidentes_pendites || 0,
      link: "/dashboard/incidencias",
      tab: "Incidencias",
      filter: "today",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      highlight: (stats?.incidentes_pendites || 0) > 0,
    },
    {
      icon: Flame,
      title: "Fallas Pendientes",
      count: stats?.fallas_pendientes || 0,
      link: "/dashboard/incidencias",
      tab: "Fallas",
      filter: "abierto",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      highlight: (stats?.fallas_pendientes || 0) > 0,
    },
    {
      icon: FileBox,
      title: "Articulos Concesionados",
      count: stats?.articulos_concesionados || 0,
      link: "/dashboard/articulos",
      tab: "Concecionados",
      filter: "today",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-200",
    },
    {
      icon: CarFront,
      title: "Vehiculos Dentro",
      count: stats?.total_vehiculos_dentro || 0,
      link: "/dashboard/bitacoras",
      tab: "Vehiculos",
      filter: "today",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      icon: Wrench,
      title: "Equipos Dentro",
      count: stats?.total_equipos_dentro || 0,
      link: "/dashboard/bitacoras",
      tab: "Equipos",
      filter: "today",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
    },
  ]

  function handleClick(tab: string, filter: string) {
    setTab(tab)
    setFilter(filter)
    setFrom("turnos")
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Resumen de Actividad
          <Link
            href="/dashboard/bitacoras"
            className="text-sm font-normal text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver todo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <Link key={item.title} href={item.link}>
              <div
                onClick={() => handleClick(item.tab, item.filter)}
                className={`
                  group relative flex flex-col items-center p-4 rounded-xl border-2 
                  transition-all duration-200 cursor-pointer
                  hover:shadow-md hover:-translate-y-0.5
                  ${item.highlight ? item.borderColor : "border-transparent"}
                  ${item.bgColor} bg-opacity-50 hover:bg-opacity-100
                `}
              >
                {item.highlight && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                )}

                <div className={`p-3 rounded-xl ${item.bgColor} mb-2`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>

                <span className="text-3xl font-bold text-foreground mb-1">
                  {item.count}
                </span>

                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {item.title}
                </span>

                <ArrowRight
                  className={`
                    absolute bottom-2 right-2 w-4 h-4 opacity-0 
                    group-hover:opacity-100 transition-opacity ${item.color}
                  `}
                />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
