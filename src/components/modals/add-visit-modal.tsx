"use client";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useSearchPass } from "@/hooks/useSearchPass";
import LoadImage, { Imagen } from "../upload-Image";
import { useBoothStore } from "@/store/useBoothStore";
import { getRequerimientos, uniqueArray } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { registerIncoming } from "@/lib/access";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  title: string;
  children: React.ReactNode;
  isSuccess: boolean;
  setIsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
}

const createSchema = (requireFoto: boolean, requireIden: boolean) =>
  z
    .object({
      nombre: z.string().min(2, { message: "Campo requerido" }),
      empresa: z.string().min(2, { message: "Campo requerido" }),
      foto: z
        .array(
          z.object({
            file_url: z.string().optional(),
            file_name: z.string().optional(),
          }),
        )
        .default([]),
      identificacion: z
        .array(
          z.object({
            file_url: z.string().optional(),
            file_name: z.string().optional(),
          }),
        )
        .default([]),
      area: z.string().optional(),
      visita_a: z.string().min(1, { message: "Campo requerido" }),
      perfil_pase: z.string().min(1, { message: "Campo requerido" }),
      status_pase: z.string().optional(),
      tipo_visita_pase: z.enum(["fecha_fija", "rango_de_fechas"]).optional(),
      fechaFija: z.string().optional(),
      fecha_desde_visita: z.string().optional(),
      fecha_desde_hasta: z.string().optional(),
      config_dia_de_acceso: z
        .enum(["cualquier_día", "limitar_días_de_acceso"])
        .optional(),
      config_dias_acceso: z.array(z.string()).optional(),
      config_limitar_acceso: z.number().optional(),
    })
    .superRefine((data, ctx) => {
      if (requireFoto && (!data.foto || data.foto.length === 0)) {
        ctx.addIssue({
          path: ["foto"],
          message: "La fotografía es obligatoria",
          code: z.ZodIssueCode.custom,
        });
      }
      if (
        requireIden &&
        (!data.identificacion || data.identificacion.length === 0)
      ) {
        ctx.addIssue({
          path: ["identificacion"],
          message: "La identificación es obligatoria",
          code: z.ZodIssueCode.custom,
        });
      }
    });

type formatData = z.infer<ReturnType<typeof createSchema>>;

