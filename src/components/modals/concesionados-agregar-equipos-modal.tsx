/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Calculator } from "lucide-react";
import LoadImage from "../upload-Image";
import { EquipoConcesionado } from "../concesionados-tab-datos";
import { formatCurrency } from "@/lib/utils";
import { equipoSchema } from "./add-article.con";
import { format } from "date-fns";
import { useCatalogoConcesion } from "@/hooks/useCatalogoConcesion";
import { useBoothStore } from "@/store/useBoothStore";
import { getTipoConcesion } from "@/lib/articulos-concesionados";
import Image from "next/image";
import { SearchSelect } from "../custom-search-select";

interface AgregarEquiposModalProps {
  title: string;
  children: React.ReactNode;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  setEquipos: Dispatch<SetStateAction<EquipoConcesionado[]>>;
  indice: number | null;
  editarAgregarEquiposModal: boolean;
  setEditarAgregarEquiposModal: Dispatch<SetStateAction<any>>;
  agregarEquiposSeleccion: any;
}

type Equipo = {
  article_name: string;
  article_image?: { file_url: string }[];
  article_cost?: number;
};

export const ConcesionadosAgregarEquipoModal: React.FC<AgregarEquiposModalProps> = ({
  title,
  children,
  isSuccess,
  setIsSuccess,
  setEquipos,
  indice,
  editarAgregarEquiposModal,
  setEditarAgregarEquiposModal,
  agregarEquiposSeleccion,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const { location } = useBoothStore();
  const { dataCon, isLoadingCon: loadingCategorias } = useCatalogoConcesion(location ?? "", categoriaSeleccionada, isSuccess);
  const [categoriasCatalogo, setCategoriasCatalogo] = useState<string[]>([]);
  const [equiposCatalogo, setEquiposCatalogo] = useState<Equipo[]>([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [isLoadingImage,setLoadingImage]=useState(false)
  const equiposCache = useRef<Record<string, Equipo[]>>({});

  const form = useForm<z.infer<typeof equipoSchema>>({
    resolver: zodResolver(equipoSchema),
    defaultValues: {
      id_movimiento: "",
      categoria_equipo_concesion: "",
      nombre_equipo: "",
      cantidad_equipo_concesion: 0,
      comentario_entrega: "",
      imagen_equipo_concesion: [],
      costo_equipo_concesion: 0,
    },
  });

  const { reset } = form;

  const fetchEquipos = async () => {
    if (!categoriaSeleccionada) return;
    form.setValue("nombre_equipo", "");
    if (equiposCache.current[categoriaSeleccionada]) {
      setEquiposCatalogo(equiposCache.current[categoriaSeleccionada]);
      return;
    }
    setEquiposCatalogo([]);
    setLoadingEquipos(true);
    try {
      const equipos = await getTipoConcesion(location ?? "", categoriaSeleccionada);
      const data = equipos.response.data ?? [];
      equiposCache.current[categoriaSeleccionada] = data;
      setEquiposCatalogo(data);
    } catch (error) {
      console.error("Error al cargar equipos:", error);
      setEquiposCatalogo([]);
      toast.error("No se pudieron cargar los equipos. Intenta de nuevo.");
    } finally {
      setLoadingEquipos(false);
    }
  };

  const equipoSeleccionadoNombre = form.watch("nombre_equipo");
  const cantidad = form.watch("cantidad_equipo_concesion");
  const equipoCompleto = equiposCatalogo?.find((eq) => eq.article_name === equipoSeleccionadoNombre);
  const subtotal = equipoCompleto && cantidad ? (equipoCompleto.article_cost ?? 0) * cantidad : 0;

  useEffect(() => {
    if (!dataCon?.length) return;
    if (categoriaSeleccionada === "") {
      setCategoriasCatalogo((prev) => (prev.length === 0 ? dataCon : prev));
    }
  }, [dataCon, categoriaSeleccionada]);

  useEffect(() => { fetchEquipos(); }, [categoriaSeleccionada, location]);

  useEffect(() => {
    if (isSuccess) {
      reset({
        id_movimiento: "",
        categoria_equipo_concesion: "",
        nombre_equipo: "",
        cantidad_equipo_concesion: 0,
        comentario_entrega: "",
        imagen_equipo_concesion: [],
        costo_equipo_concesion: 0,
      });
      setCategoriaSeleccionada("");
    }
    if (editarAgregarEquiposModal && agregarEquiposSeleccion) {
      reset({
        id_movimiento: agregarEquiposSeleccion.id_movimiento,
        categoria_equipo_concesion: agregarEquiposSeleccion.categoria_equipo_concesion,
        nombre_equipo: agregarEquiposSeleccion.nombre_equipo,
        cantidad_equipo_concesion: agregarEquiposSeleccion.cantidad_equipo_concesion,
        comentario_entrega: agregarEquiposSeleccion.comentario_entrega,
        imagen_equipo_concesion: agregarEquiposSeleccion.imagen_equipo_concesion,
        costo_equipo_concesion: agregarEquiposSeleccion.costo_equipo_concesion,
      });
      setCategoriaSeleccionada(agregarEquiposSeleccion.categoria_equipo_concesion ?? "");
    }
  }, [isSuccess, reset, editarAgregarEquiposModal, agregarEquiposSeleccion]);

  function onSubmit(values: z.infer<typeof equipoSchema>) {
    const id_movimiento = `MOV-${format(new Date(), "yyyyMMddHHmmss")}`;
    console.log("id_movimiento", id_movimiento);
    const formatData = {
      categoria_equipo_concesion: values.categoria_equipo_concesion,
      nombre_equipo: values.nombre_equipo,
      cantidad_equipo_concesion: values.cantidad_equipo_concesion,
      comentario_entrega: values.comentario_entrega,
      imagen_equipo_concesion: values.imagen_equipo_concesion,
      costo_equipo_concesion: values.costo_equipo_concesion,
    };
    if (editarAgregarEquiposModal) {
      setEditarAgregarEquiposModal(false);
      setEquipos((prev: any[]) =>
        prev.map((item, i) => (i === indice ? { ...formatData, id_movimiento: item.id_movimiento } : item))
      );
      toast.success("Equipo editado correctamente.");
    } else {
      setEquipos((prev: any) => [...prev, formatData]);
      toast.success("Equipo agregado correctamente.");
    }
    setIsSuccess(false);
  }

  const handleClose = () => {
    setIsSuccess(false);
    setEditarAgregarEquiposModal(false);
  };

  const equipoSeleccionado = form.watch("nombre_equipo");

  return (
    <Dialog onOpenChange={setIsSuccess} open={isSuccess} modal>
      <DialogTrigger>{children}</DialogTrigger>

      <DialogContent
        className="max-w-xl max-h-[90vh] flex flex-col bg-white p-0 overflow-visible"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">
            {editarAgregarEquiposModal ? "Modifica los datos del equipo" : "Completa la información del equipo"}
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto overflow-x-visible px-6">
          <Form {...form}>
            <form className="space-y-4">

              <div className="p-5 py-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">

                  <FormField
                    control={form.control}
                    name="categoria_equipo_concesion"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className="text-red-400">*</span> Categoría
                        </FormLabel>
                        <FormControl>
                          <SearchSelect
                            options={categoriasCatalogo}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              setCategoriaSeleccionada(val);
                              form.setValue("nombre_equipo", "");
                            }}
                            isLoading={loadingCategorias}
                            placeholder="Selecciona una categoría"
                            noOptionsMessage="Sin categorías disponibles"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nombre_equipo"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className="text-red-400">*</span> Equipo
                        </FormLabel>
                        <FormControl>
                          <SearchSelect
                            options={equiposCatalogo.map((e) => e.article_name)}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            isLoading={loadingEquipos}
                            isDisabled={!categoriaSeleccionada}
                            placeholder={
                              !categoriaSeleccionada
                                ? "Primero selecciona una categoría"
                                : "Selecciona un equipo"
                            }
                            noOptionsMessage="Sin equipos disponibles"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {equipoSeleccionado && equiposCatalogo && (() => {
                  const eq = equiposCatalogo.find((e: any) => e.article_name === equipoSeleccionado);
                  const imagenUrl = eq?.article_image?.[0]?.file_url || "/mountain.svg";
                  const precio = eq?.article_cost || 0;
                  form.setValue("costo_equipo_concesion", precio);
                  return (
                    <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-100 rounded-xl mt-2">
                      <Image
                        width={72}
                        height={72}
                        src={imagenUrl}
                        alt={equipoSeleccionado}
                        className="w-18 h-18 object-contain rounded-lg border bg-white p-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{equipoSeleccionado}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Calculator size={14} className="text-blue-500" />
                          <span className="text-xs font-semibold text-blue-600">Precio unitario:</span>
                          <span className="text-xs font-bold text-blue-700">{formatCurrency(precio)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-5 py-0 space-y-4">
                <FormField
                  control={form.control}
                  name="cantidad_equipo_concesion"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Unidades
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="bg-white border-gray-200"
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          value={Number(field.value) || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comentario_entrega"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Comentarios
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Comentarios..."
                          className="resize-none bg-white border-gray-200"
                          onChange={(e) => field.onChange(e)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                    <Calculator size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-blue-600">Subtotal:</span>
                    <span className="text-sm font-bold text-blue-700">{formatCurrency(subtotal)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 py-0">
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wide">Evidencia</h3>
                <Controller
                  control={form.control}
                  name="imagen_equipo_concesion"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col">
                      <LoadImage
                        id="fotografia"
                        titulo="Fotografía del equipo"
                        showWebcamOption={true}
                        imgArray={field.value || []}
                        setImg={(imgs) => field.onChange(imgs)}
                        facingMode="user"
                        limit={20}
                        onLoadingChange={setLoadingImage}
                      />
                      {fieldState.error && (
                        <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>
                      )}
                    </div>
                  )}
                />
              </div>

            </form>
          </Form>
        </div>

        <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex gap-3">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center justify-center gap-2"
            disabled={isLoadingImage}
          >
            {isLoadingImage ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Subiendo imagen...
              </>
            ) : editarAgregarEquiposModal ? (
              "Guardar cambios"
            ) : (
              "Agregar equipo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};