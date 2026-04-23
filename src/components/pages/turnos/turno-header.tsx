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
        className={`overflow-hidden border-2 transition-all duration-300 ${
          isTurnoAbierto
            ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"
            : "border-slate-200 bg-gradient-to-r from-slate-50 to-white"
        }`}
      >
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row items-stretch">
            {/* Status indicator bar */}
            <div
              className={`w-full lg:w-2 h-2 lg:h-auto flex-shrink-0 ${
                isTurnoAbierto ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />

            {/* Main content */}
            <div className="flex-1 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Left side - Status and info */}
                <div className="flex items-start gap-4">
                  {/* Photo thumbnail */}
                  <div
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all hover:scale-105 ${
                      isTurnoAbierto
                        ? "border-emerald-300 shadow-emerald-100 shadow-lg"
                        : "border-slate-300"
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
                        <Camera className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] text-slate-400 mt-1">Foto</span>
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
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow hover:bg-red-600"
                          title="Eliminar imagen"
                        >
                          x
                        </button>
                      )}
                  </div>

                  {/* Status text */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`text-sm px-3 py-1 ${
                          isTurnoAbierto
                            ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                            : "bg-slate-500 hover:bg-slate-500 text-white"
                        }`}
                      >
                        {turno || "Sin turno"}
                      </Badge>
                      {isTurnoAbierto && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          En curso
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{area || "---"}</span>
                      <span className="text-slate-300">|</span>
                      <span>{location || "---"}</span>
                    </div>

                    {isTurnoAbierto && shift?.booth_status?.stated_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Inicio: {shift.booth_status.stated_at}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Timer and action */}
                <div className="flex flex-col items-end gap-4">
                  {/* Timer */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Tiempo transcurrido</p>
                    <TimerDisplay
                      startTime={shift?.booth_status?.stated_at_iso || null}
                      isActive={isTurnoAbierto}
                    />
                  </div>

                  {/* Action button */}
                  {!isTurnoAbierto ? (
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[180px] shadow-lg shadow-emerald-200"
                      disabled={area === ""}
                      onClick={handleStartTurno}
                    >
                      <Play className="w-5 h-5" />
                      Iniciar Turno
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="destructive"
                      className="gap-2 min-w-[180px] shadow-lg shadow-red-200"
                      disabled={area === ""}
                      onClick={handleCloseTurno}
                    >
                      <Square className="w-4 h-4" />
                      Cerrar Turno
                    </Button>
                  )}
                </div>
              </div>

              {/* Warning messages */}
              <div className="mt-4 flex flex-wrap gap-2">
                {shift?.booth_status?.status === "No Disponible" &&
                  shift?.guard?.status_turn === "Turno Cerrado" && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      * Fuerce el cierre de la caseta para iniciar turno
                    </span>
                  )}
                {area === "" && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Selecciona una caseta para iniciar turno
                  </span>
                )}
                {!isTurnoAbierto && (evidencia?.length ?? 0) === 0 && area !== "" && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Toma una fotografia para iniciar turno
                  </span>
                )}
                {isTurnoAbierto && (identificacion?.length ?? 0) === 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Toma una fotografia para cerrar turno
                  </span>
                )}
              </div>
            </div>
          </div>
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
