"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

 const formSchema = z
	.object({
	pass:z.string().optional(),
	confirmar_pass:z.string().optional(),

})

export type formatData = {
	pass:string,
	confirmar_pass:string,

}
const ResetPage = () =>{
    // const { sendResetEmailMutation, isLoading } = useSendResetEmail();
	const form = useForm<z.infer<typeof formSchema>>({
			resolver: zodResolver(formSchema),
			defaultValues: {
            pass:"",
			confirmar_pass:""
	}
	});

	const onSubmit = (data: z.infer<typeof formSchema>) => {
        console.log("Informacion para hacer submit",data)
        // sendResetEmailMutation.mutate({pass: data.pass, confirm_pass: data.confirm_pass }, 
        //     {
        //     onSuccess: () => {
        //         setOpen(false)
        //     }
        //   })
	};

return (
	<div className="p-8">
		<Form {...form}>
            <form className="space-y-8" onSubmit={(e)=>{e.stopPropagation();
					 form.handleSubmit(onSubmit)();
					 }} >
                <div className="text-xl font-bold text-center">
                    Reestablecer contraseña
                </div>
                <div className="flex flex-col items-center gap-5">
                        <FormField
                        control={form.control}
                        name="pass"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="">
                                    <span className="text-red-500">*</span> Contraseña:
                                </FormLabel>{" "}
                                <FormControl>
                                    <Input placeholder="Nueva contraseña" {...field} 
                                    />
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        

                        <FormField
                        control={form.control}
                        name="confirmar_pass"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="">
                                    <span className="text-red-500">*</span> Confirmar contraseña:
                                </FormLabel>{" "}
                                <FormControl>
                                    <Input placeholder="Confirmar contraseña" {...field} 
                                    />
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />	


                <div className="text-center">
					<Button
						className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-1/3 md:w-1/2 lg:w-1/2"
						variant="secondary"
						type="submit"
					>
						{/* {isLoading == false &&  ? ("Siguiente") : ("Cargando...")}  */}
                        Guardar
					</Button>
				</div>
                </div>
            </form>
        </Form>
	
	</div>
);
};
export default ResetPage;


