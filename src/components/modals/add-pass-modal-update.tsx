/* eslint-disable react-hooks/exhaustive-deps */

import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { CalendarClock, Car, Layers, Loader2, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { GeneratedPassModal } from "./generated-pass-modal";
import CalendarDays from "../calendar-days";
import { Areas, Comentarios } from "@/hooks/useCreateAccessPass";
import useAuthStore from "@/store/useAuthStore";
import { Update_full_pass, usePaseEntrada } from "@/hooks/usePaseEntrada";
import { Badge } from "../ui/badge";
import { capitalizeFirstLetter } from "@/lib/utils";

interface EntryPassModalUpdateProps {
  title: string;
  dataPass: any;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  id: string;
  folio: string;
  from: string;
}

export const EntryPassModalUpdate: React.FC<EntryPassModalUpdateProps> = ({
  title,
  dataPass,
  isSuccess,
  setIsSuccess,
  onClose,
  id,
  folio,
  from
}) => {
  const { userEmailSoter, userIdSoter, userParentId } = useAuthStore();
  const [openGeneratedPass, setOpenGeneratedPass] = useState<boolean>(false);
  const [sendDataUpdate, setSendDataUpdate] = useState<Update_full_pass | null>(null);

  const [docs, setDocs] = useState("");
  const [link, setLink] = useState("");
  const { updatePaseEntradaFullMutation, responseCreatePase, isLoading } = usePaseEntrada(dataPass?.ubicacion ?? "");
  const [hostPro, setHostPro] = useState({ protocol: '', host: '' });
  const telefonoFormateado = dataPass?.telefono?.startsWith("+")
    ? dataPass?.telefono
    : `+52${dataPass?.telefono}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const host = window.location.host;
      setHostPro({ protocol, host });
    }

    const params = new URLSearchParams(dataPass?.link.link.split('?')[0]);
    const docss = params.get('docs') ?? "";
    setDocs(docss);
  }, []);

  const items =
    dataPass?.tipo_visita_pase === "fecha_fija"
      ? [
          {
            title: "Fecha y Hora de Visita",
            date: dataPass?.fecha_desde_visita,
          },
        ]
      : [
          {
            title: "Fecha Inicio",
            date: dataPass?.fecha_desde_visita,
          },
          {
            title: "Fecha Hasta",
            date: dataPass?.fecha_desde_hasta,
          },
        ];

  const onSubmitEdit = async () => {
    const accessPassData = {
      created_from: "web",
      nombre_pase: dataPass.nombre,
      email_pase: dataPass.email,
      empresa_pase: dataPass.empresa ?? "",
      telefono_pase: telefonoFormateado,
      ubicacion: dataPass.ubicacion,
      tema_cita: dataPass.tema_cita,
      descripcion: dataPass.descripcion,
      perfil_pase: dataPass.perfil_pase,
      status_pase: dataPass.status_pase,
      visita_a: dataPass.visita_a,
      link: {
        link: `${hostPro?.protocol}//${hostPro?.host}/pase-update`,
        docs: docs,
        qr_code: dataPass._id,
        creado_por_id: userIdSoter ?? 0,
        creado_por_email: userEmailSoter ?? ""
      },
      qr_pase: dataPass.qr_pase,
      tipo_visita: "alta_de_nuevo_visitante",
      enviar_correo_pre_registro: dataPass.enviar_correo_pre_registro,
      tipo_visita_pase: dataPass.tipo_visita_pase,
      fecha_desde_visita: dataPass.fecha_desde_visita.includes(":") && dataPass.fecha_desde_visita !== "" ? dataPass.fecha_desde_visita : dataPass.fecha_desde_visita !== "" ? `${dataPass.fecha_desde_visita}` + ` 00:00:00` : "",
      fecha_desde_hasta: dataPass.fecha_desde_hasta.includes(":") && dataPass.fecha_desde_hasta !== "" ? dataPass.fecha_desde_hasta : dataPass.fecha_desde_hasta !== "" ? `${dataPass.fecha_desde_hasta}` + ` 00:00:00` : "",
      config_dia_de_acceso: dataPass.config_dia_de_acceso,
      config_dias_acceso: dataPass.config_dias_acceso,
      config_limitar_acceso: dataPass.config_limitar_acceso,
      grupo_areas_acceso: dataPass.areas,
      grupo_instrucciones_pase: dataPass.comentarios,
      grupo_vehiculos: dataPass.grupo_vehiculos,
      grupo_equipos: dataPass.grupo_equipos,
      autorizado_por: userEmailSoter ?? "",
      walkin_fotografia: dataPass.foto,
      walkin_identificacion: dataPass.identificacion,
      enviar_correo: [],
      habilitar_vehiculo: dataPass.habilitar_vehiculo ?? "no",
      acompanantes: Number(dataPass.acompanantes) || 0,
      acompanantes_grupo: dataPass.acompanantes_grupo ?? [],
    };
    setSendDataUpdate(accessPassData);
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  useEffect(() => {
    if (sendDataUpdate) {
      updatePaseEntradaFullMutation.mutate({ access_pass: sendDataUpdate, id, folio, location: dataPass?.ubicacion });
    }
  }, [sendDataUpdate]);

  useEffect(() => {
    if (responseCreatePase?.status_code == 201 || responseCreatePase?.status_code == 202) {
      let docs = "";
      dataPass?.link.docs.map((d: string, index: number) => {
        if (d == "agregarIdentificacion") {
          docs += "iden";
        }
        else if (d == "agregarFoto") {
          docs += "foto";
        }
        if (index == 0) {
          docs += "-";
        }
      });

      setLink(`${hostPro.protocol}//${hostPro.host}/dashboard/pase-update?id=${responseCreatePase?.json.id}&user=${userParentId}&docs=${docs}`);
    }
  }, [responseCreatePase]);

  useEffect(() => {
    if (link) {
      setOpenGeneratedPass(true);
    }
  }, [link]);

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogContent
        className="max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col p-0 border-none rounded-3xl"
        aria-labelledby="dialog-title" onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="bg-blue-600 p-6 text-white text-center flex-shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight uppercase">
            {title}
          </DialogTitle>
          <p className="text-xs text-blue-100 mt-1 opacity-80 uppercase tracking-widest">Confirma los detalles del pase</p>
        </div>

        <div className="flex-grow overflow-y-auto px-8 py-6 space-y-6 bg-gray-50/50">

          {/* Datos personales */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <UserRound size={16} className="text-blue-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Datos Personales</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Nombre Completo</p>
                <p className="text-lg font-bold text-gray-800">{dataPass?.nombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                  <p className="text-sm font-semibold text-gray-600 truncate">{dataPass?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Teléfono</p>
                  <p className="text-sm font-semibold text-gray-600">{dataPass?.telefono}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Empresa</p>
                  <p className="text-sm font-semibold text-gray-600 truncate">{dataPass?.empresa || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Estatus</p>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-black px-2 py-0">
                    {capitalizeFirstLetter(dataPass?.status_pase ?? "")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles de visita */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalles de Visita</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tema de la cita</p>
                <p className="text-sm text-gray-700 font-medium">{dataPass?.tema_cita}</p>
              </div>
              <div className="space-y-1 pt-2 border-t border-gray-50">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Descripción</p>
                <p className="text-sm text-gray-700 break-words">{dataPass?.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Vigencia */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <CalendarClock size={16} className="text-blue-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vigencia y Accesos</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{item?.title}</p>
                  <p className="text-xs font-bold text-gray-800 tabular-nums">
                    {item?.date?.replace("T", " ").slice(0, 16)} hrs
                  </p>
                </div>
              ))}
            </div>

            {dataPass?.config_limitar_acceso > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-tight">Límite de accesos</p>
                <Badge className="bg-blue-600 text-white font-bold">{dataPass?.config_limitar_acceso}</Badge>
              </div>
            )}
          </div>

          {dataPass?.config_dias_acceso?.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <CalendarDays diasDisponibles={dataPass?.config_dias_acceso} />
            </div>
          )}

          {/* Vehículo */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 p-1.5 rounded-lg">
                  <Car size={16} className="text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Acceso con vehículo</span>
              </div>
              <Badge
                className={
                  dataPass?.habilitar_vehiculo === "sí" || dataPass?.habilitar_vehiculo === true
                    ? "bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px]"
                    : "bg-red-100 text-red-700 hover:bg-red-100 border-none font-black text-[10px]"
                }
              >
                {dataPass?.habilitar_vehiculo === "sí" || dataPass?.habilitar_vehiculo === true ? "Permitido" : "No permitido"}
              </Badge>
            </div>
          </div>

          {/* Acompañantes */}
          {(Number(dataPass?.acompanantes) ?? 0) > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-1.5 rounded-lg">
                    <UserRound size={16} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Acompañantes
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px]">
                  {dataPass.acompanantes} {Number(dataPass.acompanantes) === 1 ? "persona" : "personas"}
                </Badge>
              </div>

              {dataPass?.acompanantes_grupo && dataPass.acompanantes_grupo.filter((m: any) => m.nombre?.trim()).length > 0 && (
                <div className="space-y-2 pt-3 border-t border-gray-50">
                  {dataPass.acompanantes_grupo
                    .filter((m: any) => m.nombre?.trim())
                    .map((m: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <UserRound size={14} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{m.nombre}</p>
                          <div className="flex gap-3 mt-0.5">
                            {m.email && <p className="text-[11px] text-gray-400 truncate">{m.email}</p>}
                            {m.telefono && <p className="text-[11px] text-gray-400">{m.telefono}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {(dataPass?.areas?.length > 0 || dataPass?.comentarios?.length > 0) && (
            <div className="space-y-3">
              {dataPass?.areas?.length > 0 && (
                <Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <AccordionItem value="areas" className="border-none">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-gray-700 text-xs">
                      <div className="flex items-center gap-3">
                        <Layers size={14} className="text-blue-600" />
                        Áreas Autorizadas ({dataPass.areas.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="space-y-2">
                        {dataPass?.areas.map((area: Areas, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-800 mb-1">{area.nombre_area}</p>
                            <p className="text-[11px] text-gray-500 italic">{area.commentario_area || "Sin comentarios"}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {dataPass?.comentarios?.length > 0 && (
                <Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <AccordionItem value="comments" className="border-none">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline font-bold text-gray-700 text-xs">
                      <div className="flex items-center gap-3">
                        <MessageSquare size={14} className="text-blue-600" />
                        Instrucciones de Pase ({dataPass.comentarios.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4">
                      <div className="space-y-2">
                        {dataPass?.comentarios.map((com: Comentarios, index: number) => (
                          <div key={index} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                            <p className="text-[11px] text-gray-700 font-medium leading-relaxed italic">&quot;{com.comentario_pase}&quot;</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex gap-4 flex-shrink-0">
          <DialogClose asChild disabled={isLoading}>
            <Button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest border-none h-auto" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogClose>

          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold uppercase text-[10px] tracking-widest h-auto shadow-lg shadow-blue-100" onClick={onSubmitEdit} disabled={isLoading}>
            {!isLoading ? ("Editar pase") : (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando... </>)}
          </Button>

          {openGeneratedPass && (
            <GeneratedPassModal
              title="Pase de Entrada Generado"
              description="El pase de entrada se ha generado correctamente. Por favor, copie el siguiente enlace y compártalo con el visitante para completar el proceso."
              link={link}
              openGeneratedPass={openGeneratedPass}
              setOpenGeneratedPass={setOpenGeneratedPass}
              from={from}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};