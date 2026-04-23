"use client"

import { Dispatch, SetStateAction, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChangeBoothModal } from "@/components/modals/change-booth-modal"
import { NombreSuplenteModal } from "@/components/modals/nombre-suplente"
import { SuplenteItem } from "@/components/suplente-item"
import { changeUserPhoto, changeUserPhotoPatch } from "@/lib/change-user-photo"
import { capitalizeOnlyFirstLetter } from "@/lib/utils"
import useAuthStore from "@/store/useAuthStore"
import { useBoothStore } from "@/store/useBoothStore"
import { toast } from "sonner"
import { Camera, MapPin, Building2, User, RefreshCw, UserPlus } from "lucide-react"

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
    <div className="space-y-3">
      {/* Profile + Location Combined Card */}
      <Card>
        <CardContent className="p-4">
          {/* Profile Row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <Avatar className="w-12 h-12 border border-slate-200">
                <AvatarImage
                  className="object-cover"
                  src={userPhoto ?? "/nouser.svg"}
                  alt="Avatar"
                />
                <AvatarFallback className="text-sm font-semibold bg-slate-100">
                  {getInitials(userNameSoter)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleButtonClick}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
              >
                <Camera className="w-3 h-3 text-slate-600" />
              </button>
            </div>

            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{userNameSoter}</h3>
              <p className="text-xs text-muted-foreground truncate">{shift?.guard?.position}</p>
            </div>
          </div>

          {/* Location Info */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location || "---"} - {shift?.location?.city || "---"}</span>
            </div>

            {/* Caseta Row */}
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium">{area || "Sin caseta"}</span>
              </div>
              <Badge
                className={`text-[10px] px-1.5 py-0 ${
                  shift?.booth_status?.status === "Abierta"
                    ? "bg-emerald-500 hover:bg-emerald-500"
                    : "bg-red-500 hover:bg-red-500"
                } text-white`}
              >
                {capitalizeOnlyFirstLetter(shift?.booth_status?.status) || "---"}
              </Badge>
            </div>

            {/* Guard on duty */}
            {shift?.booth_status?.status === "Abierta" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  <span className="text-slate-500">En turno:</span> {shift?.booth_status?.guard_on_dutty || "---"}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <ChangeBoothModal title="Cambiar caseta">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5"
                disabled={isTurnoAbierto}
              >
                <RefreshCw className="w-3 h-3" />
                Cambiar
              </Button>
            </ChangeBoothModal>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
              disabled={!isTurnoCerrado}
              onClick={() => setOpenNombreSuplenteModal(true)}
            >
              <UserPlus className="w-3 h-3" />
              Suplente
            </Button>
          </div>

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
            <div className="mt-3">
              <SuplenteItem
                turno={shift?.guard?.status_turn}
                nombreSuplente={nombreSuplente}
                setNombreSuplente={setNombreSuplente}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
