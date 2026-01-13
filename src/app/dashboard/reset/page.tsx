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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";

const formSchema = z.object({
  pass: z.string().optional(),
  confirmar_pass: z.string().optional(),
});

const ResetPage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pass: "",
      confirmar_pass: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Informacion para hacer submit", data);
  };

  return (
    <div className="flex justify-center items-start mt-24 ">
      <Card className="w-full max-w-lg p-5">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold pb-5">
            Reestablecer contraseña
          </CardTitle>
          <CardDescription>
            Por favor ingrese su nueva contraseña y después confírmela.
            Haga clic en <strong>Reestablecer contraseña</strong> cuando haya terminado.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              form.handleSubmit(onSubmit)();
            }}
          >
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="text-red-500">*</span> Contraseña
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Nueva contraseña"
                        {...field}
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
                    <FormLabel>
                      <span className="text-red-500">*</span> Confirmar contraseña
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirmar contraseña"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white w-full"
              >
                <LockKeyhole />
                Reestablecer contraseña
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPage;
