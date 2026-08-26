import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Loader2, UserRound, ShieldCheck, Car, Laptop, UserCheck, Download } from "lucide-react";
import { UpdatedPassModal } from "./updated-pass-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { data_correo } from "@/lib/send_correo";
import Image from "next/image";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { Imagen } from "../upload-Image";
import { useCreateAccessPassWalkin } from "@/hooks/useCreateAccessPassWalkin";
import QRious from "qrious";
import { useGetPdf } from "@/hooks/usetGetPdf";
import { descargarPdfPase } from "@/lib/download-pdf";
import { toast } from "sonner";

export type NuevoPaseWalkinData = {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  ubicacion: string;
  caseta: string;
  visita_nombre: string;
  visita_email: string;
  visita_telefono: string;
  motivo: string;
  walkin_fotografia: Imagen[];
  walkin_identificacion: Imagen[];
  equipos: Equipo[];
  vehiculos: Vehiculo[];
  acepto_aviso_privacidad: boolean;
  conservar_datos_por: string;
  firma_reglas_de_acceso?: { file_url: string; file_name: string };
  acepto_reglas_ingreso?: boolean;
};

interface EntryPassModalCreateProps {
  title: string;
  data: NuevoPaseWalkinData | null;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  account_id: number;
}

export const EntryPassModalCreate: React.FC<EntryPassModalCreateProps> = ({
  title,
  data,
  isSuccess,
  setIsSuccess,
  onClose,
  account_id,
}) => {
  const [response, setResponse] = useState<any>(null);
  const [openGeneratedPass, setOpenGeneratedPass] = useState<boolean>(false);
  const [responseformated, setResponseFormated] = useState<data_correo | null>(null);
  const { createAccessPassWalkinMutation, isLoadingCreate } = useCreateAccessPassWalkin();

  // `create_access_pass` (a diferencia de `update_pass`) no regresa una imagen
  // de pase ya diseñada con el QR incrustado, solo el `id` del pase recién
  // creado — por eso el QR se genera aquí mismo en el navegador con ese id,
  // igual que hacía el ingreso.js original (ahí con QRious). Se dibuja en un
  // canvas fuera de pantalla y se convierte a data-URL para poder mostrarlo
  // como imagen dentro de UpdatedPassModal ("Pase de Entrada Completado").
  const recordId: string | undefined = response?.json?.id;
  const [enablePdf, setEnablePdf] = useState(false);
  const { data: responsePdf } = useGetPdf(account_id, recordId ?? "", enablePdf);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const downloadUrl = responsePdf?.response?.data?.data?.download_url;
    if (downloadUrl) {
      descargarPdfPase(downloadUrl);
      setEnablePdf(false);
      toast.success("¡PDF descargado correctamente!");
    }
  }, [responsePdf]);

  useEffect(() => {
    if (recordId) {
      const canvas = document.createElement("canvas");
      new QRious({
        element: canvas,
        value: recordId,
        size: 200,
        backgroundAlpha: 0,
        foreground: "#505050",
        level: "L",
      });
      setQrDataUrl(canvas.toDataURL());
    }
  }, [recordId]);

  const onSubmit = async () => {
    if (!data) return;

    createAccessPassWalkinMutation.mutate(
      {
        access_pass: {
          ubicaciones: [data.ubicacion],
          nombre: data.nombre,
          perfil_pase: data.caseta === "Lobby" ? "Internos" : "Walkin",
          telefono: data.telefono,
          visita_a: {
            nombre: data.visita_nombre,
            email: data.visita_email,
            telefono: data.visita_telefono,
          },
          email: data.email,
          empresa: data.empresa,
          foto: data.walkin_fotografia,
          identificacion: data.walkin_identificacion,
          equipos: data.equipos,
          vehiculos: data.vehiculos,
          motivo: data.motivo,
          created_from: "auto_registro",
          // El backend compara este valor contra el string literal "true"
          // (no "sí"/"no", no un booleano) — ver create_access_pass.
          acepto_aviso_privacidad: data.acepto_aviso_privacidad ? "true" : "false",
          conservar_datos_por: data.conservar_datos_por,
          firma_reglas_de_acceso: data.firma_reglas_de_acceso ?? { file_url: "", file_name: "" },
          acepto_reglas_ingreso: data.acepto_reglas_ingreso ? "true" : "false",
        },
        account_id,
      },
      {
        onSuccess: (response) => {
          setResponseFormated({
            email_to: data.email,
            asunto: "",
            email_from: "",
            nombre: data.nombre,
            nombre_organizador: "",
            ubicacion: data.ubicacion,
            fecha: { desde: "", hasta: "" },
            descripcion: "",
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
        <div className="bg-blue-600 p-6 text-white text-center flex-shrink-0 rounded-t-3xl">
          <DialogTitle className="text-xl font-bold tracking-tight uppercase">
            {title}
          </DialogTitle>
          <p className="text-xs text-blue-100 mt-1 opacity-80 uppercase tracking-widest">
            Confirma los detalles del pase
          </p>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/50">
        {response ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-lg font-bold text-slate-800">¡Pase creado correctamente!</p>
            <p className="text-sm text-gray-500">Tu código QR está en la siguiente ventana.</p>
            {recordId && <p className="text-xs text-gray-400">Folio: {recordId}</p>}
          </div>
        ) : (
          <>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={<UserRound size={16} className="text-blue-600" />} label="Datos Personales" />
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <LabelValue label="Nombre Completo" value={data?.nombre} />
                <LabelValue label="Empresa" value={data?.empresa} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                <LabelValue label="Email" value={data?.email} />
                <LabelValue label="Teléfono" value={data?.telefono} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                <LabelValue label="Ubicación" value={data?.ubicacion} />
                <LabelValue label="Caseta" value={data?.caseta} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={<UserCheck size={16} className="text-blue-600" />} label="Visita a" />
            <div className="grid grid-cols-3 gap-4">
              <LabelValue label="Nombre" value={data?.visita_nombre} />
              <LabelValue label="Email" value={data?.visita_email} />
              <LabelValue label="Teléfono" value={data?.visita_telefono} />
            </div>
            <div className="pt-3 mt-3 border-t border-gray-50">
              <LabelValue label="Motivo" value={data?.motivo} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={<ShieldCheck size={16} className="text-blue-600" />} label="Documentos" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fotografía</p>
                {(data?.walkin_fotografia?.length ?? 0) > 0 ? (
                  <div className="flex justify-center">
                    <Image
                      src={data!.walkin_fotografia[0].file_url ?? "/nouser.svg"}
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
                {(data?.walkin_identificacion?.length ?? 0) > 0 ? (
                  <div className="flex justify-center">
                    <Image
                      src={data!.walkin_identificacion[0].file_url ?? "/nouser.svg"}
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

          {data?.firma_reglas_de_acceso?.file_url && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <SectionHeader icon={<ShieldCheck size={16} className="text-blue-600" />} label="Firma de reglas de acceso" />
              <div className="flex justify-center">
                <Image
                  src={data.firma_reglas_de_acceso.file_url}
                  alt="Firma"
                  width={200}
                  height={100}
                  className="max-w-full h-auto rounded-xl border border-gray-100 shadow-sm bg-gray-50"
                />
              </div>
            </div>
          )}

          {(data?.equipos?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="equipos" className="border-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Laptop size={14} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Equipos ({data?.equipos.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-2">
                      {data?.equipos.map((item: Equipo, index: number) => (
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

          {(data?.vehiculos?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="vehiculos" className="border-none">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-1.5 rounded-lg">
                        <Car size={14} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Vehículos ({data?.vehiculos.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4">
                    <div className="space-y-2">
                      {data?.vehiculos.map((item: Vehiculo, index: number) => (
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
          </>
        )}
        </div>

        <div className="p-5 bg-white border-t border-gray-100 flex gap-3 flex-shrink-0 rounded-b-3xl">
          {!response ? (
            <>
              <DialogClose asChild>
                <Button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-5 font-bold uppercase text-[10px] tracking-widest h-auto"
                  onClick={handleClose}
                  disabled={isLoadingCreate}
                >
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-bold uppercase text-[10px] tracking-widest h-auto shadow-lg shadow-blue-100"
                type="submit"
                onClick={onSubmit}
                disabled={isLoadingCreate}
              >
                {!isLoadingCreate ? (
                  "Crear pase"
                ) : (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</>
                )}
              </Button>
            </>
          ) : (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-5 font-bold uppercase text-[10px] tracking-widest h-auto flex items-center justify-center gap-2"
              type="button"
              onClick={() => setEnablePdf(true)}
            >
              <Download size={14} /> Descargar PDF
            </Button>
          )}

          <UpdatedPassModal
            title="Pase de Entrada Completado"
            description=""
            openGeneratedPass={openGeneratedPass}
            hasEmail={!!data?.email}
            hasTelefono={!!data?.telefono}
            setOpenGeneratedPass={setOpenGeneratedPass}
            gafeteImgUrl={qrDataUrl}
            dataPass={responseformated}
            account_id={account_id ?? 0}
            folio={response?.json?.id}
            closePadre={handleClose}
            passData={{ pass_selected: { _id: response?.json?.id } }}
            updateResponse={response}
            parentUserId={account_id}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