export const AddVisitModal: React.FC<Props> = ({
  title,
  children,
  isSuccess: openModal,
  setIsSuccess: setOpenModal,
}) => {
  const [fotografia, setFotografia] = useState<Imagen[]>([]);
  const [identificacion, setIdentificacion] = useState<Imagen[]>([]);
  const [fotoError, setFotoError] = useState(false);
  const [idError, setIdError] = useState(false);
  const { assets, registerNewVisit, loading } = useSearchPass(openModal);
  const { area, location } = useBoothStore();
  const queryClient = useQueryClient();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [registrandoIngreso, setRegistrandoIngreso] = useState(false);
  const assetsUnique = uniqueArray(assets?.Visita_a);

  const requerimientos = getRequerimientos(location ?? "");
  const requireFoto = requerimientos.includes("fotografia");
  const requireIden = requerimientos.includes("identificacion");

  const formSchema = useMemo(
    () => createSchema(requireFoto, requireIden),
    [requireFoto, requireIden],
  );

  const [isActiveAdvanced, setIsActiveAdvanced] = useState(false);
  const [tipoVisita, setTipoVisita] = useState<
    "fecha_fija" | "rango_de_fechas"
  >("rango_de_fechas");
  const [isActiveFechaFija, setIsActiveFechaFija] = useState(false);
  const [isActiveRangoFecha, setIsActiveRangoFecha] = useState(true);
  const [isActivelimitarDias, setIsActiveLimitarDias] = useState(true);
  const [isActiveCualquierDia, setIsActiveCualquierDia] = useState(true);
  const [isActivelimitarDiasSemana, setIsActiveLimitarDiasSemana] =
    useState(false);
  const [config_dia_de_acceso, set_config_dia_de_acceso] =
    useState("cualquier_día");
  const [config_dias_acceso, set_config_dias_acceso] = useState<string[]>([]);
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<formatData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      empresa: "",
      foto: [],
      identificacion: [],
      area: "",
      visita_a: "",
      perfil_pase: "",
      status_pase: "activo",
      tipo_visita_pase: "rango_de_fechas",
      fechaFija: "",
      fecha_desde_visita: today,
      fecha_desde_hasta: "",
      config_dia_de_acceso: "cualquier_día",
      config_dias_acceso: [],
      config_limitar_acceso: 1,
    },
  });

  // Se ejecuta tanto al abrir como al cerrar el modal, para que nunca quede
  // información de una visita anterior visible en la siguiente apertura.
  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    form.reset({
      nombre: "",
      empresa: "",
      foto: [],
      identificacion: [],
      area: "",
      visita_a: "",
      perfil_pase: "",
      status_pase: "activo",
      tipo_visita_pase: "rango_de_fechas",
      fechaFija: "",
      fecha_desde_visita: hoy,
      fecha_desde_hasta: "",
      config_dia_de_acceso: "cualquier_día",
      config_dias_acceso: [],
      config_limitar_acceso: 1,
    });
    setFotografia([]);
    setIdentificacion([]);
    setFormSubmitted(false);
    setFotoError(false);
    setIdError(false);
    setIsActiveAdvanced(false);
    setTipoVisita("rango_de_fechas");
    setIsActiveFechaFija(false);
    setIsActiveRangoFecha(true);
    setIsActiveLimitarDias(true);
    setIsActiveCualquierDia(true);
    setIsActiveLimitarDiasSemana(false);
    set_config_dia_de_acceso("cualquier_día");
    set_config_dias_acceso([]);
    setFechaDesde("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModal]);

  useEffect(() => {
    form.setValue("foto", fotografia);
    if (!requireFoto || fotografia.length > 0) {
      setFotoError(false);
    } else {
      setFotoError(true);
    }
    form.setValue("identificacion", identificacion);
    if (!requireIden || identificacion.length > 0) {
      setIdError(false);
    } else {
      setIdError(true);
    }
  }, [
    formSubmitted,
    fotografia,
    identificacion,
    requireFoto,
    requireIden,
    form,
  ]);

  async function onSubmit(data: formatData) {
    const access_pass = {
      nombre: data.nombre,
      empresa: data.empresa,
      created_from: "nueva_visita",
      visita_a: data.visita_a,
      perfil_pase: data.perfil_pase,
      foto: fotografia,
      identificacion: identificacion,
      status_pase: "activo",
      ubicaciones: [location ?? ""],
      tipo_visita_pase: tipoVisita,
      fechaFija: tipoVisita === "fecha_fija" ? (data.fechaFija ?? "") : "",
      fecha_desde_visita:
        tipoVisita === "rango_de_fechas" ? (data.fecha_desde_visita ?? "") : "",
      fecha_desde_hasta:
        tipoVisita === "rango_de_fechas" ? (data.fecha_desde_hasta ?? "") : "",
      config_dia_de_acceso: config_dia_de_acceso,
      config_dias_acceso: config_dias_acceso,
      config_limitar_acceso: isActivelimitarDias
        ? Number(data.config_limitar_acceso) || 0
        : 0,
    };
    console.log("Datos del formulario:", data);

    let valid = true;

    if (requireFoto && fotografia.length === 0) {
      setFotoError(true);
      valid = false;
    }

    if (requireIden && identificacion.length === 0) {
      setIdError(true);
      valid = false;
    }

    if (!valid) return;

    // Solo desde este modal: al crear la visita se registra el ingreso de
    // inmediato, sin pasar por el flujo normal de escaneo. Se usa
    // mutateAsync + await (no mutate + onSuccess) porque el callback del
    // segundo argumento de mutate() solo corre si el observer de la
    // mutación sigue teniendo listeners activos en el momento exacto en que
    // resuelve — una condición interna de react-query que puede fallar por
    // timing y hacía que este paso nunca se ejecutara.
    let response: any;
    try {
      response = await registerNewVisit.mutateAsync({
        location: location ?? "",
        access_pass,
      });
    } catch (err: any) {
      toast.error(
        `Hubo un error al crear la visita: ${err?.message || err}`,
      );
      return;
    }

    const id = response?.response?.data?.json?.id;
    if (!id) {
      toast.error(
        "La visita se creó, pero no se recibió el id del pase para registrar el ingreso",
      );
      return;
    }

    setRegistrandoIngreso(true);
    try {
      const ingresoResult = await registerIncoming({
        area: area ?? "",
        location: location ?? "",
        qr_code: id,
        // El backend espera objetos con "nombre" (usa c.get('nombre') en
        // script_turnos.py), no strings sueltos.
        visita_a: [{ nombre: data.visita_a }],
        selected_pases: [],
      });

      if (!ingresoResult.success) {
        toast.error(
          ingresoResult.error?.exception?.msg?.[0] ||
            "La visita se creó, pero hubo un error al registrar el ingreso",
        );
        return;
      }

      toast.success("Visita creada e ingreso registrado", {
        style: { background: "#22c55e", color: "white" },
      });
      queryClient.invalidateQueries({ queryKey: ["serchPass"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });
      setOpenModal(false);
    } catch (err: any) {
      toast.error(
        `La visita se creó, pero hubo un error al registrar el ingreso: ${err?.message || err}`,
      );
    } finally {
      setRegistrandoIngreso(false);
    }
  }

  const handleToggleTipoVisitaPase = (
    tipo: "fecha_fija" | "rango_de_fechas",
  ) => {
    if (tipo === "fecha_fija") {
      form.setValue("fecha_desde_hasta", "");
      form.setValue("fecha_desde_visita", "");
      setIsActiveFechaFija(true);
      setIsActiveRangoFecha(false);
    } else {
      form.setValue("fechaFija", "");
      setIsActiveFechaFija(false);
      setIsActiveRangoFecha(true);
    }
    form.setValue("tipo_visita_pase", tipo);
    setTipoVisita(tipo);
  };

  const handleToggleDiasAcceso = (tipo: string) => {
    if (tipo === "cualquier_día") {
      setIsActiveCualquierDia(true);
      setIsActiveLimitarDiasSemana(false);
    } else {
      setIsActiveCualquierDia(false);
      setIsActiveLimitarDiasSemana(true);
    }
    form.setValue("config_dia_de_acceso", tipo as any);
    set_config_dia_de_acceso(tipo);
  };

  const toggleDia = (dia: string) => {
    set_config_dias_acceso((prev) => {
      const updated = prev.includes(dia)
        ? prev.filter((d) => d !== dia)
        : [...prev, dia];
      form.setValue("config_dias_acceso", updated);
      return updated;
    });
  };

  const handleFechaDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFechaDesde(e.target.value);
    form.setValue("fecha_desde_hasta", "");
  };

  function getNextDay(date: string | number | Date) {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + 1);
    return currentDate.toISOString().split("T")[0];
  }

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden mx-3"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-4">
        <Form {...form}>
          <form id="add-visit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {requireIden && (
              <>
                <LoadImage
                  id="identificacion"
                  titulo={"Identificación"}
                  setImg={setIdentificacion}
                  showWebcamOption={true}
                  facingMode="environment"
                  imgArray={identificacion}
                  limit={10}
                  tipoOcr="id"
                  onOcrResult={(result) => { 
                    if (result.data && result?.data.length>0) {
                      form.setValue("nombre", `${result.data[0]?.nombre_completo}`);
                    }
                  }}
                />
                {idError && (
                  <div className="text-red-500 text-sm">
                    La identificación es obligatoria
                  </div>
                )}
              </>
            )}
            {requireFoto && (
              <>
                <LoadImage
                  id="fotografia"
                  titulo={"Fotografía"}
                  setImg={setFotografia}
                  showWebcamOption={true}
                  facingMode="environment"
                  imgArray={fotografia}
                  limit={10}
                />
                {fotoError && (
                  <div className="text-red-500 text-sm">
                    La fotografía es obligatoria
                  </div>
                )}
              </>
            )}
           

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>* Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Texto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="empresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>* Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Texto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visita_a"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>* Visita a</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetsUnique?.map((item: string) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="perfil_pase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>* Tipo de Visita</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets?.Perfiles?.map((item: string) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              onClick={() => setIsActiveAdvanced((prev) => !prev)}
              className={`w-1/2 px-4 py-2 rounded-md transition-all duration-300 ${
                isActiveAdvanced
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-2 border-blue-400 bg-transparent text-blue-600 hover:bg-blue-200"
              }`}>
              {isActiveAdvanced
                ? "Opciones avanzadas"
                : "Ver opciones avanzadas"}
            </Button>

            {isActiveAdvanced && (
              <div className="space-y-6 p-4 border border-blue-100 rounded-md bg-blue-50">
                <div className="flex items-center flex-wrap gap-3">
                  <FormLabel>Vigencia:</FormLabel>
                  <Button
                    type="button"
                    onClick={() =>
                      handleToggleTipoVisitaPase("rango_de_fechas")
                    }
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      isActiveRangoFecha
                        ? "bg-blue-600 text-white"
                        : "border-2 border-blue-400 bg-transparent text-blue-600"
                    } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}>
                    Vigencia
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleToggleTipoVisitaPase("fecha_fija")}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      isActiveFechaFija
                        ? "bg-blue-600 text-white"
                        : "border-2 border-blue-400 bg-transparent text-blue-600"
                    } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}>
                    Fecha Fija
                  </Button>
                  {tipoVisita === "rango_de_fechas" && (
                    <Button
                      type="button"
                      onClick={() => setIsActiveLimitarDias((prev) => !prev)}
                      className={`px-4 py-2 rounded-md transition-all duration-300 ${
                        isActivelimitarDias
                          ? "bg-blue-600 text-white"
                          : "border-2 border-blue-400 bg-transparent text-blue-600"
                      } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}>
                      Limitar Accesos
                    </Button>
                  )}
                </div>

                {tipoVisita === "fecha_fija" && (
                  <Controller
                    control={form.control}
                    name="fechaFija"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="text-red-500">*</span> Fecha y Hora
                          de Visita:
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {tipoVisita === "rango_de_fechas" && (
                  <div className="grid grid-cols-1 gap-4">
                    <Controller
                      control={form.control}
                      name="fecha_desde_visita"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="text-red-500">*</span> Fecha desde:
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={today}
                              onChange={(e) => {
                                field.onChange(e);
                                handleFechaDesdeChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="fecha_desde_hasta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="text-red-500">*</span> Vigencia
                            hasta:
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={fechaDesde ? getNextDay(fechaDesde) : today}
                              onChange={(e) => field.onChange(e)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {tipoVisita === "rango_de_fechas" && (
                  <div className="space-y-4">
                    <div>
                      <FormLabel>Días de acceso:</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          type="button"
                          onClick={() =>
                            handleToggleDiasAcceso("cualquier_día")
                          }
                          className={`px-4 py-2 rounded-md transition-all duration-300 ${
                            isActiveCualquierDia
                              ? "bg-blue-600 text-white"
                              : "border-2 border-blue-400 bg-transparent text-blue-600"
                          } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}>
                          Cualquier Día
                        </Button>
                        <Button
                          type="button"
                          onClick={() =>
                            handleToggleDiasAcceso("limitar_días_de_acceso")
                          }
                          className={`px-4 py-2 rounded-md transition-all duration-300 ${
                            isActivelimitarDiasSemana
                              ? "bg-blue-600 text-white"
                              : "border-2 border-blue-400 bg-transparent text-blue-600"
                          } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}>
                          Limitar Días
                        </Button>
                      </div>
                    </div>

                    {config_dia_de_acceso === "limitar_días_de_acceso" && (
                      <div>
                        <FormLabel>Seleccione los días:</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            "Lunes",
                            "Martes",
                            "Miércoles",
                            "Jueves",
                            "Viernes",
                            "Sábado",
                            "Domingo",
                          ].map((dia) => (
                            <Button
                              key={dia}
                              type="button"
                              onClick={() => toggleDia(dia.toLowerCase())}
                              className={`px-3 py-2 rounded-md transition-all duration-300 ${
                                config_dias_acceso.includes(dia.toLowerCase())
                                  ? "bg-blue-600 text-white"
                                  : "border-2 border-blue-400 bg-white text-blue-600"
                              } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}>
                              {dia}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isActivelimitarDias && (
                      <div className="w-1/2">
                        <Controller
                          control={form.control}
                          name="config_limitar_acceso"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Limitar número de accesos:</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Ejemplo: 5"
                                  min={0}
                                  step={1}
                                  value={field.value ? Number(field.value) : 0}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? Number(e.target.value)
                                        : 0,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="text-gray-400">**Campos requeridos</p>
          </form>
        </Form>
        </div>

        <div className="flex gap-5 flex-shrink-0 pt-4 border-t border-gray-100">
          <DialogClose asChild>
            <Button
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={() => form.reset()}>
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="add-visit-form"
            disabled={loading || registrandoIngreso}
            onClick={() => setFormSubmitted(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white">
            {registrandoIngreso ? (
              <>
                <Loader2 className="animate-spin" /> Realizando ingreso...
              </>
            ) : loading ? (
              <>
                <Loader2 className="animate-spin" /> Cargando...
              </>
            ) : (
              "Crear Visita"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
