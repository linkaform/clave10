import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSearchPass } from "@/hooks/useSearchPass";
import { useEffect, useState } from "react";
import { useEnviarMensaje } from "@/hooks/useSendSMSAndEmail";

interface SendMessageModalProps {
  title: string;
  children: React.ReactNode;
}

const formSchema = z.object({
  message: z.string().min(2, {
    message: "Campo requerido",
  }).max(100, { message: "Máximo 100 caracteres" }),
  tipo: z.string().optional(),
});

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  title,
  children,
}) => {
  const { searchPass } = useSearchPass(false);
  const [open, setOpen] = useState(false);
  const { enviarMensajeMutation } = useEnviarMensaje();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      tipo: "sms",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.tipo === "sms" && !searchPass?.visita_a?.[0]?.telefono) {
      form.setError("tipo", {
        type: "manual",
        message: "No tiene configurado SMS (sin teléfono)",
      });
      return;
    }

    if (values.tipo === "email" && !searchPass?.visita_a?.[0]?.email) {
      form.setError("tipo", {
        type: "manual",
        message: "No tiene configurado Email",
      });
      return;
    }

    const data_msj = {
      email_from: localStorage.getItem("userEmail_soter") ?? "",
      nombre: searchPass?.nombre ?? "",
      email_to: searchPass?.visita_a?.[0]?.email ?? "",
      mensaje: values.message,
      phone_to: searchPass?.visita_a?.[0]?.telefono ?? "",
      tipo: values.tipo,
    };

    if (setOpen) setOpen(false);

    enviarMensajeMutation.mutate(data_msj, {
      onSuccess: () => {
        form.reset();
      },
    });
  }
  useEffect(() => {
    if (open) {
      form.reset({
        message: "",
        tipo: "sms",
      });
    }
  }, [form, open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
          <DialogDescription>
            {"Se enviara una notificacion por correo y SMS a quien es visitado, se claro con tu mensaje."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>* Mensaje</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe el mensaje que recibira el anfitrion"
                      className="resize-none"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              defaultValue="sms"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Tipo de mensaje:</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("sms");
                          form.clearErrors("tipo");
                        }}
                        disabled={!searchPass?.visita_a?.[0]?.telefono}
                        className={`px-6 py-2 rounded ${
                          field.value === "sms"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-blue-600 border border-blue-500"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("email");
                          form.clearErrors("tipo");
                        }}
                        disabled={!searchPass?.visita_a?.[0]?.email}
                        className={`px-6 py-2 rounded ${
                          field.value === "email"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-blue-600 border border-blue-500"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Email
                      </button>
                    </div>
                  </FormControl>
                  {!searchPass?.visita_a?.[0]?.telefono && (
                    <p className="text-red-500 text-sm mt-1">
                      No tiene configurado SMS (sin teléfono)
                    </p>
                  )}
                  {!searchPass?.visita_a?.[0]?.email && (
                    <p className="text-red-500 text-sm mt-1">
                      No tiene configurado Email
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="flex gap-5">
              <DialogClose asChild>
                <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Enviar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};