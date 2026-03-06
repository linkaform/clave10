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

import LoadImage from "../upload-Image";
import { EquipoConcesionado } from "../concesionados-tab-datos";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useDevolucionEquipo } from "@/hooks/Concesionados/useDevolverConcesionado";

interface NuevaDevolucionModalProps {
  title: string;
  children: React.ReactNode;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  equipoSelecionado: EquipoConcesionado|null;
  dataConcesion:any
  dataDevolucion:any
}

const formSchema = z.object({
  estatus: z.string().min(1, { message: "Este campo es obligatorio" }),
  unidades: z.coerce.number().min(0).optional(),
  comentarios: z.string().optional(),
  evidencia: z.array(z.any()).optional(),
});

export const NuevaDevolucionMiniEquipoModal: React.FC<NuevaDevolucionModalProps> = ({
  title,
  children,
  isSuccess,
  setIsSuccess,
  equipoSelecionado,
  dataConcesion,
  dataDevolucion
}) => {
	const { devolverEquipoMutation, isLoading } = useDevolucionEquipo();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      estatus: "",
      unidades: 0,
      comentarios: "",
      evidencia: [],
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      reset({
        estatus: "",
        unidades: 0,
        evidencia: [],
        comentarios: "",
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
	  case "danado": 
		return "damage";
	  default:
		return null; 
	}
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
        devolverEquipoMutation.mutate({
          record_id: dataConcesion?._id ?? "",
          status: equipoSelecionado!==null? 'parical':"total",
          entregado_por: dataDevolucion.entrega_tipo as "empleado" | "otro",
          quien_entrega: dataDevolucion.entrega_tipo === "empleado"
          ? dataDevolucion.entrega_concesion ?? ""
          : dataDevolucion.entrega_concesion_otro ?? "",
          quien_entrega_company: "Demo",
          identificacion_entrega: dataDevolucion.identificacion_entrega ? dataDevolucion.identificacion_entrega[0]: [],
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
//   const tipoCon = form.watch("entrega_tipo");

const datosFaltantes =false
// const datosFaltantes =
//   !dataConcesion?.entrega_tipo ||
//   (!dataConcesion?.quien_entrega) ||
//   (!dataConcesion?.identificacion_entrega?.length);
  
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
            {equipoSelecionado ? title:"Devolución Total"}
          </DialogTitle>
          <p className="text-center text-sm text-gray-400">Registra la devolución del equipo</p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6  ">
        {datosFaltantes ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Faltan datos por rellenar</p>
              <p className="text-sm text-gray-400 max-w-xs">
                Regresa al modal anterior y completa la información de entrega antes de continuar.
              </p>
            </div>

            <div className="flex flex-col gap-1 w-full max-w-xs">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                dataConcesion?.entrega_tipo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"
              }`}>
                {dataConcesion?.entrega_tipo
                  ? <CheckCircle className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />}
                Tipo de entrega
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                dataConcesion?.quien_entrega ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"
              }`}>
                {dataConcesion?.quien_entrega
                  ? <CheckCircle className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />}
                Persona que entrega
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                dataConcesion?.identificacion_entrega?.length ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"
              }`}>
                {dataConcesion?.identificacion_entrega?.length
                  ? <CheckCircle className="w-4 h-4" />
                  : <XCircle className="w-4 h-4" />}
                Fotografía de la persona
              </div>
            </div>

            <DialogClose asChild>
              <Button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white gap-2">
                <ArrowLeft className="w-4 h-4" /> Regresar y completar
              </Button>
            </DialogClose>
          </div>

        ) : (

          <Form {...form}>
            <form >
              <div className=" py-2">
                    {equipoSelecionado!==null &&
                    <div className=" py-0">
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
                              min={0}
                              max={equipoSelecionado?.cantidad_equipo_pendiente}
                              defaultValue={0}
                              onChange={(e) => {
                                const pendientes = Number(equipoSelecionado?.cantidad_equipo_pendiente ?? 0);
                                const val = Number(e.target.value);
                                if (val > pendientes) {
                                  e.target.value = "0";
                                  field.onChange(0);
                                } else {
                                  field.onChange(val);
                                }
                              }}
                              onBlur={(e) => {
                                console.log("PENDIENTE ",equipoSelecionado?.cantidad_equipo_pendiente )
                                const pendientes = Number(equipoSelecionado?.cantidad_equipo_pendiente ?? 0);
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                const clamped = Math.min(Math.max(val, 0), pendientes);
                                field.onChange(clamped);
                              }}
                            />
                            </FormControl>
                            <p className="text-xs text-gray-400 mt-1">
                              {Number(equipoSelecionado?.cantidad_equipo_devuelto ?? 0)} de {equipoSelecionado?.cantidad_equipo_concesion ?? 0} devueltos — Pendientes: {Number(equipoSelecionado?.cantidad_equipo_pendiente ?? 0)}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>}

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
                    <div className=" mt-3">
                    <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Evidencia de la devolución
                            </FormLabel>
                        <Controller
                        control={form.control}
                        name="evidencia"
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col">
                            <LoadImage
                                id="fotografia"
                                titulo="Cargar evidencia..."
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
              </div>
            </form>
          </Form>
  )}
        </div>

        <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex gap-3">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogClose>
		  <Button
			onClick={form.handleSubmit(onSubmit)}
			disabled={isLoading || datosFaltantes}
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