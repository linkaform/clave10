import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { Loader2, User, Shield, CalendarClock, Car, Wrench, Image as ImageIcon, Layers, MessageSquare } from "lucide-react";
import { Areas, Comentarios, enviar_pre_sms, Link } from "@/hooks/useCreateAccessPass";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import CalendarDays from "../calendar-days";
import { toast } from "sonner";
import { descargarPdfPase } from "@/lib/download-pdf";
import { useGetPdf } from "@/hooks/usetGetPdf";
import { useSendCorreoSms } from "@/hooks/useSendCorreo";
import Image from "next/image";
import useAuthStore from "@/store/useAuthStore";
import { AddEmailModal } from "./add-mail";
import { AddSmsModal } from "./add-sms";
import { capitalizeFirstLetter } from "@/lib/utils";
import ModalDescargarPase from "./download-pase-options";
import { Imagen } from "../upload-Image";
import { Equipo } from "@/lib/update-pass";
import { getImgPassUrl } from "@/lib/endpoints";

type Vehiculo_custom = {
  tipo_vehiculo: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  state: string;
  placas_vehiculo: string;
  color_vehiculo: string;
};

interface ViewPassModalProps {
  title: string;
  data: {
    _id: string;
    folio: string;
    nombre: string;
    email: string;
    telefono: string;
    ubicacion: string;
    tema_cita: string;
    descripcion: string;
    perfil_pase: string;
    status_pase: string;
    visita_a: any[];
    custom: boolean;
    link: Link;
    limitado_a_dias: string[];
    foto: Imagen[];
    identificacion: Imagen[];
    enviar_correo_pre_registro: string[];
    tipo_visita_pase: string;
    fechaFija: string;
    fecha_desde_visita: string;
    fecha_desde_hasta: string;
    config_dia_de_acceso: string;
    config_dias_acceso: string[];
    config_limitar_acceso: number;
    areas: Areas[];
    qr_pase: any[];
    comentarios: Comentarios[];
    enviar_pre_sms: enviar_pre_sms;
    grupo_vehiculos: Vehiculo_custom[];
    grupo_equipos: Equipo[];
    pdf_to_img: Imagen[];
  };
  isSuccess: boolean;
  children: React.ReactNode;
}


function SectionCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-50 p-1.5 rounded-lg">
          <span className="text-blue-600 flex">{icon}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800 break-words">{value || "—"}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    activo: "bg-green-100 text-green-700 border-green-200",
    proceso: "bg-blue-100 text-blue-700 border-blue-200",
    vencido: "bg-red-100 text-red-700 border-red-200",
  };
  const cls = map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full border text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}


