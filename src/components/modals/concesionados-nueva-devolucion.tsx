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
import { Dispatch, SetStateAction, useEffect } from "react";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadImage from "../upload-Image";
import { EquipoConcesionado } from "../concesionados-tab-datos";
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";
import { Loader2, Package, User } from "lucide-react";

interface NuevaDevolucionModalProps {
  title: string;
  children: React.ReactNode;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  equipoSelecionado: EquipoConcesionado|null;
  dataConcesion:any
}

const formSchema = z.object({
  entrega_tipo: z.string().min(1, { message: "Este campo es obligatorio" }),
  entrega_concesion: z.string().optional(),
  entrega_concesion_otro: z.string().optional(),
  entrega_company: z.string().optional(),
  estatus: z.string().min(1, { message: "Este campo es obligatorio" }),
  unidades: z.coerce.number().min(0).optional(),
  comentarios: z.string().optional(),
  evidencia: z.array(z.any()).optional(),
  precio: z.number().optional(), 
  identificacion_entrega: z.array(z.any()).optional(),
}).superRefine((values, ctx) => {
  if (values.entrega_tipo === "empleado" && !values.entrega_concesion?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entrega_concesion"], message: "Selecciona a la persona que devuelve" });
  }
  if (values.entrega_tipo === "otro" && !values.entrega_concesion_otro?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entrega_concesion_otro"], message: "Escribe el nombre de la persona que devuelve" });
  }
});

