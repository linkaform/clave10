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
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { format } from 'date-fns';
import { useCatalogoAreaEmpleadoApoyo } from "@/hooks/useCatalogoAreaEmpleadoApoyo";
import DateTime from "../dateTime";
import { Loader2, MapPin, Package, Truck } from "lucide-react";
import { useCatalogoPaseAreaLocation } from "@/hooks/useCatalogoPaseAreaLocation";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import LoadImage, { Imagen } from "../upload-Image";
import { useCatalogoProveedores } from "@/hooks/useCatalogoProveedores";
import { useGetLockers } from "@/hooks/useGetLockers";
import { useBoothStore } from "@/store/useBoothStore";

interface AddFallaModalProps {
  title: string;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
}

const formSchema = z.object({
  ubicacion_paqueteria: z.string().min(2, { message: "Ubicación campo es requerido." }),
  area_paqueteria: z.string().min(2, { message: "Area es campo requerido." }),
  fotografia_paqueteria: z.array(z.object({ file_url: z.string(), file_name: z.string() })).optional(),
  descripcion_paqueteria: z.string().optional(),
  quien_recibe_paqueteria: z.string().optional(),
  guardado_en_paqueteria: z.string().optional(),
  fecha_recibido_paqueteria: z.string().optional(),
  estatus_paqueteria: z.array(z.string()).optional(),
  proveedor: z.string().optional(),
});