export const ViewPassModal: React.FC<ViewPassModalProps> = ({ title, data, children }) => {
  const [open, setOpen] = useState(false);
  const { userIdSoter, userParentId } = useAuthStore();
  const account_id = userIdSoter;
  const [enablePdf, setEnablePdf] = useState(false);
  const { data: responsePdf } = useGetPdf(userParentId, data._id, enablePdf);
  const [loadingImgPass, setLoadingImgPass] = useState(false);
  const [urlImgPass, setUrlImgPass] = useState<string>("");
  const { createSendCorreoSms, createSendSms, isLoadingCorreo, isLoadingSms } = useSendCorreoSms();
  const downloadUrl = responsePdf?.response?.data?.data?.download_url;

  const [openAddMail, setOpenAddMail] = useState(false);
  const [openAddPhone, setOpenAddPhone] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const ubicaciones: string[] = Array.isArray(data?.ubicacion)
    ? data.ubicacion
    : typeof data?.ubicacion === "string" && data.ubicacion
    ? [data.ubicacion]
    : [];

  function onEnviarCorreo() {
    if (data?.status_pase?.toLowerCase() != "vencido") {
      if (data?.email !== "") {
        let tipo_envio = "";
        if (data?.status_pase?.toLowerCase() === "activo") tipo_envio = "enviar_correo";
        else if (data?.status_pase?.toLowerCase() === "proceso") tipo_envio = "enviar_correo_pre_registro";
        const data_for_msj = {
          email_to: data.email,
          asunto: data.tema_cita,
          email_from: data.visita_a.length > 0 ? data.visita_a[0]?.email[0] : "",
          nombre: data.nombre,
          nombre_organizador: data.visita_a.length > 0 ? data.visita_a[0].nombre : "",
          ubicacion: data.ubicacion,
          fecha: { desde: data.fecha_desde_visita, hasta: data.fecha_desde_hasta },
          descripcion: data.descripcion,
        };
        createSendCorreoSms.mutate({ account_id, envio: [tipo_envio], data_for_msj, folio: data._id });
      } else {
        setOpenAddMail(true);
      }
    } else {
      toast.error("El pase ha vencido, edita el pase para poder enviarlo.");
    }
  }

  function onEnviarSMS() {
    if (data?.status_pase?.toLowerCase() != "vencido") {
      if (data?.telefono !== "") {
        let tipo_envio = "";
        if (data?.status_pase?.toLowerCase() === "activo") tipo_envio = "enviar_sms";
        else if (data?.status_pase?.toLowerCase() === "proceso") tipo_envio = "enviar_sms_pre_registro";
        const data_for_msj = {
          email_to: data.email,
          asunto: data.tema_cita,
          email_from: data.visita_a.length > 0 ? data.visita_a[0]?.email[0] : "",
          nombre: data.nombre,
          nombre_organizador: data.visita_a.length > 0 ? data.visita_a[0].nombre : "",
          ubicacion: data.ubicacion,
          fecha: { desde: data.fecha_desde_visita, hasta: data.fecha_desde_hasta },
          descripcion: data.descripcion,
        };
        createSendSms.mutate({ account_id, envio: [tipo_envio], data_for_msj, folio: data._id });
      } else {
        setOpenAddPhone(true);
      }
    } else {
      toast.error("El pase ha vencido, edita el pase para poder enviarlo.");
    }
  }

  useEffect(() => {
    if (downloadUrl && enablePdf) {
      onDescargarPDF(downloadUrl);
      setEnablePdf(false);
      toast.success("¡PDF descargado correctamente!");
    }
  }, [downloadUrl, enablePdf]);

  async function onDescargarPDF(download_url: string) {
    try {
      await descargarPdfPase(download_url);
    } catch (error) {
      toast.error("Error al descargar el PDF: " + error);
    }
  }

  const onDescargarPNG = async (imgUrl: string) => {
    try {
      const response = await fetch(imgUrl);
      if (!response.ok) throw new Error("No se pudo obtener la imagen");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pase.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("¡Pase descargado correctamente!");
    } catch (error) {
      toast.error("Error al descargar la imagen: " + error);
    }
  };

  const handleClickImgButton = async () => {
    const record_id = data?._id;
    const passImg = data?.pdf_to_img;
    if (urlImgPass) { onDescargarPNG(urlImgPass); return; }
    else if (passImg && passImg.length > 0) { onDescargarPNG(passImg[0]?.file_url ?? ""); return; }
    if (!record_id) {
      toast.error("No hay pase disponible", { style: { background: "#dc2626", color: "#fff", border: "none" } });
      return;
    }
    try {
      setLoadingImgPass(true);
      toast.loading("Obteniendo tu pase...", { style: { background: "#000", color: "#fff", border: "none" } });
      const res = await getImgPassUrl(userParentId ?? 0, record_id);
      const url = res?.response?.data || "";
      if (url) { setUrlImgPass(url); onDescargarPNG(url); }
      else toast.error("No hay pase disponible", { style: { background: "#dc2626", color: "#fff", border: "none" } });
      toast.dismiss();
      setLoadingImgPass(false);
    } catch (error) {
      console.log(error);
      toast.error("Error al obtener pase", { style: { background: "#dc2626", color: "#fff", border: "none" } });
      toast.dismiss();
      setLoadingImgPass(false);
    }
  };

  const handleDescargarImagen = () => { handleClickImgButton(); setModalOpen(false); };
  const handleDescargarPDF = () => { setEnablePdf(true); setModalOpen(false); };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      <DialogOverlay className="pointer-events-none" />
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-w-2xl max-h-[92vh] flex flex-col pointer-events-auto p-0 gap-0 rounded-3xl overflow-hidden border-none [&>button]:z-50"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
        <div className="bg-blue-600 px-6 py-5 flex-shrink-0">
          <DialogTitle className="text-xl text-center font-bold text-white tracking-wide uppercase">
            {title}
          </DialogTitle>
          <p className="text-center text-blue-200 text-xs mt-1 tracking-widest uppercase">
            Confirma los detalles del pase
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 bg-gray-50/50">
          <AddEmailModal title="Agregar Correo" open={openAddMail} setOpen={setOpenAddMail} id={data._id} setOpenPadre={setOpen} />
          <AddSmsModal title="Agregar Teléfono" open={openAddPhone} setOpen={setOpenAddPhone} id={data._id} setOpenPadre={setOpen} />

          <SectionCard icon={<User size={15} />} label="Datos personales">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Nombre completo" value={data?.nombre} wide />
              <Field label="Email" value={data?.email} />
              <Field label="Teléfono" value={data?.telefono} />
              <Field label="Tipo de pase" value={data?.tipo_visita_pase ? capitalizeFirstLetter(data.tipo_visita_pase) : undefined} />
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">Estatus</p>
                <StatusBadge status={data?.status_pase} />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Shield size={15} />} label="Detalles de visita">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Tema de la cita" value={data?.tema_cita} wide />
              <Field label="Descripción" value={data?.descripcion} wide />

              {data?.visita_a?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">
                    Visita a
                  </p>
                  <div className="relative group inline-flex items-center gap-1 text-sm font-medium text-gray-800">
                    {data.visita_a[0]?.nombre}
                    {data.visita_a[0]?.puesto && (
                      <span className="text-xs text-gray-400 ml-1">— {data.visita_a[0].puesto}</span>
                    )}
                    {data.visita_a.length > 1 && (
                      <span className="text-blue-600 cursor-pointer underline relative ml-1">
                        +{data.visita_a.length - 1}
                        <div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                          {data.visita_a.slice(1).map((v: any, idx: number) => (
                            <div key={idx}>{v.nombre}{v.puesto ? ` — ${v.puesto}` : ""}</div>
                          ))}
                        </div>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {ubicaciones.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">
                    Ubicación
                  </p>
                  <div className="relative group inline-flex items-center gap-1 text-sm font-medium text-gray-800">
                    {ubicaciones[0]}
                    {ubicaciones.length > 1 && (
                      <span className="text-blue-600 cursor-pointer underline relative">
                        +{ubicaciones.length - 1}
                        <div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                          {ubicaciones.slice(1).map((ubic, idx) => (
                            <div key={idx}>{ubic}</div>
                          ))}
                        </div>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard icon={<CalendarClock size={15} />} label="Vigencia y accesos">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">Fecha inicio</p>
                <p className="text-sm font-semibold text-gray-800">{data?.fecha_desde_visita || "—"}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">Fecha hasta</p>
                <p className="text-sm font-semibold text-gray-800">{data?.fecha_desde_hasta || "—"}</p>
              </div>
            </div>

            {data?.limitado_a_dias !== undefined && data?.limitado_a_dias.length > 0 && (
              <div className="mt-4">
                <CalendarDays diasDisponibles={data?.limitado_a_dias} />
              </div>
            )}
          </SectionCard>

          {(data?.foto?.length > 0 || data?.identificacion?.length > 0) && (
            <SectionCard icon={<ImageIcon size={15} />} label="Fotografías">
              <div className="flex gap-8 justify-center">
                {data?.foto?.length > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Fotografía</p>
                    <Image
                      src={data.foto[0].file_url ?? ""}
                      alt="Fotografía"
                      width={120}
                      height={120}
                      className="h-28 w-28 object-contain rounded-xl border border-gray-100 shadow-sm"
                    />
                  </div>
                )}
                {data?.identificacion?.length > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Identificación</p>
                    <Image
                      src={data.identificacion[0].file_url ?? ""}
                      alt="Identificación"
                      width={120}
                      height={120}
                      className="h-28 w-28 object-contain rounded-xl border border-gray-100 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {data?.areas?.length > 0 && (
            <SectionCard icon={<Layers size={15} />} label="Áreas autorizadas">
              <div className="space-y-2">
                {data.areas.map((area: Areas, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                    <p className="text-xs font-bold text-gray-800">{area.nombre_area}</p>
                    {(area as any).incidente_area && (
                      <p className="text-[11px] text-blue-600 font-medium">{(area as any).incidente_area}</p>
                    )}
                    <p className="text-[11px] text-gray-500 italic">{area.commentario_area || "Sin comentarios"}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {data?.comentarios?.length > 0 && (
            <SectionCard icon={<MessageSquare size={15} />} label="Comentarios del pase">
              <div className="space-y-2">
                {data.comentarios.map((com: Comentarios, index: number) => (
                  <div key={index} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <p className="text-[11px] text-gray-700 font-medium leading-relaxed italic">&quot;{com.comentario_pase}&quot;</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard icon={<Wrench size={15} />} label="Equipos">
            {data?.grupo_equipos?.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="1" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold text-gray-700 py-1 hover:no-underline">
                    Equipos agregados
                  </AccordionTrigger>
                  <AccordionContent>
                    <table className="min-w-full table-auto border-separate border-spacing-1 text-xs">
                      <thead>
                        <tr>
                          {["Tipo", "Nombre", "Marca", "Modelo", "No. serie", "Color"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold border-b">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.grupo_equipos.map((item: Equipo, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{capitalizeFirstLetter(item?.tipo ?? "")}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item?.nombre ?? "")}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item?.marca ?? "")}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item?.modelo ?? "")}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item?.serie ?? "")}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item?.color ?? "")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="rounded-full bg-gray-100 p-3">
                  <Wrench size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No se agregaron equipos</p>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={<Car size={15} />} label="Vehículos">
            {data?.grupo_vehiculos?.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="1" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold text-gray-700 py-1 hover:no-underline">
                    Lista de vehículos
                  </AccordionTrigger>
                  <AccordionContent>
                    <table className="min-w-full table-auto border-separate border-spacing-1 text-xs">
                      <thead>
                        <tr>
                          {["Tipo", "Marca", "Modelo", "Estado", "Placas", "Color"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold border-b">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.grupo_vehiculos.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{capitalizeFirstLetter(item.tipo) || ""}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item.marca) || ""}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item.modelo) || ""}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item.estado) || ""}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item.placas) || ""}</td>
                            <td className="px-3 py-2">{capitalizeFirstLetter(item.color) || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="rounded-full bg-gray-100 p-3">
                  <Car size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">No se agregaron vehículos</p>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-6 py-5 flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl h-11 font-semibold">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-xl h-11 font-semibold"
            onClick={() => {
              navigator.clipboard.writeText(data?.link?.link).then(() => {
                toast("¡Enlace copiado!", {
                  description: "El enlace ha sido copiado correctamente al portapapeles.",
                  action: { label: "Abrir enlace", onClick: () => window.open(data?.link?.link, "_blank") },
                });
              });
              setOpen(false);
            }}
          >
            Copiar Link
          </Button>

          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11 font-semibold"
            onClick={onEnviarCorreo}
            disabled={isLoadingCorreo}
          >
            {!isLoadingCorreo ? "Enviar Correo" : <><Loader2 className="animate-spin mr-1" size={16} />Enviando...</>}
          </Button>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-semibold"
            onClick={onEnviarSMS}
            disabled={isLoadingSms}
          >
            {isLoadingSms ? <><Loader2 className="animate-spin mr-1" size={16} />Enviando...</> : "Enviar SMS"}
          </Button>

          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl h-11 font-semibold"
            onClick={() => setModalOpen(true)}
            disabled={loadingImgPass}
          >
            {!loadingImgPass ? "Descargar Pase" : <><Loader2 className="animate-spin mr-1" size={16} />Descargando...</>}
          </Button>
        </div>

        <ModalDescargarPase
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onDescargarImagen={handleDescargarImagen}
          onDescargarPDF={handleDescargarPDF}
        />
      </DialogContent>
    </Dialog>
  );
};