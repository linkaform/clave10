/* eslint-disable @typescript-eslint/no-unused-vars */
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Multiselect from 'multiselect-react-dropdown';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

import LoadImage, { Imagen } from "../upload-Image";
import { useUpdateAccessPass } from "@/hooks/useUpdatePass";
import { EqipmentLocalPassModal } from "./add-local-equipo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import useAuthStore from "@/store/useAuthStore";
import { Car, Laptop, Loader2 } from "lucide-react";
import { VehicleLocalPassModal } from "./add-local-vehicule";
import { toast } from "sonner";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { uniqueArray } from "@/lib/utils";
import { useSearchPass } from "@/hooks/useSearchPass";
import { AccessPass } from "@/lib/access";

interface Props {
  title: string;
  children: React.ReactNode;
  id:string;
  dataCatalogos:any;
}
const formSchema = z.object({
    visita_a: z.array(z.any()).optional(),
    foto: z.array(
        z.object({
            file_url: z.string(),
            file_name: z.string(),
        })
        ).optional(),
    identificacion:  z.array(
        z.object({
            file_url: z.string(),
            file_name: z.string(),
        })
        ).optional(),
    area: z.string().optional(),
    status_pase: z.string().optional(),
});

export const UpdatePassModal: React.FC<Props> = ({ title, children, id , dataCatalogos}) => {
    const { userIdSoter} = useAuthStore()
    const [openModal, setOpenModal] = useState(false);
    const [fotografia, setFotografia] = useState<Imagen[]>([]);
    const [identificacion, setIdentificacion] = useState<Imagen[]>([]);
    const { updatePassMutation ,isLoadingUpdate} = useUpdateAccessPass();
    console.log("dataCatalogos",dataCatalogos)
	const [agregarEquiposActive, setAgregarEquiposActive] = useState(false);
	const [agregarVehiculosActive, setAgregarVehiculosActive] = useState(false);

    const [showIneIden] = useState("iden-foto")
    const [equipos, setEquipos] = useState<Equipo[]>([])
    const [vehicles, setVehicles] = useState<Vehiculo[]>([])

    const [errorFotografia, setErrorFotografia] = useState("")
	const [errorIdentificacion, setErrorIdentificacion] = useState("")

    const { assets,assetsLoading} = useSearchPass(true);
	const assetsUnique= uniqueArray(assets?.Visita_a)
	assetsUnique.unshift("Usuario Actual");
    
	const visitaAFormatted = (assetsUnique || [])
	.filter((u: any) => u !== null && u !== undefined)
	.map((u: any) => ({ id: u, name: u }));

    const visitaDataFormateada = (dataCatalogos?.visita_a || []).map((item: any) => ({
        id: item.nombre,
        name: item.nombre
      }));
      
    
	const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>(visitaDataFormateada.length>0 ? visitaDataFormateada : [{id:"Usuario Actual",name:"Usuario Actual"}]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        foto: [],
        identificacion: [],
        area: "",
        status_pase:"activo",
        visita_a:[]
        },
    });

    useEffect(()=>{
        setErrorFotografia("")
        setErrorIdentificacion("")
      },[])

    const handleCheckboxChange = (name:string) => {
        if (name === "agregar-equipos") {
                setAgregarEquiposActive(!agregarEquiposActive);
        } else if (name === "agregar-vehiculos") {
                setAgregarVehiculosActive(!agregarVehiculosActive);
        }
        };

    function onSubmit(data: z.infer<typeof formSchema>) {
        const access_pass:any = {};

        if (vehicles?.length > 0) {
            access_pass.grupo_vehiculos = vehicles;
        }
    
        if (equipos?.length > 0) {
            access_pass.grupo_equipos = equipos;
        }
    
        if (fotografia?.length > 0) {
            access_pass.walkin_fotografia = fotografia;
        }
    
        if (identificacion?.length > 0) {
            access_pass.walkin_identificacion = identificacion;
        }

        const originalIds = visitaDataFormateada
        .map((v: { id: any }) => v.id)
        .sort();
      
        const currentIds = visitaASeleccionadas
            .map((v: any) => v.id)
            .sort();
        
        const isSame =
            JSON.stringify(originalIds) === JSON.stringify(currentIds);
        
        if (!isSame) {
            access_pass.visita_a = currentIds;
        }
        
            
        const originalFotos = dataCatalogos?.walkin_fotografia || [];
        const originalIdentificacion = dataCatalogos?.walkin_identificacion || [];
        let hasError=false;
        if (showIneIden?.includes("foto")) {
            const originalEstaVacio = !originalFotos || originalFotos.length === 0;
        
            if (originalEstaVacio && fotografia.length === 0) {
                setErrorFotografia("Este campo es requerido.");
                hasError = true;
            } else {
                setErrorFotografia("");
            }
        }
        
        if (showIneIden?.includes("iden")) {
            const originalEstaVacio = !originalIdentificacion || originalIdentificacion.length === 0;
        
            if (originalEstaVacio && identificacion.length === 0) {
                setErrorIdentificacion("Este campo es requerido.");
                hasError = true;
            } else {
                setErrorIdentificacion("");
            }
        }

        if (Object.keys(access_pass).length === 0) {
            toast.warning("No se modificaron datos", {
                style: {
                    background: "#FEF3C7", 
                    color: "#92400E"
                }
            });
        
            setOpenModal(false);
            return;
        }
        
        updatePassMutation.mutate({access_pass, id:dataCatalogos._id, account_id:userIdSoter},{
            onSuccess: () => {
                setOpenModal(false);
            }
        })
    }

    const handleRemove = (index: number) => {
        setVehicles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleRemoveEq = (index: number) => {
        setEquipos((prev) => prev.filter((_, i) => i !== index))
    }


    return (
        <Dialog open={openModal} onOpenChange={setOpenModal} modal>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
            <DialogHeader>
            <DialogTitle className="text-2xl	 text-center  font-bold my-5">
                {title}
            </DialogTitle>
            </DialogHeader>

            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <>
                <div className="flex flex-col flex-wrap space-y-5 max-w-5xl mx-auto">
                    <div className="flex flex-col space-y-5">
                        
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="w-full flex gap-2">
                            <p className="font-bold whitespace-nowrap">Nombre:</p>
                            <p>{dataCatalogos?.nombre}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="w-full flex gap-2">
                            <p className="font-bold whitespace-nowrap">Email:</p>
                            <p className="w-full break-words">{dataCatalogos?.email}</p>
                            </div>

                            <div className="w-full flex gap-2">
                            <p className="font-bold whitespace-nowrap">Teléfono:</p>
                            <p className="text-sm">{dataCatalogos?.telefono}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                            <FormField
                                control={form.control}
                                name="visita_a"
                                render={() => (
                                    <FormItem>
                                    <FormLabel>
                                        <span className="font-bold
                                        ">Visita a:</span>
                                    </FormLabel>

                                    <Multiselect
                                        options={visitaAFormatted ?? []}
                                        selectedValues={visitaASeleccionadas}
                                        onSelect={setVisitaASeleccionadas}
                                        onRemove={setVisitaASeleccionadas}
                                        displayValue="name"
                                    />

                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                        </div>

                        <div className="w-full flex gap-2">
						<p className="font-bold whitespace-nowrap">Ubicación:</p>
						<div className="relative group w-full break-words">
							{dataCatalogos?.ubicacion[0]}
							{dataCatalogos?.ubicacion.length > 1 && (
							<span className="text-blue-600 cursor-pointer ml-1 underline relative">
								+{dataCatalogos?.ubicacion.length - 1}
								{/* Tooltip container */}
								<div className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded bg-gray-800 px-2 py-1 text-sm text-white shadow-lg group-hover:block">
								{Array.isArray(dataCatalogos?.ubicacion) && dataCatalogos?.ubicacion.length > 1 && (
									dataCatalogos?.ubicacion.slice(1).map((ubic:string, idx:number) => (
										<div key={idx}>{ubic}</div>
									))
									)}
								</div>
							</span>
							)}
						</div>
						</div>

                        <div className="flex justify-between gap-3">
                        {showIneIden?.includes("foto") &&
                            <div className="w-full md:w-1/2 pr-2">
                                <LoadImage
                                    id="fotografia"
                                    titulo={"Fotografía"}
                                    setImg={setFotografia}
                                    showWebcamOption={true}
                                    facingMode="user" 
                                    imgArray={fotografia} 
                                    showArray={true} 
                                    limit={1}
                                />
                                {errorFotografia !== "" && <span className="text-red-500 text-sm">{errorFotografia}</span>}
                            </div>
                        }

                        {showIneIden?.includes("iden") && 
                            <div className="w-full md:w-1/2">
                                <LoadImage
                                    id="identificacion"
                                    titulo={"Identificación"}
                                    setImg={setIdentificacion}
                                    showWebcamOption={true}
                                    facingMode="environment" 
                                    imgArray={identificacion} 
                                    showArray={true} 
                                    limit={1}
                                />
                                {errorIdentificacion !== "" && <span className="text-red-500 text-sm">{errorIdentificacion}</span>}
                            </div>
                        }
                        </div> 
                        <div className="flex flex-col gap-y-6">
                            <div>
                                <div className="flex items-center gap-x-10">
                                <span className="font-bold text-xl">Lista de Vehículos</span>
                                <VehicleLocalPassModal title="Nuevo Vehiculo" vehicles={vehicles} setVehiculos={setVehicles} isAccesos={false} fetch={false}>
                                    <button
                                    type="button"
                                    onClick={() => handleCheckboxChange("agregar-vehiculos")}
                                    className="px-4 py-2 rounded-md transition-all duration-300 border-2 border-blue-400 bg-transparent hover:bg-slate-100"
                                    >
                                    <div className="flex items-center gap-2">
                                        <div className="text-blue-600 sm:hidden text-xl font-bold">+</div>
                                        <Car className="text-blue-600" />
                                        <div className="text-blue-600 hidden sm:block">Agregar Vehículos</div>
                                    </div>
                                    </button>
                                </VehicleLocalPassModal>
                                </div>
                                <div className="mt-2 text-gray-600">
                                    
                                <Accordion type="multiple" className="w-full">
                                    {vehicles.map((vehiculo, index) => (
                                        <AccordionItem key={index} value={`vehiculo-${index}`}>
                                        <AccordionTrigger>
                                            {vehiculo.tipo}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm">
                                            <p><strong>Tipo:</strong> {vehiculo.tipo}</p>
                                            <p><strong>Marca:</strong> {vehiculo.marca}</p>
                                            <p><strong>Modelo:</strong> {vehiculo.modelo}</p>
                                            <p><strong>Placas:</strong> {vehiculo.placas}</p>
                                            <p><strong>Estado:</strong> {vehiculo.estado}</p>
                                            <p><strong>Color:</strong> {vehiculo.color}</p>
                                            </div>
                                
                                            <div className="flex justify-end px-4 pb-4">
                                            <Button variant="destructive" size="sm" onClick={() => handleRemove(index)}>
                                                Eliminar
                                            </Button>
                                            </div>
                                        </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                    {vehicles.length==0?(
                                    <div>No se han agregado vehiculos.</div>):null}
                                </Accordion>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-x-10">
                                <span className="font-bold text-xl">Lista de Equipos</span>
                                <EqipmentLocalPassModal title="Nuevo Equipo" equipos={equipos} setEquipos={setEquipos} isAccesos={false}>
                                    <button
                                    type="button"
                                    onClick={() => handleCheckboxChange("agregar-equipos")}
                                    className="px-4 py-2 rounded-md transition-all duration-300 border-2 border-blue-400 bg-transparent hover:bg-slate-100"
                                    >
                                    <div className="flex items-center gap-2">
                                        <div className="text-blue-600 sm:hidden text-xl font-bold">+</div>
                                        <Laptop className="text-blue-600" />
                                        <div className="text-blue-600 hidden sm:block">Agregar Equipos</div>
                                    </div>
                                    </button>
                                </EqipmentLocalPassModal>
                                </div>
                                <div className="mt-2 text-gray-600">
                                <Accordion type="multiple" className="w-full">
                                    {equipos.map((equipo, index) => (
                                        <AccordionItem key={index} value={`equipo-${index}`}>
                                        <AccordionTrigger>
                                            {equipo.tipo}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm">
                                            <p><strong>Tipo:</strong> {equipo.tipo}</p>
                                            <p><strong>Nombre:</strong> {equipo.nombre}</p>
                                            <p><strong>Marca:</strong> {equipo.marca}</p>
                                            <p><strong>Modelo:</strong> {equipo.modelo}</p>
                                            <p><strong>No. Serie:</strong> {equipo.serie}</p>
                                            <p><strong>Color:</strong> {equipo.color}</p>
                                            </div>
                                
                                            <div className="flex justify-end px-4 pb-4">
                                            <Button variant="destructive" size="sm" onClick={() => handleRemoveEq(index)}>
                                                Eliminar
                                            </Button>
                                            </div>
                                        </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                    {equipos.length==0?(
                                    <div>No se han agregado equipos.</div>):null}
                                </Accordion>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </>

                <p className="text-gray-400">**Campos requeridos </p>
                <div className="flex gap-5">
                <DialogClose asChild>
                    <Button
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    onClick={() => form.reset()}
                    >
                    Cancelar
                    </Button>
                </DialogClose>

                <Button
                    type="submit"
                    disabled={isLoadingUpdate}
                    className="w-full  bg-blue-500 hover:bg-blue-600 text-white "
                >
                   {isLoadingUpdate?<> <Loader2 className="animate-spin"/> {"Actualizando pase..."} </>: "Actualizar pase"} 
                </Button>
                </div>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
    );
};
	
    
  