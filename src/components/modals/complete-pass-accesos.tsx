/* eslint-disable @typescript-eslint/no-unused-vars */
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "../ui/dialog";
import Multiselect from 'multiselect-react-dropdown';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import LoadImage, { Imagen } from "../upload-Image";
import { useUpdateAccessPass } from "@/hooks/useUpdatePass";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import useAuthStore from "@/store/useAuthStore";
import { Car, Laptop, Loader2, Plus, Trash2 } from "lucide-react";
import { VehicleLocalPassModal } from "./add-local-vehicule";
import { EqipmentLocalPassModal } from "./add-local-equipo";
import { toast } from "sonner";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { isVehiculoHabilitado, uniqueArray } from "@/lib/utils";
import { useSearchPass } from "@/hooks/useSearchPass";
import { DialogTitle } from "../ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface Props {
  title: string;
  children: React.ReactNode;
  id: string;
  dataCatalogos: any;
}

const formSchema = z.object({
  visita_a: z.array(z.any()).optional(),
  foto: z.array(z.object({ file_url: z.string(), file_name: z.string() })).optional(),
  identificacion: z.array(z.object({ file_url: z.string(), file_name: z.string() })).optional(),
  area: z.string().optional(),
  status_pase: z.string().optional(),
});

export const UpdatePassModal: React.FC<Props> = ({ title, children, id, dataCatalogos }) => {
  const { userParentId } = useAuthStore();
  const [openModal, setOpenModal] = useState(false);
  const [fotografia, setFotografia] = useState<Imagen[]>([]);
  const [identificacion, setIdentificacion] = useState<Imagen[]>([]);
  const { updatePassMutation, isLoadingUpdate } = useUpdateAccessPass();
  const [showIneIden] = useState("iden-foto");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [errorFotografia, setErrorFotografia] = useState("");
  const [errorIdentificacion, setErrorIdentificacion] = useState("");

  const { assets } = useSearchPass(true);
  const assetsUnique = uniqueArray(assets?.Visita_a);
  assetsUnique.unshift("Usuario Actual");

  const visitaAFormatted = (assetsUnique || [])
    .filter((u: any) => u !== null && u !== undefined)
    .map((u: any) => ({ id: u, name: u }));

  const visitaDataFormateada = (dataCatalogos?.visita_a || []).map((item: any) => ({
    id: item.nombre,
    name: item.nombre,
  }));

  const vehiculoHabilitado = isVehiculoHabilitado(dataCatalogos?.habilitar_vehiculo);

  const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>(
    visitaDataFormateada.length > 0
      ? visitaDataFormateada
      : [{ id: "Usuario Actual", name: "Usuario Actual" }]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { foto: [], identificacion: [], area: "", status_pase: "activo", visita_a: [] },
  });

  useEffect(() => {
    setErrorFotografia("");
    setErrorIdentificacion("");
  }, []);

  function onSubmit(data: z.infer<typeof formSchema>) {
    const access_pass: any = {};
    if (vehicles?.length > 0) access_pass.grupo_vehiculos = vehicles;
    if (equipos?.length > 0) access_pass.grupo_equipos = equipos;
    if (fotografia?.length > 0) access_pass.walkin_fotografia = fotografia;
    if (identificacion?.length > 0) access_pass.walkin_identificacion = identificacion;

    const originalIds = visitaDataFormateada.map((v: { id: any }) => v.id).sort();
    const currentIds = visitaASeleccionadas.map((v: any) => v.id).sort();
    if (JSON.stringify(originalIds) !== JSON.stringify(currentIds)) access_pass.visita_a = currentIds;

    let hasError = false;
    if (showIneIden?.includes("foto")) {
      const empty = (!dataCatalogos?.walkin_fotografia || dataCatalogos.walkin_fotografia.length === 0) && fotografia.length === 0;
      if (empty) { setErrorFotografia("Este campo es requerido."); hasError = true; }
      else setErrorFotografia("");
    }
    if (showIneIden?.includes("iden")) {
      const empty = (!dataCatalogos?.walkin_identificacion || dataCatalogos.walkin_identificacion.length === 0) && identificacion.length === 0;
      if (empty) { setErrorIdentificacion("Este campo es requerido."); hasError = true; }
      else setErrorIdentificacion("");
    }
    if (hasError) return;

    if (Object.keys(access_pass).length === 0) {
      toast.warning("No se modificaron datos", { style: { background: "#FEF3C7", color: "#92400E" } });
      setOpenModal(false);
      return;
    }

    updatePassMutation.mutate(
      { access_pass, id: dataCatalogos._id, account_id: userParentId ?? 0 },
      { onSuccess: () => setOpenModal(false) }
    );
  }

  const handleRemove = (index: number) => setVehicles((prev) => prev.filter((_, i) => i !== index));
  const handleRemoveEq = (index: number) => setEquipos((prev) => prev.filter((_, i) => i !== index));

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal} modal>
      <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-xl w-full rounded-2xl p-0 overflow-hidden">
            <VisuallyHidden.Root>
                <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden.Root>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">Completa la información del visitante</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-4 space-y-5 overflow-y-auto max-h-[70vh]">

              {/* Info visitante */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nombre</p>
                  <p className="font-medium text-gray-800">{dataCatalogos?.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="font-medium text-gray-800 break-words">{dataCatalogos?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Teléfono</p>
                  <p className="font-medium text-gray-800">{dataCatalogos?.telefono || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Ubicación</p>
                  <div className="relative group font-medium text-gray-800">
                    {dataCatalogos?.ubicacion?.[0]}
                    {dataCatalogos?.ubicacion?.length > 1 && (
                      <span className="text-blue-500 cursor-pointer ml-1 text-xs underline">
                        +{dataCatalogos.ubicacion.length - 1}
                        <div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-lg bg-gray-800 px-2 py-1 text-xs text-white shadow-lg group-hover:block">
                          {dataCatalogos.ubicacion.slice(1).map((u: string, i: number) => <div key={i}>{u}</div>)}
                        </div>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Visita a */}
              <FormField
                control={form.control}
                name="visita_a"
                render={() => (
                  <FormItem>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Visita a</p>
                    <Multiselect
                      options={visitaAFormatted ?? []}
                      selectedValues={visitaASeleccionadas}
                      onSelect={setVisitaASeleccionadas}
                      onRemove={setVisitaASeleccionadas}
                      displayValue="name"
                      style={{
                        chips: { background: "#2563eb", borderRadius: "20px" },
                        searchBox: { borderRadius: "10px", border: "1px solid #e5e7eb", background: "#f9fafb" },
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="h-px bg-gray-100" />

              {/* Fotografía e Identificación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showIneIden?.includes("foto") && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      <span className="text-red-500">*</span> Fotografía
                    </p>
                    <LoadImage
                      id="fotografia"
                      titulo="Fotografía"
                      setImg={setFotografia}
                      showWebcamOption={true}
                      facingMode="user"
                      imgArray={fotografia}
                      limit={1}
                    />
                    {errorFotografia && <p className="text-red-500 text-xs mt-1">{errorFotografia}</p>}
                  </div>
                )}
                {showIneIden?.includes("iden") && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      <span className="text-red-500">*</span> Identificación
                    </p>
                    <LoadImage
                      id="identificacion"
                      titulo="Identificación"
                      setImg={setIdentificacion}
                      showWebcamOption={true}
                      facingMode="environment"
                      imgArray={identificacion}
                      limit={1}
                    />
                    {errorIdentificacion && <p className="text-red-500 text-xs mt-1">{errorIdentificacion}</p>}
                  </div>
                )}
              </div>

              {/* Vehículos */}
              {vehiculoHabilitado && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Vehículos
                        <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-normal normal-case">
                          {vehicles.length}
                        </span>
                      </p>
                      <VehicleLocalPassModal title="Nuevo Vehiculo" vehicles={vehicles} setVehiculos={setVehicles} isAccesos={false} fetch={false}>
                        <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </VehicleLocalPassModal>
                    </div>
                    {vehicles.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No se han agregado vehículos
                      </p>
                    ) : (
                      <Accordion type="multiple" className="space-y-2">
                        {vehicles.map((v, i) => (
                          <AccordionItem key={i} value={`v-${i}`} className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                              <AccordionTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 flex-1 text-left hover:no-underline p-0 [&>svg]:ml-2">
                                <Car className="w-4 h-4 text-gray-400 shrink-0" />
                                {v.tipo || "Sin tipo"} {v.placas && <span className="text-gray-400 font-normal text-xs">· {v.placas}</span>}
                              </AccordionTrigger>
                              <button type="button" onClick={() => handleRemove(i)} className="ml-3 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <AccordionContent>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-3 text-xs text-gray-600">
                                {[["Tipo", v.tipo], ["Marca", v.marca], ["Modelo", v.modelo], ["Placas", v.placas], ["Estado", v.estado], ["Color", v.color]].map(([k, val]) => (
                                  <p key={k}><span className="font-semibold text-gray-700">{k}:</span> {val || "—"}</p>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                </>
              )}

              {/* Equipos */}
              <div className="h-px bg-gray-100" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Equipos
                    <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-normal normal-case">
                      {equipos.length}
                    </span>
                  </p>
                  <EqipmentLocalPassModal title="Nuevo Equipo" equipos={equipos} setEquipos={setEquipos} isAccesos={false}>
                    <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </EqipmentLocalPassModal>
                </div>
                {equipos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No se han agregado equipos
                  </p>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {equipos.map((e, i) => (
                      <AccordionItem key={i} value={`e-${i}`} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                          <AccordionTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 flex-1 text-left hover:no-underline p-0 [&>svg]:ml-2">
                            <Laptop className="w-4 h-4 text-gray-400 shrink-0" />
                            {e.tipo || "Sin tipo"} {e.nombre && <span className="text-gray-400 font-normal text-xs">· {e.nombre}</span>}
                          </AccordionTrigger>
                          <button type="button" onClick={() => handleRemoveEq(i)} className="ml-3 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-3 text-xs text-gray-600">
                            {[["Tipo", e.tipo], ["Nombre", e.nombre], ["Marca", e.marca], ["Modelo", e.modelo], ["No. Serie", e.serie], ["Color", e.color]].map(([k, val]) => (
                              <p key={k}><span className="font-semibold text-gray-700">{k}:</span> {val || "—"}</p>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1 rounded-xl border-gray-200 text-gray-600" onClick={() => form.reset()}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoadingUpdate} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                {isLoadingUpdate
                  ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />Actualizando...</>
                  : "Actualizar pase"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};