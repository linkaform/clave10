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
import { useEffect, useState } from "react";

import { useSearchPass } from "@/hooks/useSearchPass";
import LoadImage, { Imagen } from "../upload-Image";
import { useBoothStore } from "@/store/useBoothStore";
import { uniqueArray } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "Campo requerido",
  }),
  empresa: z.string().min(2, {
    message: "Campo requerido",
  }),
  foto: z.array(
    z.object({
      file_url: z.string(),
      file_name: z.string(),
    })
  ).optional(),
  identificacion: z.array(
    z.object({
      file_url: z.string(),
      file_name: z.string(),
    })
  ).optional(),
  area: z.string().optional(),
  visita_a: z.string().min(1, {
    message: "Campo requerido",
  }),
  perfil_pase: z.string().min(1, {
    message: "Campo requerido",
  }),
  status_pase: z.string().optional(),
  tipo_visita_pase: z.enum(["fecha_fija", "rango_de_fechas"]).optional(),
  fechaFija: z.string().optional(),
  fecha_desde_visita: z.string().optional(),
  fecha_desde_hasta: z.string().optional(),
  config_dia_de_acceso: z.enum(["cualquier_día", "limitar_días_de_acceso"]).optional(),
  config_dias_acceso: z.array(z.string()).optional(),
  config_limitar_acceso: z.number().optional(),
});

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

  const form = useForm<z.infer<typeof formSchema>>({
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

  function onSubmit(data: z.infer<typeof formSchema>) {
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

    if (fotografia.length === 0) {
      setFotoError(true);
      valid = false;
    } else {
      setFotoError(false);
    }

    if (identificacion.length === 0) {
      setIdError(true);
      valid = false;
    } else {
      setIdError(false);
    }

    if (!valid) return;
	console.log("ACCESS PASS DATA", access_pass)
    registerNewVisit.mutate({ location: location ?? "", access_pass });
  }

  useEffect(() => {
    if (openModal) {
    }
  }, [openModal]);

  useEffect(() => {
    if (fotografia.length > 0) {
      setFotoError(false);
    } else {
      setFotoError(true);
    }

    if (identificacion.length > 0) {
      setIdError(false);
    } else {
      setIdError(true);
    }
  }, [formSubmitted, fotografia, identificacion]);

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

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

            <LoadImage
              id="fotografia"
              titulo={"Fotografía"}
              setImg={setFotografia}
              showWebcamOption={true}
              facingMode="environment"
              imgArray={fotografia}
              showArray={true}
              limit={10}
            />

            {fotoError && (
              <div className="text-red-500 text-sm">Faltan campos por llenar</div>
            )}

            <LoadImage
              id="identificacion"
              titulo={"Identificación"}
              setImg={setIdentificacion}
              showWebcamOption={true}
              facingMode="environment"
              imgArray={identificacion}
              showArray={true}
              limit={10}
            />

            {idError && (
              <div className="text-red-500 text-sm">Faltan campos por llenar</div>
            )}

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
				}`}
				>
				{isActiveAdvanced ? "Opciones avanzadas":"Ver opciones avanzadas"}
			</Button>
            {isActiveAdvanced && (
              <div className="space-y-6 p-4 border border-blue-100 rounded-md bg-blue-50">

                <div className="flex items-center flex-wrap gap-3">
                  <FormLabel>Vigencia:</FormLabel>
                  <Button
                    type="button"
                    onClick={() => handleToggleTipoVisitaPase("rango_de_fechas")}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      isActiveRangoFecha
                        ? "bg-blue-600 text-white"
                        : "border-2 border-blue-400 bg-transparent text-blue-600"
                    } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
                  >
                    Vigencia
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleToggleTipoVisitaPase("fecha_fija")}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      isActiveFechaFija
                        ? "bg-blue-600 text-white"
                        : "border-2 border-blue-400 bg-transparent text-blue-600"
                    } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
                  >
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
                      } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
                    >
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
                          <span className="text-red-500">*</span> Fecha y Hora de Visita:
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
                            <span className="text-red-500">*</span> Vigencia hasta:
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
                          onClick={() => handleToggleDiasAcceso("cualquier_día")}
                          className={`px-4 py-2 rounded-md transition-all duration-300 ${
                            isActiveCualquierDia
                              ? "bg-blue-600 text-white"
                              : "border-2 border-blue-400 bg-transparent text-blue-600"
                          } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
                        >
                          Cualquier Día
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleToggleDiasAcceso("limitar_días_de_acceso")}
                          className={`px-4 py-2 rounded-md transition-all duration-300 ${
                            isActivelimitarDiasSemana
                              ? "bg-blue-600 text-white"
                              : "border-2 border-blue-400 bg-transparent text-blue-600"
                          } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
                        >
                          Limitar Días
                        </Button>
                      </div>
                    </div>

                    {config_dia_de_acceso === "limitar_días_de_acceso" && (
                      <div>
                        <FormLabel>Seleccione los días:</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(
                            (dia) => (
                              <Button
                                key={dia}
                                type="button"
                                onClick={() => toggleDia(dia.toLowerCase())}
                                className={`px-3 py-2 rounded-md transition-all duration-300 ${
                                  config_dias_acceso.includes(dia.toLowerCase())
                                    ? "bg-blue-600 text-white"
                                    : "border-2 border-blue-400 bg-white text-blue-600"
                                } hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]`}
                              >
                                {dia}
                              </Button>
                            )
                          )}
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
                                      e.target.value ? Number(e.target.value) : 0
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
                disabled={loading}
                onClick={() => { setFormSubmitted(true); }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? <><Loader2 className="animate-spin" /> Cargando...</> : "Crear Visita"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};