import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";
import { Loader2, UserRound, ShieldCheck, Car, Laptop, Users } from "lucide-react";
import { UpdatedPassModal } from "./updated-pass-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { data_correo } from "@/lib/send_correo";
import Image from "next/image";
import { useUpdateAccessPass } from "@/hooks/useUpdatePass";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Equipo, Vehiculo } from "@/lib/update-pass";

interface EntryPassModal2Props {
  title: string;
  data: any;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  passData: any;
  parentUserId: number;
}

export const EntryPassModal2: React.FC<EntryPassModal2Props> = ({
  title,
  data,
  isSuccess,
  passData,
  setIsSuccess,
  onClose,
  parentUserId,
}) => {
  const [response, setResponse] = useState<any>(null);
  const [openGeneratedPass, setOpenGeneratedPass] = useState<boolean>(false);
  const [responseformated, setResponseFormated] = useState<data_correo | null>(null);
  const { updatePassMutation, isLoadingUpdate } = useUpdateAccessPass();

  const onSubmit = async () => {
    updatePassMutation.mutate(
      {
        access_pass: {
          grupo_vehiculos: data.grupo_vehiculos,
          grupo_equipos: data.grupo_equipos,
          status_pase: data.status_pase,
          walkin_fotografia: data?.walkin_fotografia,
          walkin_identificacion: data?.walkin_identificacion,
          acepto_aviso_privacidad: data?.acepto_aviso_privacidad ? "sí" : "no",
          conservar_datos_por: data?.conservar_datos_por,
          acompanantes: data?.acompanantes ?? [],
        },
        id: data.folio,
        account_id: data.account_id,
      },
      {
        onSuccess: (response) => {
          setResponseFormated({
            email_to: data.email,
            asunto: response?.response?.data?.json?.asunto,
            email_from: response?.response?.data?.enviar_de_correo,
            nombre: response?.response?.data?.json?.enviar_a,
            nombre_organizador: response?.response?.data?.json?.enviar_de,
            ubicacion: response?.response?.data?.json?.ubicacion,
            fecha: {
              desde: response?.response?.data?.json?.fecha_desde,
              hasta: response?.response?.data?.json?.fecha_hasta,
            },
            descripcion: response?.response?.data?.json?.descripcion,
          });
          setResponse(response);
          setIsSuccess(true);
          setOpenGeneratedPass(true);
        },
      },
    );
  };

  const handleClose = () => onClose();

  const LabelValue = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-gray-700 break-words">{value || "—"}</p>
    </div>
  );

  const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="bg-blue-50 p-1.5 rounded-lg">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogContent
        className="max-w-2xl overflow-y-auto max-h-[90vh] flex flex-col p-0 border-none rounded-3xl"
        aria-describedby=""
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Header azul */}
        <div className="bg-blue-600 p-6 text-white text-center flex-shrink-0 rounded-t-3xl">
          <DialogTitle className="text-xl font-bold tracking-tight uppercase">
            {title}
          </DialogTitle>
          <p className="text-xs text-blue-100 mt-1 opacity-80 uppercase tracking-widest">
            Confirma los detalles del pase
          </p>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/50">

          {/* Datos personales */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={<UserRound size={16} className="text-blue-600" />} label="Datos Personales" />
            <div className="grid grid-cols-1 gap-4">
              <LabelValue label="Nombre Completo" value={data?.nombre} />
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                <LabelValue label="Email" value={data?.email} />
                <LabelValue label="Teléfono" value={data?.telefono} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de pase</p>
                  <p className="text-sm font-semibold text-gray-700">Visita General</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estatus</p>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-black px-2 py-0">
                    Proceso
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Foto e identificación */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={<ShieldCheck size={16} className="text-blue-600" />} label="Documentos" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fotografía</p>
                {data?.walkin_fotografia?.length > 0 ? (
                  <div className="flex justify-center">
                    <Image
                      src={data.walkin_fotografia[0].file_url}
                      alt="Fotografía"
                      width={120}
                      height={120}
                      className="h-28 w-28 object-cover rounded-xl border border-gray-100 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-28 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                    <span className="text-gray-400 text-xs">Sin foto</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identificación</p>
                {data?.walkin_identificacion?.length > 0 ? (
                  <div className="flex justify-center">
                    <Image
                      src={data.walkin_identificacion[0].file_url}
                      alt="Identificación"
                      width={120}
                      height={120}
                      className="h-28 w-28 object-cover rounded-xl border border-gray-100 shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-28 rounded-xl bg-gray-100 flex items-center justify-center mx-auto">
                    <span className="text-gray-400 text-xs">Sin ID</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acompañantes */}
          {data?.acompanantes?.some((m: any) => m.nombre) && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <SectionHeader icon={<Users size={16} className="text-blue-600" />} label={`Acompañantes (${data.acompanantes.filter((m: any) => m.nombre).length})`} />
              <div className="space-y-3">
                {data.acompanantes.filter((m: any) => m.nombre).map((m: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                   {m.foto?.[0]?.file_url ? (
                      <Image
                        src={m.foto[0].file_url}
                        alt="foto"
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <UserRound size={16} className="text-blue-500" />
                      </div>
                    )}
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
            </div>
          )}

          {/* Equipos */}
          {data?.grupo_equipos?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="equipos" className="border-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Laptop size={14} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Equipos ({data.grupo_equipos.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-2">
                      {data.grupo_equipos.map((item: Equipo, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          {(item.foto_equipo?.length ?? 0) > 0 ? (
                            <Image src={item.foto_equipo?.[0]?.file_url ?? "/nouser.svg"} alt="equipo" width={36} height={36} className="w-9 h-9 rounded-lg object-cover border flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <Laptop size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 flex-1 text-xs">
                            <div><span className="text-gray-400">Tipo</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.tipo ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Marca</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.marca ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Modelo</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.modelo ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Serie</span><p className="font-medium text-gray-700">{item.serie || "—"}</p></div>
                            <div><span className="text-gray-400">Color</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.color ?? "") || "—"}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Vehículos */}
          {data?.grupo_vehiculos?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="vehiculos" className="border-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Car size={14} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Vehículos ({data.grupo_vehiculos.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-2">
                      {data.grupo_vehiculos.map((item: Vehiculo, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          {(item.foto_vehiculo?.length ?? 0) > 0 ? (
                            <Image src={item.foto_vehiculo?.[0]?.file_url ?? "/nouser.svg"} alt="vehiculo" width={36} height={36} className="w-9 h-9 rounded-lg object-cover border flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <Car size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 flex-1 text-xs">
                            <div><span className="text-gray-400">Tipo</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.tipo ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Marca</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.marca ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Modelo</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.modelo ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Placas</span><p className="font-medium text-gray-700">{item.placas || "—"}</p></div>
                            <div><span className="text-gray-400">Color</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.color ?? "") || "—"}</p></div>
                            <div><span className="text-gray-400">Estado</span><p className="font-medium text-gray-700">{capitalizeFirstLetter(item.estado ?? "") || "—"}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-gray-100 flex gap-3 flex-shrink-0 rounded-b-3xl">
          <DialogClose asChild>
            <Button
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-5 font-bold uppercase text-[10px] tracking-widest h-auto"
              onClick={handleClose}
              disabled={isLoadingUpdate}
            >
              Cancelar
            </Button>
          </DialogClose>

          <UpdatedPassModal
            title="Pase de Entrada Completado"
            description=""
            openGeneratedPass={openGeneratedPass}
            hasEmail={data?.email ? true : false}
            hasTelefono={data?.telefono ? true : false}
            setOpenGeneratedPass={setOpenGeneratedPass}
            qr={response?.json?.qr_pase[0].file_url ?? "/nouser.svg"}
            dataPass={responseformated}
            account_id={data?.account_id ?? 0}
            folio={response?.json?.id}
            closePadre={handleClose}
            passData={passData}
            updateResponse={response}
            parentUserId={parentUserId}
          />

          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-bold uppercase text-[10px] tracking-widest h-auto shadow-lg shadow-blue-100"
            type="submit"
            onClick={onSubmit}
            disabled={isLoadingUpdate}
          >
            {!isLoadingUpdate ? (
              "Confirmar pase"
            ) : (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};