"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TimerDisplay } from "./timer-display"
import { CloseShiftModal } from "@/components/modals/close-shift-modal"
import { StartShiftModal } from "@/components/modals/start-shift-modal"
import TakePhotoGuard from "@/components/modals/take-photo-guard"
import { ViewPhotoGuard } from "@/components/modals/view-photo-guard"
import DeletePhotoGuard from "@/components/modals/eliminar-photo-guard"
import { capitalizeOnlyFirstLetter } from "@/lib/utils"
import useAuthStore from "@/store/useAuthStore"
import { Imagen } from "@/components/upload-Image"
import { Camera, Clock, MapPin, Play, Square } from "lucide-react"

interface TurnoHeaderProps {
  shift: any
  evidencia: Imagen[]
  setEvidencia: Dispatch<SetStateAction<Imagen[]>>
  identificacion: Imagen[]
  setIdentificacion: Dispatch<SetStateAction<Imagen[]>>
  nombreSuplente: string
  forceOpenStartPhoto: boolean
  setForceOpenStartPhoto: Dispatch<SetStateAction<boolean>>
  area: string
  location: string
}

export function TurnoHeader({
  shift,
  evidencia,
  setEvidencia,
  identificacion,
  setIdentificacion,
  nombreSuplente,
  forceOpenStartPhoto,
  setForceOpenStartPhoto,
  area,
  location,
}: TurnoHeaderProps) {
  const { userIdSoter } = useAuthStore()
  const turno = capitalizeOnlyFirstLetter(shift?.guard?.status_turn ?? "")
  const checkin_id = shift?.booth_status?.checkin_id
  const isUserActiveTurn =
    userIdSoter == shift?.guard?.user_id && shift?.guard?.status_turn == "Turno Abierto"
  const isTurnoAbierto = shift?.guard?.status_turn === "Turno Abierto"

  const [openStartShift, setOpenStartShift] = useState(false)
  const [openCloseShift, setOpenCloseShift] = useState(false)
  const [openClosePhotoModal, setOpenClosePhotoModal] = useState(false)
  const [openStartPhotoModal, setOpenStartPhotoModal] = useState(false)
  const [openStartView, setOpenStartView] = useState(false)
  const [openDeletePhoto, setOpenDeletePhoto] = useState(false)

  useEffect(() => {
    if (openClosePhotoModal === true && identificacion && identificacion.length > 0) {
      setTimeout(() => {
        setOpenCloseShift(true)
      }, 800)
    }
  }, [openClosePhotoModal, identificacion])

  useEffect(() => {
    if (openStartPhotoModal === true && evidencia && evidencia.length > 0) {
      setTimeout(() => {
        setOpenStartShift(true)
      }, 800)
    }
  }, [openStartPhotoModal, evidencia])

  useEffect(() => {
    if (forceOpenStartPhoto) {
      setOpenStartPhotoModal(true)
      setForceOpenStartPhoto(false)
    }
  }, [forceOpenStartPhoto, setForceOpenStartPhoto])

  useEffect(() => {
    if (shift?.guard?.start_turn_image?.length > 0 && isUserActiveTurn)
      setEvidencia(shift?.guard?.start_turn_image)
    if (shift?.guard?.end_turn_image && isUserActiveTurn)
      setIdentificacion(shift?.guard?.end_turn_image?.length)
  }, [
    shift?.guard?.start_turn_image,
    shift?.guard?.end_turn_image,
    setEvidencia,
    setIdentificacion,
    isUserActiveTurn,
  ])

  const handleStartTurno = () => {
    if (!evidencia || evidencia.length === 0) {
      setOpenStartPhotoModal(true)
    } else {
      setOpenStartShift(true)
    }
  }

  const handleCloseTurno = () => {
    if (!identificacion || identificacion.length === 0) {
      setOpenClosePhotoModal(true)
    } else {
      setOpenCloseShift(true)
    }
  }

  const photoUrl = isUserActiveTurn
    ? evidencia[0]?.file_url || shift?.guard?.start_turn_image?.[0]?.file_url || null
    : null

  return (
    <>
      <Card
        className={`overflow-hidden border-l-4 ${
          isTurnoAbierto
            ? "border-l-emerald-500 bg-emerald-50/30"
            : "border-l-slate-400 bg-white"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Photo thumbnail */}
            <div
              className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-transform hover:scale-105 ${
                isTurnoAbierto ? "border-emerald-300" : "border-slate-200"
              }`}
              onClick={() => {
                if (photoUrl || shift?.guard?.start_turn_image?.[0]?.file_url) {
                  setOpenStartView(true)
                } else if (!isTurnoAbierto) {
                  setOpenStartPhotoModal(true)
                }
              }}
            >
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Foto de turno"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
                  <Camera className="w-5 h-5 text-slate-400" />
                </div>
              )}
              {Array.isArray(evidencia) &&
                evidencia.length > 0 &&
                !isTurnoAbierto &&
                isUserActiveTurn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDeletePhoto(true)
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow hover:bg-red-600"
                    title="Eliminar imagen"
                  >
                    x
                  </button>
                )}
            </div>

            {/* Status info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  className={`text-xs px-2 py-0.5 ${
                    isTurnoAbierto
                      ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                      : "bg-slate-500 hover:bg-slate-500 text-white"
                  }`}
                >
                  {turno || "Sin turno"}
                </Badge>
                {isTurnoAbierto && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En curso
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="font-medium truncate">{area || "---"}</span>
                <span className="text-slate-300">|</span>
                <span className="truncate">{location || "---"}</span>
              </div>

              {isTurnoAbierto && shift?.booth_status?.stated_at && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>Inicio: {shift.booth_status.stated_at}</span>
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="hidden sm:block text-right px-3 border-l border-slate-200">
              <p className="text-[10px] text-muted-foreground">Duracion</p>
              <TimerDisplay
                startTime={shift?.booth_status?.stated_at_iso || null}
                isActive={isTurnoAbierto}
              />
            </div>

            {/* Action button */}
            {!isTurnoAbierto ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                disabled={area === ""}
                onClick={handleStartTurno}
              >
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar</span> Turno
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5 shadow-sm"
                disabled={area === ""}
                onClick={handleCloseTurno}
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar</span> Turno
              </Button>
            )}
          </div>

          {/* Warning messages - compact */}
          {(shift?.booth_status?.status === "No Disponible" && shift?.guard?.status_turn === "Turno Cerrado") ||
           area === "" ||
           (!isTurnoAbierto && (evidencia?.length ?? 0) === 0 && area !== "") ||
           (isTurnoAbierto && (identificacion?.length ?? 0) === 0) ? (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
              {shift?.booth_status?.status === "No Disponible" &&
                shift?.guard?.status_turn === "Turno Cerrado" && (
                  <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    Fuerce el cierre para iniciar
                  </span>
                )}
              {area === "" && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Selecciona una caseta
                </span>
              )}
              {!isTurnoAbierto && (evidencia?.length ?? 0) === 0 && area !== "" && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Toma foto para iniciar
                </span>
              )}
              {isTurnoAbierto && (identificacion?.length ?? 0) === 0 && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Toma foto para cerrar
                </span>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Modals */}
      <DeletePhotoGuard
        setEvidencia={setEvidencia}
        open={openDeletePhoto}
        setOpen={setOpenDeletePhoto}
      />
      <TakePhotoGuard
        title="Tomar Fotografia"
        descripcion="Capture una fotografia de su uniforme completo antes de iniciar su turno."
        evidencia={evidencia}
        setEvidencia={setEvidencia}
        open={openStartPhotoModal}
        setOpen={setOpenStartPhotoModal}
      />
      <TakePhotoGuard
        title="Tomar Fotografia"
        descripcion="Capture una fotografia de su uniforme completo antes de cerrar su turno."
        evidencia={identificacion}
        setEvidencia={setIdentificacion}
        open={openClosePhotoModal}
        setOpen={setOpenClosePhotoModal}
      />
      <ViewPhotoGuard
        evidencia={
          isUserActiveTurn ? evidencia || shift?.guard?.start_turn_image || [] : []
        }
        open={openStartView}
        setOpen={setOpenStartView}
      />
      <StartShiftModal
        title="Confirmacion"
        evidencia={evidencia}
        open={openStartShift}
        setOpen={setOpenStartShift}
        nombreSuplente={nombreSuplente}
        checkin_id={checkin_id}
      />
      <CloseShiftModal
        title="Confirmacion"
        shift={shift}
        area={area}
        location={location}
        identificacion={identificacion}
        open={openCloseShift}
        setOpen={setOpenCloseShift}
        checkin_id={checkin_id}
      />
    </>
  )
}