export const NuevaDevolucionEquipoModal: React.FC<NuevaDevolucionModalProps> = ({
  title,
  children,
  isSuccess,
  setIsSuccess,
  equipoSelecionado,
  dataConcesion,
}) => {
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } =
    useCatalogoAreaEmpleadoApoyo(isSuccess);
	const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
	console.log("equipoSelecionado",equipoSelecionado)


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entrega_tipo: "empleado",
      entrega_concesion: "",
      entrega_concesion_otro: "",
      entrega_company: "",
      estatus: "",
      unidades: 0,
      comentarios: "",
      evidencia: [],
      precio: 0,
      identificacion_entrega: [],
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      reset({
        entrega_tipo: "empleado",
        entrega_concesion: "",
        entrega_concesion_otro: "",
        entrega_company: "",
        identificacion_entrega: [],
        estatus: "",
        unidades: 0,
        evidencia: [],
        comentarios: "",
        precio: 0,
      });
    }
  }, [isSuccess, reset]);

  function traducirEstatus(estatus:string) {
	switch (estatus.toLowerCase()) {
	  case "completo":
		return "complete";
	  case "parcial":
		return "lost";
    case "perdido":
      return "lost";
	  case "dañado":
      return "damage";
	  case "danado": 
		return "damage";
	  default:
		return null; 
	}
  }
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("COMENTARIO", values)
    if (equipoSelecionado !== null) {
      devolverEquipoMutation.mutate({
        record_id: dataConcesion?._id ?? "",
        status: "parical",
        entregado_por: values.entrega_tipo as string,
        quien_entrega: values.entrega_tipo === "empleado"
          ? values.entrega_concesion ?? ""
          : values.entrega_concesion_otro ?? "",
        quien_entrega_company: values.entrega_tipo === "otro" ? values.entrega_company ?? "" : "",
        identificacion_entrega: values.identificacion_entrega ? values.identificacion_entrega[0] : [],
        equipos: [{
          id_movimiento: equipoSelecionado?.id_movimiento ?? "",
          cantidad_devuelta: values.unidades ?? 0,
          state: traducirEstatus(values.estatus) ?? "",
          evidencia: values.evidencia ?? [],
          comentario_entrega: values.comentarios ?? "",
        }],
      }, {
        onSuccess: () => setIsSuccess(false),
      });
    } else {
      devolverEquipoMutation.mutate({
        record_id: dataConcesion?._id ?? "",
        status: "total",
        state: traducirEstatus(values.estatus) ?? "complete",
        entregado_por: values.entrega_tipo as "empleado" | "otro",
        quien_entrega: values.entrega_tipo === "empleado"
          ? values.entrega_concesion ?? ""
          : values.entrega_concesion_otro ?? "",
        company: values.entrega_tipo === "otro" ? values.entrega_company ?? "" : "",
        identificacion_entrega: values.identificacion_entrega?.[0] ?? undefined,
        comentario_entrega: values.comentarios ?? "",
        evidencia: values.evidencia ?? [],
      } as any, {
        onSuccess: () => setIsSuccess(false),
      });
    }
  }
  const getParsedValue = (val: any) =>
    typeof val === "object" ? val?.parsedValue ?? 0 : Number(val ?? 0);
  
  const devueltos = getParsedValue(equipoSelecionado?.cantidad_equipo_devuelto);
  const total = getParsedValue(equipoSelecionado?.cantidad_equipo_concesion);
  const pendientesRaw = getParsedValue(equipoSelecionado?.cantidad_equipo_pendiente);
  const pendientes = pendientesRaw === 0 ? total - devueltos : pendientesRaw;


  
  const handleClose = () => setIsSuccess(false);
  const tipoCon = form.watch("entrega_tipo");

  const labelClass = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
  const optionClass = (active: boolean) =>
    `px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
        ? "bg-blue-600 text-white shadow-sm"
        : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
    }`;

  return (
    <Dialog onOpenChange={setIsSuccess} open={isSuccess} modal>
      <DialogTrigger>{children}</DialogTrigger>

      <DialogContent
        className="max-w-3xl max-h-[90vh] flex flex-col bg-white p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {equipoSelecionado ? title : "Devolución Total"}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Registra la devolución del equipo</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 pb-2">
          <Form {...form}>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 pb-2">
              <div className="flex flex-col order-1 md:order-none">
                <div className="flex items-center gap-2 pt-3 pb-1">
                  <User className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Información de quien devuelve</h3>
                </div>
                <div className="py-2">
                  <FormField
                    control={form.control}
                    name="entrega_tipo"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className={labelClass}>¿Quién devuelve?</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { field.onChange("empleado"); form.setValue("entrega_concesion", ""); }}
                              className={optionClass(field.value === "empleado")}
                            >
                              Empleado
                            </button>
                            <button
                              type="button"
                              onClick={() => { field.onChange("otro"); form.setValue("entrega_concesion_otro", ""); }}
                              className={optionClass(field.value === "otro")}
                            >
                              Otro
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {tipoCon === "empleado" && (
                  <div className="py-2">
                    <FormField
                      control={form.control}
                      name="entrega_concesion"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Persona</FormLabel>
                          <Select {...field} onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-gray-200">
                                <SelectValue placeholder={loadingAreaEmpleadoApoyo ? "Cargando empleados..." :
                                  dataAreaEmpleadoApoyo?.length > 0 ? "Selecciona una opción..." :
                                    "Sin opciones disponibles"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {dataAreaEmpleadoApoyo?.length > 0
                                ? dataAreaEmpleadoApoyo.map((item: string, index: number) => (
                                  <SelectItem key={index} value={item}>{item}</SelectItem>
                                ))
                                : <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {tipoCon === "otro" && (
                  <>
                    <div className="py-2">
                      <FormField
                        control={form.control}
                        name="entrega_concesion_otro"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Persona</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre de la persona" className="bg-white border-gray-200" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="py-2">
                      <FormField
                        control={form.control}
                        name="entrega_company"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className={labelClass}>Empresa</FormLabel>
                            <FormControl>
                              <Input placeholder="Empresa (opcional)" className="bg-white border-gray-200" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Columna derecha: datos de la devolución */}
              <div className="flex flex-col order-3 md:order-none">
                <div className="flex items-center gap-2 pt-3 pb-1">
                  <Package className="text-blue-500 w-5 h-5" />
                  <h3 className="font-semibold text-gray-700">Detalle de la devolución</h3>
                </div>
                <div className="py-2">
                  <FormField
                    control={form.control}
                    name="estatus"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Estado</FormLabel>
                        <FormControl>
                          <div className="flex gap-2 flex-wrap">
                            {["completo", "perdido", "dañado"].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => field.onChange(val)}
                                className={optionClass(field.value === val).replace("px-6", "px-5")}
                              >
                                {val.charAt(0).toUpperCase() + val.slice(1)}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {equipoSelecionado !== null && (
                  <div className="py-2">
                    <FormField
                      control={form.control}
                      name="unidades"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className={labelClass}>Unidades entregadas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="bg-white border-gray-200"
                              min={0}
                              max={pendientes}
                              defaultValue={0}
                              onChange={(e) => {
                                const pend = Number(pendientes);
                                const val = Number(e.target.value);
                                if (val > pend) {
                                  e.target.value = "0";
                                  field.onChange(0);
                                } else {
                                  field.onChange(val);
                                }
                              }}
                              onBlur={(e) => {
                                const pendientes = Number(equipoSelecionado?.cantidad_equipo_pendiente ?? 0);
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                const clamped = Math.min(Math.max(val, 0), pendientes);
                                field.onChange(clamped);
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-400 mt-1">
                            {devueltos} de {total} devueltos — Pendientes: {pendientes}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="py-2">
                  <FormField
                    control={form.control}
                    name="comentarios"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className={labelClass}>Comentarios</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe un comentario..."
                            className="resize-none bg-white border-gray-200"
                            onChange={(e) => field.onChange(e)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </div>

              {/* Fila de imágenes: misma altura en ambas columnas */}
              <div className="py-2 order-2 md:order-none">
                <span className={`${labelClass} block mb-2`}>Fotografía de la persona que devuelve</span>
                <Controller
                  control={form.control}
                  name="identificacion_entrega"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col">
                      <LoadImage
                        id="fotografia"
                        titulo="Fotografía"
                        showWebcamOption={true}
                        imgArray={field.value || []}
                        setImg={(imgs) => field.onChange(imgs)}
                        facingMode="user"
                        limit={10} />
                      {fieldState.error && (
                        <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>
                      )}
                    </div>
                  )} />
              </div>
              <div className="py-2 order-4 md:order-none">
                <span className={`${labelClass} block mb-2`}>Evidencia de la devolución</span>
                <Controller
                  control={form.control}
                  name="evidencia"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col">
                      <LoadImage
                        id="evidencia_devolucion"
                        titulo="Evidencia"
                        showWebcamOption={true}
                        imgArray={field.value || []}
                        setImg={(imgs) => field.onChange(imgs)}
                        facingMode="environment"
                        limit={10}
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
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            {isLoading ? (
              <><Loader2 className="animate-spin mr-2" /> Realizando devolución...</>
            ) : (
              "Devolver"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
