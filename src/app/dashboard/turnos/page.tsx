"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ShieldAlert, Users, StickyNote, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useGetShift } from "@/hooks/useGetShift"
import { Imagen } from "@/components/upload-Image"
import { useBoothStore } from "@/store/useBoothStore"
import { useMounted } from "@/store/useMounted"

import { TurnoHeader } from "@/components/pages/turnos/turno-header"
import { ContextSidebar } from "@/components/pages/turnos/context-sidebar"
import { ActivityGrid } from "@/components/pages/turnos/activity-grid"
import { GuardiasApoyoTable } from "@/components/table/guardias-apoyo/table"
import { NotasTable } from "@/components/table/notas/table"

export default function TurnosPage() {
  const mounted = useMounted()
  const area = useBoothStore((s) => s.area)
  const location = useBoothStore((s) => s.location)

  const { shift, isLoading, allData } = useGetShift(area, location)

  const [evidencia, setEvidencia] = useState<Imagen[]>([])
  const [identificacion, setIdentificacion] = useState<Imagen[]>([])
  const [nombreSuplente, setNombreSuplente] = useState("")
  const [forceOpenStartPhoto, setForceOpenStartPhoto] = useState(false)

  useEffect(() => {
    if (!shift) return

    setNombreSuplente(shift.guard?.nombre_suplente || "")

    if (shift.guard?.status_turn !== "Turno Cerrado") {
      setEvidencia(shift.guard?.end_turn_image || [])
    } else {
      setEvidencia(shift.booth_status?.start_turn_image || [])
    }
  }, [shift])

  if (isLoading || !mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando turno...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <link rel="icon" href="/turnos.svg" type="image/svg+xml" />
      
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto p-3 lg:p-4 max-w-7xl">
          {/* Error Alert */}
          {allData?.success === false && (
            <Card className="mb-4 border-2 border-red-500 bg-red-50/50 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-900">Configuracion Incompleta</h3>
                    <p className="text-xs text-red-700">
                      Hubo un problema por falta de configuracion. Solicita apoyo a soporte.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Layout - 2 columns */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Sidebar - Context (narrower) */}
            <aside className="w-full lg:w-72 flex-shrink-0 order-2 lg:order-1">
              <div className="lg:sticky lg:top-4 space-y-3">
                <ContextSidebar
                  key={shift?.location?.name}
                  shift={shift}
                  nombreSuplente={nombreSuplente}
                  setNombreSuplente={setNombreSuplente}
                  onSuplenteConfirmado={() => setForceOpenStartPhoto(true)}
                />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-3 order-1 lg:order-2">
              {/* Hero Header - Turno Status */}
              <TurnoHeader
                shift={shift}
                evidencia={evidencia}
                setEvidencia={setEvidencia}
                identificacion={identificacion}
                setIdentificacion={setIdentificacion}
                nombreSuplente={nombreSuplente}
                forceOpenStartPhoto={forceOpenStartPhoto}
                setForceOpenStartPhoto={setForceOpenStartPhoto}
                area={area}
                location={location}
              />

              {/* Activity Grid - Compact */}
              <ActivityGrid stats={shift?.booth_stats} />

              {/* Two column grid for Guardias and Notas */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {/* Guardias de Apoyo */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Guardias de Apoyo
                      <span className="ml-auto text-xs font-normal bg-slate-100 px-2 py-0.5 rounded-full">
                        {shift?.support_guards?.length || 0}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <GuardiasApoyoTable shift={shift} />
                  </CardContent>
                </Card>

                {/* Notas */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-amber-600" />
                      Notas del Turno
                      <span className="ml-auto text-xs font-normal bg-slate-100 px-2 py-0.5 rounded-full">
                        {shift?.notes?.records?.length || 0}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <NotasTable data={shift?.notes?.records} />
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