export const AddPaqueteriaModal: React.FC<AddFallaModalProps> = ({
  title,
  isSuccess,
  setIsSuccess,
}) => {
  const { location, area } = useBoothStore();
  const [conSelected, setConSelected] = useState<string>(area ?? "");
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(location ?? "");
  const { dataAreas: areas, dataLocations: ubicaciones, isLoadingAreas: loadingAreas, isLoadingLocations: loadingUbicaciones } = useCatalogoPaseAreaLocation(ubicacionSeleccionada, true, ubicacionSeleccionada ? true : false);
  const { data: dataAreaEmpleadoApoyo, isLoading: loadingAreaEmpleadoApoyo } = useCatalogoAreaEmpleadoApoyo(isSuccess);
  const { dataProveedores, isLoadingProveedores } = useCatalogoProveedores(isSuccess);
  const { createPaqueteriaMutation, isLoading } = usePaqueteria(ubicacionSeleccionada, area ?? "", "", false, "", "", "");
  const { data: responseGetLockers, isLoading: loadingGetLockers } = useGetLockers(ubicacionSeleccionada ?? false, "", "Disponible", isSuccess);
  const [date, setDate] = useState<Date | "">("");
  const [evidencia, setEvidencia] = useState<Imagen[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ubicacion_paqueteria: location,
      area_paqueteria: area,
      fotografia_paqueteria: [],
      descripcion_paqueteria: "",
      quien_recibe_paqueteria: "",
      guardado_en_paqueteria: "",
      fecha_recibido_paqueteria: "",
      estatus_paqueteria: ["guardado"],
      proveedor: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (isSuccess) {
      reset();
      setDate(new Date());
      setUbicacionSeleccionada(location ?? "");
      setConSelected(area ?? "");
      reset({ ubicacion_paqueteria: location, area_paqueteria: area });
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!isLoading) handleClose();
  }, [isLoading]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (date) {
      const formattedDate = format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
      const formatData = {
        ubicacion_paqueteria: ubicacionSeleccionada,
        area_paqueteria: values.area_paqueteria ?? "",
        fotografia_paqueteria: evidencia ?? [],
        descripcion_paqueteria: values.descripcion_paqueteria ?? "",
        quien_recibe_paqueteria: values.quien_recibe_paqueteria ?? "",
        guardado_en_paqueteria: values.guardado_en_paqueteria ?? "",
        fecha_recibido_paqueteria: formattedDate ?? "",
        fecha_entregado_paqueteria: "",
        entregado_a_paqueteria: "",
        estatus_paqueteria: ["guardado"],
        proveedor: values.proveedor ?? "",
      };
      createPaqueteriaMutation.mutate({ data_paquete: formatData });
    } else {
      form.setError("fecha_recibido_paqueteria", { type: "manual", message: "Fecha es un campo requerido." });
    }
  }

  const handleClose = () => setIsSuccess(false);

  return (
    <Dialog open={isSuccess} onOpenChange={setIsSuccess} modal>
      <DialogTrigger />
      <DialogContent
        className="p-0 overflow-hidden !max-w-[900px] w-[95vw] sm:w-[92vw] max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
        aria-describedby=""
        onInteractOutside={(e) => e.preventDefault()}>

        <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>

		<div className="overflow-y-auto flex-1 px-8 py-6 no-scrollbar">
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

			{/* Sección información general */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
				<MapPin className="text-blue-500 w-5 h-5" />
				<h3 className="font-semibold text-gray-700">Información general</h3>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				<FormField
					control={form.control}
					name="ubicacion_paqueteria"
					render={({ field }: any) => (
					<FormItem>
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación</FormLabel>
						<FormControl>
						<Select {...field} onValueChange={(value: string) => { field.onChange(value); setUbicacionSeleccionada(value); }} value={ubicacionSeleccionada}>
							<SelectTrigger className="w-full">
							{loadingUbicaciones ? <SelectValue placeholder="Cargando ubicaciones..." /> : <SelectValue placeholder="Selecciona una ubicación" />}
							</SelectTrigger>
							<SelectContent>
							{ubicaciones?.map((v: string, i: number) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
							</SelectContent>
						</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="area_paqueteria"
					render={({ field }: any) => (
					<FormItem>
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Área</FormLabel>
						<FormControl>
						<Select {...field} onValueChange={(value: string) => { field.onChange(value); setConSelected(value); }} value={conSelected}>
							<SelectTrigger className="w-full">
							{loadingAreas ? <SelectValue placeholder="Cargando areas..." /> : <SelectValue placeholder="Selecciona un área" />}
							</SelectTrigger>
							<SelectContent>
							{areas?.length > 0
								? areas.map((a: string, i: number) => <SelectItem key={i} value={a}>{a}</SelectItem>)
								: <SelectItem key="1" value="1" disabled>No hay opciones disponibles.</SelectItem>}
							</SelectContent>
						</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="fecha_recibido_paqueteria"
					render={() => (
					<FormItem>
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de recepción</FormLabel>
						<FormControl>
						<DateTime date={date} setDate={setDate} disablePastDates={false} />
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="quien_recibe_paqueteria"
					render={({ field }: any) => (
					<FormItem>
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destinatario</FormLabel>
						<FormControl>
						<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
							<SelectTrigger className="w-full">
							{loadingAreaEmpleadoApoyo
								? <SelectValue placeholder="Cargando..." />
								: <SelectValue placeholder={dataAreaEmpleadoApoyo?.length > 0 ? "Selecciona una opción..." : "Sin opciones"} />}
							</SelectTrigger>
							<SelectContent>
							{dataAreaEmpleadoApoyo?.length > 0
								? dataAreaEmpleadoApoyo.map((item: string, i: number) => <SelectItem key={i} value={item}>{item}</SelectItem>)
								: <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
							</SelectContent>
						</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>
				</div>
			</div>

			{/* Sección paquete */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
				<Package className="text-blue-500 w-5 h-5" />
				<h3 className="font-semibold text-gray-700">Detalles del paquete</h3>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				<FormField
					control={form.control}
					name="proveedor"
					render={({ field }: any) => (
					<FormItem>
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proveedor</FormLabel>
						<FormControl>
						<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
							<SelectTrigger className="w-full">
							{isLoadingProveedores
								? <SelectValue placeholder="Cargando..." />
								: <SelectValue placeholder={dataProveedores?.length > 0 ? "Selecciona una opción..." : "Sin opciones"} />}
							</SelectTrigger>
							<SelectContent>
							{dataProveedores?.length > 0
								? dataProveedores.map((item: string, i: number) => <SelectItem key={i} value={item}>{item}</SelectItem>)
								: <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
							</SelectContent>
						</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="guardado_en_paqueteria"
					render={({ field }: any) => (
					<FormItem>
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardado en</FormLabel>
						<FormControl>
						<Select {...field} onValueChange={(value: string) => field.onChange(value)} value={field.value}>
							<SelectTrigger className="w-full">
							{loadingGetLockers
								? <SelectValue placeholder="Cargando..." />
								: <SelectValue placeholder={responseGetLockers?.length > 0 ? "Selecciona una opción..." : "Sin opciones"} />}
							</SelectTrigger>
							<SelectContent>
							{responseGetLockers?.length > 0
								? responseGetLockers.map((item: any, i: number) => <SelectItem key={i} value={item.locker_id}>{item.locker_id}</SelectItem>)
								: <SelectItem disabled value="no opciones">No hay opciones disponibles</SelectItem>}
							</SelectContent>
						</Select>
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="descripcion_paqueteria"
					render={({ field }: any) => (
					<FormItem className="col-span-2">
						<FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</FormLabel>
						<FormControl>
						<Textarea placeholder="Escribe una descripción..." className="resize-none" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
					)}
				/>
				</div>
			</div>

			{/* Sección fotografía */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
				<Truck className="text-blue-500 w-5 h-5" />
				<h3 className="font-semibold text-gray-700">Fotografía</h3>
				</div>
				<LoadImage
				id="evidencia"
				titulo="Fotografía del paquete"
				setImg={setEvidencia}
				showWebcamOption={true}
				facingMode="environment"
				imgArray={evidencia}
				limit={10}
				/>
			</div>

			</form>
		</Form>
		</div>

        <div className="flex gap-2 px-8 py-4 border-t border-slate-100 shrink-0">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="animate-spin" /> Guardando Artículo...</>
            ) : "Guardar Artículo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};