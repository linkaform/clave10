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
import { EquipoConcesionado } from "../concesionados-agregar-equipos";
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";
import { Loader2 } from "lucide-react";

interface NuevaDevolucionModalProps {
  title: string;
  children: React.ReactNode;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  equipoSelecionado: EquipoConcesionado;
  dataConcesion:any
}

const formSchema = z.object({
  entrega_tipo: z.string().min(1, { message: "Este campo es obligatorio" }),
  entrega_concesion: z.string().optional(),
  entrega_concesion_otro: z.string().optional(),
  estatus: z.string().min(1, { message: "Este campo es obligatorio" }),
  unidades: z.number().optional(),
  comentarios: z.string().optional(),
  evidencia: z.array(z.any()).optional(),
  precio: z.number().optional(), 
  identificacion_entrega: z.array(z.any()).optional(),
});

export const NuevaDevolucionEquipoModal: React.FC<NuevaDevolucionModalProps> = ({
  title,
  children,
  isSuccess,
  setIsSuccess,
  equipoSelecionado,
  dataConcesion
}) => {
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } =
    useCatalogoAreaEmpleadoApoyo(isSuccess);
	const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
	console.log("equipoSelecionado",equipoSelecionado)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entrega_tipo: "",
      entrega_concesion: "",
      entrega_concesion_otro: "",
      estatus: "",
      unidades: 0,
      comentarios: "",
      evidencia: [],
      precio: 0,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      reset({
        entrega_tipo: "",
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
	  case "dañado":
	  case "danado": 
		return "damage";
	  default:
		return null; 
	}
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    devolverEquipoMutation.mutate({
      record_id: dataConcesion?._id ?? "",
      status: 'parical',
      entregado_por: values.entrega_tipo as "empleado" | "otro",
      quien_entrega: values.entrega_tipo === "empleado"
      ? values.entrega_concesion ?? ""
      : values.entrega_concesion_otro ?? "",
      quien_entrega_company: "Demo",
      identificacion_entrega: values.identificacion_entrega ? values.identificacion_entrega[0]: [],
      equipos: [{
      id_movimiento: equipoSelecionado?.id_movimiento ?? "",
      cantidad_devuelta: values.unidades ?? 0,
      state: traducirEstatus(values.estatus)??'',
      evidencia: values.evidencia ?? [],
      }],
    }, {
      onSuccess: () => setIsSuccess(false),
    });
  }

  const handleClose = () => setIsSuccess(false);
  const tipoCon = form.watch("entrega_tipo");

  return (
    <Dialog onOpenChange={setIsSuccess} open={isSuccess} modal>
      <DialogTrigger>{children}</DialogTrigger>

      <DialogContent
        className="max-w-lg max-h-[90vh] flex flex-col bg-white p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby=""
      >
        <DialogHeader className="flex-shrink-0 bg-white px-6 py-5 border-b">
          <DialogTitle className="text-2xl text-center font-bold text-gray-800">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Registra la devolución del equipo</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6  ">


          <Form {...form}>
            <form >
              <div className=" p-5 py-2">
                <FormField
                  control={form.control}
                  name="entrega_tipo"
                  defaultValue="si"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Entrega
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { field.onChange("empleado"); form.setValue("entrega_concesion", ""); }}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              field.value === "empleado"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                            }`}
                          >
                            Empleado
                          </button>
                          <button
                            type="button"
                            onClick={() => { field.onChange("otro"); form.setValue("entrega_concesion_otro", ""); }}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              field.value === "otro"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                            }`}
                          >
                            Otro
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

               <div className="mt-2 ">
               {tipoCon === "otro" && (
                  <FormField
                    control={form.control}
                    name="entrega_concesion_otro"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Persona
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la persona" className="bg-white border-gray-200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
               </div>
      

                {/* {tipoCon === "otro" && (
                  <Controller
                    control={form.control}
                    name="evidencia"
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col">
                        <LoadImage
                          id="identificacion"
                          titulo="Identificación"
                          imgArray={field.value || []}
                          setImg={field.onChange}
                          showWebcamOption={true}
                          facingMode="environment"
                          limit={10}
                        />
                        {fieldState.error && (
                          <span className="text-red-500 text-sm mt-1">{fieldState.error.message}</span>
                        )}
                      </div>
                    )}
                  />
                )} */}

                {tipoCon === "empleado" && (
                  <><FormField
                    control={form.control}
                    name="entrega_concesion"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Persona
                        </FormLabel>
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
                    )} />
                  </>
                )}
              </div>

              <div className=" p-5 py-2">
                      <h3 className="font-semibold text-gray-500 mb-3 text-xs uppercase">Fotografia</h3>
                      <Controller
                        control={form.control}
                        name="identificacion_entrega"
                        render={({ field, fieldState }) => (
                          <div className="flex flex-col">
                            <LoadImage
                              id="fotografia"
                              titulo="Fotografía de la persona"
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

              <div className=" p-5 py-0">
                <FormField
                control={form.control}
                name="unidades"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Unidades entregadas
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="bg-white border-gray-200"
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Number(e.target.value);
                          const max = equipoSelecionado?.cantidad_equipo_concesion ?? 0;
                          const clamped = Math.min(Math.max(val, 0), max); // 👈 entre 0 y max
                          field.onChange(clamped);
                        }}
                        min={0}
                        max={equipoSelecionado?.cantidad_equipo_concesion ?? undefined}
                        value={Number(field.value) || 0}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-400 mt-1">
                      Máximo: {equipoSelecionado?.cantidad_equipo_concesion ?? 0} unidades
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <div className="py-2">
               <FormField
                  control={form.control}
                  name="estatus"
                  defaultValue="completo"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Estado
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2 flex-wrap">
                          {["completo", "perdido", "dañado"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => field.onChange(val)}
                              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                                field.value === val
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "border border-blue-400 text-blue-600 bg-white hover:bg-blue-50"
                              }`}
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

                <div className="mt-2">
				        <FormField
                  control={form.control}
                  name="comentarios"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Comentarios
                      </FormLabel>
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
              <div className=" p-5">
                <h3 className="font-semibold text-gray-700 mb-3">Evidencia</h3>
                <Controller
                  control={form.control}
                  name="evidencia"
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col">
                      <LoadImage
                        id="fotografia"
                        titulo="Fotografía de la devolución"
                        showWebcamOption={true}
                        imgArray={field.value || []}
                        setImg={(imgs) => field.onChange(imgs)}
                        facingMode="user"
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