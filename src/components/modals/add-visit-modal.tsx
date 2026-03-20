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

interface Props {
  title: string;
  children: React.ReactNode;
}

const createSchema = (requireFoto: boolean, requireIden: boolean) =>
  z
    .object({
      nombre: z.string().min(2, { message: "Campo requerido" }),
      empresa: z.string().min(2, { message: "Campo requerido" }),
      foto: z
        .array(z.object({ file_url: z.string(), file_name: z.string() }))
        .default([]).optional(),
      identificacion: z
        .array(z.object({ file_url: z.string(), file_name: z.string() }))
        .default([]).optional(),
      area: z.string().optional(),
      visita_a: z.string().optional(),
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
    });

type formatData = z.infer<ReturnType<typeof createSchema>>;

export const AddVisitModal: React.FC<Props> = ({ title, children }) => {
  const [openModal, setOpenModal] = useState(false);
  const [fotografia, setFotografia] = useState<Imagen[]>([]);
  const [identificacion, setIdentificacion] = useState<Imagen[]>([]);
  const [fotoError, setFotoError] = useState(false);
  const [idError, setIdError] = useState(false);
  const { assets, registerNewVisit, loading } = useSearchPass(openModal);
  const { location } = useBoothStore();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const assetsUnique = uniqueArray(assets?.Visita_a);

  const requerimientos = getRequerimientos(location ?? "");
  const requireFoto = requerimientos.includes("fotografia");
  const requireIden = requerimientos.includes("identificacion");

  const formSchema = useMemo(
    () => createSchema(requireFoto, requireIden),
    [requireFoto, requireIden]
  );

  const [isActiveAdvanced, setIsActiveAdvanced] = useState(false);
  const [tipoVisita, setTipoVisita] = useState<"fecha_fija" | "rango_de_fechas">("rango_de_fechas");
  const [isActiveFechaFija, setIsActiveFechaFija] = useState(false);
  const [isActiveRangoFecha, setIsActiveRangoFecha] = useState(true);
  const [isActivelimitarDias, setIsActiveLimitarDias] = useState(true);
  const [isActiveCualquierDia, setIsActiveCualquierDia] = useState(true);
  const [isActivelimitarDiasSemana, setIsActiveLimitarDiasSemana] = useState(false);
  const [config_dia_de_acceso, set_config_dia_de_acceso] = useState("cualquier_día");
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

  useEffect(() => {
    if (openModal) {
      setFormSubmitted(false);
      setFotoError(false);
      setIdError(false);
    }
  }, [openModal]);

  useEffect(() => {
    if (!requireFoto || fotografia.length > 0) {
      setFotoError(false);
    } else {
      setFotoError(true);
    }
    if (!requireIden || identificacion.length > 0) {
      setIdError(false);
    } else {
      setIdError(true);
    }
  }, [formSubmitted, fotografia, identificacion, requireFoto, requireIden]);

  function onSubmit(data: formatData) {
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
      fecha_desde_visita: tipoVisita === "rango_de_fechas" ? (data.fecha_desde_visita ?? "") : "",
      fecha_desde_hasta: tipoVisita === "rango_de_fechas" ? (data.fecha_desde_hasta ?? "") : "",
      config_dia_de_acceso: config_dia_de_acceso,
      config_dias_acceso: config_dias_acceso,
      config_limitar_acceso: isActivelimitarDias ? (Number(data.config_limitar_acceso) || 0) : 0,
    };

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

    registerNewVisit.mutate({ location: location ?? "", access_pass });
  }

  const handleToggleTipoVisitaPase = (tipo: "fecha_fija" | "rango_de_fechas") => {
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

  console.log(form.formState.errors);

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="px-6 pt-6 pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Completa los campos para registrar la visita</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-5">

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="text-red-400">*</span> Nombre Completo
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre completo" className="rounded-xl border-gray-200 bg-gray-50 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requireFoto && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="text-red-400">*</span> Fotografía
                </p>
                <LoadImage
                  id="fotografia"
                  titulo={"Fotografía"}
                  setImg={setFotografia}
                  showWebcamOption={true}
                  facingMode="environment"
                  imgArray={fotografia}
                  limit={10}
                />
                {fotoError && <p className="text-red-500 text-xs">La fotografía es obligatoria</p>}
              </div>
            )}

            {requireIden && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <span className="text-red-400">*</span> Identificación
                </p>
                <LoadImage
                  id="identificacion"
                  titulo={"Identificación"}
                  setImg={setIdentificacion}
                  showWebcamOption={true}
                  facingMode="environment"
                  imgArray={identificacion}
                  limit={10}
                />
                {idError && <p className="text-red-500 text-xs">La identificación es obligatoria</p>}
              </div>
            )}

            <FormField
              control={form.control}
              name="empresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="text-red-400">*</span> Empresa
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la empresa" className="rounded-xl border-gray-200 bg-gray-50 text-sm" {...field} />
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
                  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="text-red-400">*</span> Visita a
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Nombre de la persona a visitar"
                      className="rounded-xl border-gray-200 bg-gray-50 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="perfil_pase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="text-red-400">*</span> Tipo de Visita
                  </FormLabel>
                  <Select onValueChange={(value) => field.onChange(value)}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-gray-200 bg-gray-50 text-sm">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets?.Perfiles?.map((item: string) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="button"
              onClick={() => setIsActiveAdvanced((prev) => !prev)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                isActiveAdvanced
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-blue-300 text-blue-600 bg-blue-50 hover:bg-blue-100"
              }`}
            >
              {isActiveAdvanced ? "Ocultar opciones avanzadas" : "Ver opciones avanzadas"}
            </button>

            {isActiveAdvanced && (
              <div className="space-y-5 p-4 border border-blue-100 rounded-2xl bg-blue-50/50">

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vigencia</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleTipoVisitaPase("rango_de_fechas")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        isActiveRangoFecha ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
                      }`}
                    >
                      Vigencia
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleTipoVisitaPase("fecha_fija")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        isActiveFechaFija ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
                      }`}
                    >
                      Fecha Fija
                    </button>
                    {tipoVisita === "rango_de_fechas" && (
                      <button
                        type="button"
                        onClick={() => setIsActiveLimitarDias((prev) => !prev)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          isActivelimitarDias ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
                        }`}
                      >
                        Limitar Accesos
                      </button>
                    )}
                  </div>
                </div>

                {tipoVisita === "fecha_fija" && (
                  <Controller
                    control={form.control}
                    name="fechaFija"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <span className="text-red-500">*</span> Fecha y Hora de Visita
                        </FormLabel>
                        <FormControl>
                          <Input type="datetime-local" className="rounded-xl border-gray-200 bg-white text-sm" {...field} onChange={(e) => field.onChange(e.target.value)} />
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
                          <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <span className="text-red-500">*</span> Fecha desde
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className="rounded-xl border-gray-200 bg-white text-sm" {...field} min={today} onChange={(e) => { field.onChange(e); handleFechaDesdeChange(e); }} />
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
                          <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <span className="text-red-500">*</span> Vigencia hasta
                          </FormLabel>
                          <FormControl>
                            <Input type="date" className="rounded-xl border-gray-200 bg-white text-sm" {...field} min={fechaDesde ? getNextDay(fechaDesde) : today} onChange={(e) => field.onChange(e)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {tipoVisita === "rango_de_fechas" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Días de acceso</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDiasAcceso("cualquier_día")}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            isActiveCualquierDia ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
                          }`}
                        >
                          Cualquier Día
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDiasAcceso("limitar_días_de_acceso")}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            isActivelimitarDiasSemana ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
                          }`}
                        >
                          Limitar Días
                        </button>
                      </div>
                    </div>

                    {config_dia_de_acceso === "limitar_días_de_acceso" && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Seleccione los días</p>
                        <div className="flex flex-wrap gap-2">
                          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((dia) => (
                            <button
                              key={dia}
                              type="button"
                              onClick={() => toggleDia(dia.toLowerCase())}
                              className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${
                                config_dias_acceso.includes(dia.toLowerCase()) ? "bg-blue-600 text-white border-blue-600" : "border-blue-300 text-blue-600 bg-white hover:bg-blue-50"
                              }`}
                            >
                              {dia}
                            </button>
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
                              <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Limitar número de accesos
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Ejemplo: 5"
                                  min={0}
                                  step={1}
                                  className="rounded-xl border-gray-200 bg-white text-sm"
                                  value={field.value ? Number(field.value) : 0}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
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

            <p className="text-xs text-gray-400">* Campos requeridos</p>

            <div className="flex gap-3 pt-2 pb-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                  onClick={() => form.reset()}
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={loading}
                onClick={() => setFormSubmitted(true)}
                className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-1" /> Cargando...</> : "Crear Visita"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};