"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ShieldAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando turno...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <link rel="icon" href="/turnos.svg" type="image/svg+xml" />
      
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
          {/* Error Alert */}
          {allData?.success === false && (
            <Card className="mb-6 border-2 border-red-500 bg-red-50/50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-bold text-red-900 border-b border-red-200 pb-1 mb-1">
                      Configuracion Incompleta
                    </h3>
                    <p className="text-red-800 font-medium">
                      Hubo un problema por falta de configuracion en este usuario.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-red-600 italic">
                      <AlertCircle className="w-4 h-4" />
                      <span>Por favor, solicita apoyo a soporte para resolverlo.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Context */}
            <aside className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1">
              <div className="lg:sticky lg:top-6">
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
            <main className="flex-1 space-y-6 order-1 lg:order-2">
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

              {/* Tabs Container */}
              <Tabs defaultValue="guardias" className="w-full">
                <TabsList className="w-full justify-start bg-white border rounded-lg p-1 h-auto flex-wrap">
                  <TabsTrigger
                    value="guardias"
                    className="flex-1 sm:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md px-4 py-2"
                  >
                    Guardias de Apoyo
                    <span className="ml-2 text-xs bg-slate-100 data-[state=active]:bg-blue-100 px-2 py-0.5 rounded-full">
                      {shift?.support_guards?.length || 0}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notas"
                    className="flex-1 sm:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md px-4 py-2"
                  >
                    Notas
                    <span className="ml-2 text-xs bg-slate-100 data-[state=active]:bg-blue-100 px-2 py-0.5 rounded-full">
                      {shift?.notes?.records?.length || 0}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="actividad"
                    className="flex-1 sm:flex-none data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md px-4 py-2"
                  >
                    Actividad
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="guardias" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <GuardiasApoyoTable shift={shift} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notas" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <NotasTable data={shift?.notes?.records} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actividad" className="mt-4">
                  <ActivityGrid stats={shift?.booth_stats} />
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
