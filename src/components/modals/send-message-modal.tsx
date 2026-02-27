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
import { useEffect, useState } from "react";
import { useEnviarMensaje } from "@/hooks/useSendSMSAndEmail";
import { MessageSquare, Smartphone, Mail, Send, AlertCircle } from "lucide-react";

interface SendMessageModalProps {
  title: string;
  children: React.ReactNode;
  data?: any;
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
  data,
}) => {
  const [open, setOpen] = useState(false);
  const { enviarMensajeMutation } = useEnviarMensaje();
  console.log(data);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      tipo: "sms",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.tipo === "sms" && !data?.telefono) {
      form.setError("tipo", {
        type: "manual",
        message: "El anfitrión no tiene número de teléfono registrado.",
      });
      return;
    }

    if (values.tipo === "email" && !data?.email) {
      form.setError("tipo", {
        type: "manual",
        message: "El anfitrión no tiene correo electrónico registrado.",
      });
      return;
    }

    const data_msj = {
      email_from: localStorage.getItem("userEmail_soter") ?? "",
      nombre: data?.nombre ?? "",
      email_to: data?.email ?? "",
      mensaje: values.message,
      phone_to: data?.telefono ?? "",
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

  const hasPhone = !!data?.telefono;
  const hasEmail = !!data?.email;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-md p-6 sm:rounded-2xl bg-white">
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                Envía una notificación al anfitrión. Por favor sé claro con tu mensaje.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-gray-700">Mensaje a enviar</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe el mensaje que recibirá el anfitrión..."
                      className="resize-none min-h-[100px] border-gray-200 focus-visible:ring-blue-500 rounded-xl"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                    <FormMessage className="text-red-500 m-0" />
                    <span className="ml-auto font-medium">{field.value?.length || 0}/100</span>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="font-semibold text-gray-700">Canal de envío</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("sms");
                          form.clearErrors("tipo");
                        }}
                        disabled={!hasPhone}
                        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${field.value === "sms"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600 shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md"
                          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                      >
                        <div className={`p-2 rounded-full ${field.value === "sms" ? "bg-blue-100/50" : "bg-gray-100"}`}>
                          <Smartphone className={`h-5 w-5 ${field.value === "sms" ? "text-blue-600" : "text-gray-500"}`} />
                        </div>
                        <span className="text-sm font-medium">Vía SMS</span>
                        {!hasPhone && (
                          <div className="absolute top-2 right-2 text-red-500" title="Sin teléfono configurado">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          field.onChange("email");
                          form.clearErrors("tipo");
                        }}
                        disabled={!hasEmail}
                        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 ${field.value === "email"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600 shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md"
                          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                      >
                        <div className={`p-2 rounded-full ${field.value === "email" ? "bg-blue-100/50" : "bg-gray-100"}`}>
                          <Mail className={`h-5 w-5 ${field.value === "email" ? "text-blue-600" : "text-gray-500"}`} />
                        </div>
                        <span className="text-sm font-medium">Vía Email</span>
                        {!hasEmail && (
                          <div className="absolute top-2 right-2 text-red-500" title="Sin correo configurado">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-sm text-red-500 mt-2" />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium rounded-xl"
                >
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium flex items-center justify-center gap-2 transition-colors rounded-xl px-6"
                disabled={enviarMensajeMutation.isPending}
              >
                {enviarMensajeMutation.isPending ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-[-4px]" />
                    Enviar mensaje
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};