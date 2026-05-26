/* eslint-disable react-hooks/exhaustive-deps */
//eslint-disable react-hooks/exhaustive-deps
import { z } from "zod";
import { Button } from "../ui/button";
import {
    Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

import {
    Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { format } from "date-fns";
import { usePaqueteria } from "@/hooks/usePaqueteria";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import DateTime from "../dateTime";

interface DevPaqModalProps {
  	title: string;
	data: any;
}

const formSchema = z.object({
    estatus_paqueteria:  z.array(z.string()).optional(),
    fecha_entregado_paqueteria: z.string().optional(),
    entregado_a_paqueteria: z.string().optional()
});


export const DevolucionPaqModal: React.FC<DevPaqModalProps> = ({
  	title,
	data
}) => {
	const [isSuccess, setIsSuccess] =useState(false)
	const { devolverPaqueteriaMutation, isLoading} = usePaqueteria("", "", "guardado",false, "", "", "")
	// const [isActiveDevolucion, setIsActiveDevolucion] = useState<string>("entregado");
	const [date, setDate] = useState<Date|"">("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			estatus_paqueteria: ["entregado"],
			fecha_entregado_paqueteria: "",
            entregado_a_paqueteria:""
		},
	});
    

	// useEffect(()=>{
	// 	if(!isLoading){
	// 		handleClose()			
	// 	}
	// },[isLoading])

	function onSubmit(values: z.infer<typeof formSchema>) {
        const formattedDate = format( new Date(date), 'yyyy-MM-dd HH:mm:ss');
        const formatData = {
            estatus_paqueteria: ["entregado"],
            fecha_entregado_paqueteria: formattedDate ??"",
            entregado_a_paqueteria: values.entregado_a_paqueteria??""
        }
        devolverPaqueteriaMutation.mutate({data_paquete_actualizar:formatData, folio:data.folio},  {
            onSuccess: () => {
                handleClose()	
            },
            onError: () => {
              handleClose()	
            }
          })
	}

	const handleClose = () => {
		setIsSuccess(false); 
	};

    const handleOpenModal = async () => {
		setIsSuccess(true);
	};

 
    return (
        <Dialog onOpenChange={setIsSuccess} open={isSuccess}>
          <div className="cursor-pointer" title="Entregar Paquete" onClick={handleOpenModal}>
            <ArrowRightLeft className="w-5 h-5" />
          </div>
      
          <DialogContent
            className="p-0 overflow-hidden !max-w-[500px] w-[95vw] rounded-3xl shadow-2xl flex flex-col border-none bg-background"
            aria-describedby="">
      
            <DialogHeader className="px-8 pt-8 pb-4 shrink-0 border-b border-slate-100">
              <DialogTitle className="text-2xl text-center font-bold text-gray-800">
                {title}
              </DialogTitle>
              <p className="text-center text-sm text-gray-400">
                Registra la entrega del paquete
              </p>
            </DialogHeader>
      
            <div className="overflow-y-auto flex-1 px-8  no-scrollbar">
              <div className="flex gap-2 mb-6">
                <p className="text-sm font-semibold text-gray-500">Folio:</p>
                <p className="text-sm font-bold text-blue-500">{data?.folio}</p>
              </div>
      
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5">
                  <FormField control={form.control} name="entregado_a_paqueteria"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entregado a</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de quien recibe..." {...field}
                            onChange={(e) => field.onChange(e)}
                            value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
      
                  <FormField control={form.control} name="fecha_entregado_paqueteria"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha de entrega</FormLabel>
                        <FormControl>
                          <DateTime date={date} setDate={setDate} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
      
            <div className="flex gap-2 px-8 py-4 border-t border-slate-100 shrink-0">
              <DialogClose asChild>
                <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleClose}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
                {isLoading ? <><Loader2 className="animate-spin" /> Entregando artículo...</> : "Entregar artículo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    };

    