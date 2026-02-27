"use client"

import { NotasTable } from "@/components/table/notas/table";
import { GuardiasApoyoTable } from "@/components/table/guardias-apoyo/table";
import Sidebar from "@/components/pages/turnos/sidebar";
import ActivitySummary from "@/components/pages/turnos/activity-summary";
import TurnStatus from "@/components/pages/turnos/turn-status";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { useGetShift } from "@/hooks/useGetShift";
import { useEffect, useState } from "react";
import { Imagen } from "@/components/upload-Image";
import { useBoothStore } from "@/store/useBoothStore";
import { useMounted } from "@/store/useMounted";

export default function Home() {
  const mounted = useMounted();
  const area = useBoothStore((s) => s.area);
  const location = useBoothStore((s) => s.location);

  const { shift, isLoading, allData } = useGetShift(area, location);

  const [evidencia, setEvidencia] = useState<Imagen[]>([])
  const [identificacion, setIdentificacion] = useState<Imagen[]>([])
  const [nombreSuplente, setNombreSuplente] = useState("")
  const [forceOpenStartPhoto, setForceOpenStartPhoto] = useState(false);

  useEffect(() => {
    if (!shift) return;

    setNombreSuplente(shift.guard?.nombre_suplente || "");

    if (shift.guard?.status_turn !== "Turno Cerrado") {
      setEvidencia(shift.guard?.end_turn_image || []);
    } else {
      setEvidencia(shift.booth_status?.start_turn_image || []);
    }
  }, [shift]);

  if (isLoading || !mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-24 h-24 border-8 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <link rel="icon" href="/turnos.svg" type="image/svg+xml" /><div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/4 h-full px-6 py-6 border border-[#F0F2F5]">
          <Sidebar shift={shift} nombreSuplente={nombreSuplente} setNombreSuplente={setNombreSuplente} onSuplenteConfirmado={() => setForceOpenStartPhoto(true)} />
        </div>
        <div className="w-full lg:w-3/4 p-8 flex flex-col">
          {allData?.success === false && (
            <Card className="mb-6 border-2 border-red-500 bg-red-50/50 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="bg-red-100 p-2 rounded-full shrink-0">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-bold text-red-900 border-b border-red-200 pb-1 mb-1">Configuración Incompleta</h3>
                    <p className="text-red-800 font-medium">
                      Hubo un problema por falta de configuración en este usuario.
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
          <TurnStatus shift={shift} evidencia={evidencia} setEvidencia={setEvidencia} identificacion={identificacion} setIdentificacion={setIdentificacion} nombreSuplente={nombreSuplente}
            forceOpenStartPhoto={forceOpenStartPhoto}
            setForceOpenStartPhoto={setForceOpenStartPhoto}
          />
          <div className="flex flex-col sm:flex-row justify-between">
            <div className="w-full">
              <GuardiasApoyoTable shift={shift} />
            </div>
          </div>
          <div className="flex w-full">
            <ActivitySummary booth_stats={shift?.booth_stats} />
            <NotasTable data={shift?.notes?.records} />
          </div>

        </div>
      </div>
    </>
  );
}
