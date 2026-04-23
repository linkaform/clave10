"use client"

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AddGuardModal } from "@/components/modals/add-guard-modal"
import { ExitGuardModal } from "@/components/modals/exit-guard-modal"
import { useGetSupportGuards } from "@/hooks/useGetSupportGuards"
import { useGuardSelectionStore } from "@/store/useGuardStore"
import { Clock, LogOut, Plus, Search, Users } from "lucide-react"

interface Guard {
  user_id: string
  name: string
  picture?: string
  rol?: string
  inicio?: string
  caseta?: string
}

interface GuardiaCardListProps {
  shift: any
}

export function GuardiaCardList({ shift }: GuardiaCardListProps) {
  const { checkoutSupportGuardsMutation } = useGetSupportGuards(false)
  const checkInID = shift?.booth_status?.checkin_id || ""
  const { toggleGuardSelection, clearSelectedGuards, selectedGuards } =
    useGuardSelectionStore()
  const location = shift?.location?.name ?? ""
  const area = shift?.location?.area ?? ""
  const guards: Guard[] = shift?.support_guards || []
  const isTurnoCerrado = shift?.guard?.status_turn === "Turno Cerrado"

  const [searchTerm, setSearchTerm] = React.useState("")

  React.useEffect(() => {
    clearSelectedGuards()
  }, [clearSelectedGuards])

  const handleConfirmCheckout = (guardia: Guard) => {
    checkoutSupportGuardsMutation.mutate({
      area,
      location,
      guards: [guardia.user_id],
      checkin_id: checkInID,
      guard_id: guardia.user_id,
    })
  }

  const filteredGuards = guards.filter((guard) =>
    guard.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isSelected = (guard: Guard) =>
    selectedGuards.some((g: Guard) => g.user_id === guard.user_id)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold">Guardias en {location}</h2>
          <Badge variant="secondary" className="ml-2">
            {guards.length}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar guardia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Add Guard Button */}
          <AddGuardModal title="Guardias" checkInID={checkInID}>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              disabled={isTurnoCerrado}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </AddGuardModal>
        </div>
      </div>

      {/* Selection info */}
      {isTurnoCerrado && selectedGuards.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm text-blue-700">
            {selectedGuards.length} guardia(s) seleccionado(s)
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:text-blue-800"
            onClick={clearSelectedGuards}
          >
            Limpiar seleccion
          </Button>
        </div>
      )}

      {/* Guards Grid */}
      {filteredGuards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuards.map((guard) => (
            <Card
              key={guard.user_id}
              className={`transition-all duration-200 hover:shadow-md ${
                isSelected(guard) ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox (only when shift is closed) */}
                  {isTurnoCerrado && (
                    <Checkbox
                      checked={isSelected(guard)}
                      onCheckedChange={() => toggleGuardSelection(guard)}
                      className="mt-3"
                    />
                  )}

                  {/* Avatar */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200">
                    <Image
                      src={guard.picture || "/nouser.svg"}
                      alt={`${guard.name || "Sin nombre"}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {guard.name || "Sin nombre"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {guard.rol || "Sin rol"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {guard.caseta || "---"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Inicio: {guard.inicio || "---"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isTurnoCerrado && (
                    <ExitGuardModal
                      title="Confirmacion"
                      empleado={guard.name}
                      onConfirm={() => handleConfirmCheckout(guard)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-5 h-5" />
                      </Button>
                    </ExitGuardModal>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-slate-100 mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                No hay guardias de apoyo
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchTerm
                  ? "No se encontraron guardias con ese nombre"
                  : "Agrega guardias de apoyo para este turno usando el boton de arriba"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination info */}
      {filteredGuards.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {filteredGuards.length} de {guards.length} guardias
          </span>
          {isTurnoCerrado && (
            <span>{selectedGuards.length} seleccionados</span>
          )}
        </div>
      )}
    </div>
  )
}
