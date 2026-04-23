"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ChangeBoothModal } from "@/components/modals/change-booth-modal"
import { NombreSuplenteModal } from "@/components/modals/nombre-suplente"
import { SuplenteItem } from "@/components/suplente-item"
import { QuickStats } from "./quick-stats"
import { changeUserPhoto, changeUserPhotoPatch } from "@/lib/change-user-photo"
import { capitalizeOnlyFirstLetter } from "@/lib/utils"
import useAuthStore from "@/store/useAuthStore"
import { useBoothStore } from "@/store/useBoothStore"
import { toast } from "sonner"
import { Camera, MapPin, Building2, User, RefreshCw } from "lucide-react"

interface ContextSidebarProps {
  shift: any
  nombreSuplente: string
  setNombreSuplente: Dispatch<SetStateAction<string>>
  onSuplenteConfirmado: () => void
}

export function ContextSidebar({
  shift,
  nombreSuplente,
  setNombreSuplente,
  onSuplenteConfirmado,
}: ContextSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { userEmailSoter, userNameSoter, userPhoto, userIdSoter, setUserPhoto } =
    useAuthStore()
  const [openNombreSuplenteModal, setOpenNombreSuplenteModal] = useState(false)
  const { location, area } = useBoothStore()

  const getInitials = (name: string | null) => {
    if (!name) return "N/A"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0]
    if (file) {
      const res = await changeUserPhoto(userIdSoter, file)
      if (res.thumb) {
        const response = await changeUserPhotoPatch(userIdSoter, res.thumb)
        if (response) {
          setUserPhoto(`${res.thumb}?t=${Date.now()}`)
          toast.success("Foto de perfil cambiada correctamente")
        }
      }
    }
  }

  const isTurnoAbierto = shift?.guard?.status_turn === "Turno Abierto"
  const isTurnoCerrado = shift?.guard?.status_turn === "Turno Cerrado"

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-slate-200 shadow-md">
                <AvatarImage
                  className="object-cover"
                  src={userPhoto ?? "/nouser.svg"}
                  alt="Avatar"
                />
                <AvatarFallback className="text-lg font-semibold bg-slate-100">
                  {getInitials(userNameSoter)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleButtonClick}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>

            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <h3 className="mt-3 font-semibold text-lg">{userNameSoter}</h3>
            <p className="text-sm text-muted-foreground">{shift?.guard?.position}</p>
            <p className="text-xs text-muted-foreground mt-1">{userEmailSoter}</p>
          </div>
        </CardContent>
      </Card>

      {/* Location Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            Ubicacion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Location</p>
              <p className="font-medium truncate">{location || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Ciudad</p>
              <p className="font-medium truncate">{shift?.location?.city || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Estado</p>
              <p className="font-medium truncate">{shift?.location?.state || "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Direccion</p>
              <p className="font-medium truncate">{shift?.location?.address || "---"}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-muted-foreground">Caseta</p>
                <p className="font-semibold">{area || "Sin seleccionar"}</p>
              </div>
            </div>
            <Badge
              className={`text-xs ${
                shift?.booth_status?.status === "Abierta"
                  ? "bg-emerald-500 hover:bg-emerald-500"
                  : "bg-red-500 hover:bg-red-500"
              } text-white`}
            >
              {capitalizeOnlyFirstLetter(shift?.booth_status?.status) || "---"}
            </Badge>
          </div>

          <ChangeBoothModal title="Cambiar caseta">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled={isTurnoAbierto}
            >
              <RefreshCw className="w-4 h-4" />
              Cambiar Caseta
            </Button>
          </ChangeBoothModal>
        </CardContent>
      </Card>

      {/* Guard on duty */}
      {shift?.booth_status?.status === "Abierta" && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-50">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Guardia en turno</p>
                <p className="font-medium truncate">
                  {shift?.booth_status?.guard_on_dutty || "---"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Resumen Rapido</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickStats stats={shift?.booth_stats} />
        </CardContent>
      </Card>

      {/* Suplente Section */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Button
            variant="secondary"
            size="sm"
            className="w-full bg-violet-100 text-violet-700 hover:bg-violet-200"
            disabled={!isTurnoCerrado}
            onClick={() => setOpenNombreSuplenteModal(true)}
          >
            Ingresar como suplente
          </Button>

          <NombreSuplenteModal
            title="Suplente"
            nombreSuplente={nombreSuplente}
            setNombreSuplente={setNombreSuplente}
            onSuplenteConfirmado={onSuplenteConfirmado}
            open={openNombreSuplenteModal}
            setOpen={setOpenNombreSuplenteModal}
            mode="create"
          />

          {nombreSuplente && (
            <SuplenteItem
              turno={shift?.guard?.status_turn}
              nombreSuplente={nombreSuplente}
              setNombreSuplente={setNombreSuplente}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
