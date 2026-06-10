/* eslint-disable react-hooks/exhaustive-deps */
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import Select from "react-select";
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
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import React from "react";
import { toast } from "sonner";
import { useGetLocalVehiculos } from "@/hooks/useLocalCatVehiculos";
import { Vehiculo } from "@/lib/update-pass";
import { useAccessStore } from "@/store/useAccessStore";
import { useUpdateBitacora } from "@/hooks/useUpdateBitacora";
import { catalogoColores } from "@/lib/utils";
import LoadImage from "../upload-Image";
import { useCatalogoEstados } from "@/hooks/useCatalogoEstados";
import useAuthStore from "@/store/useAuthStore";
import { useGetVehiculos } from "@/hooks/useGetVehiculos";

interface Props {
  title: string;
  children: React.ReactNode;
  vehicles: Vehiculo[];
  setVehiculos: Dispatch<SetStateAction<Vehiculo[]>>;
  isAccesos: boolean;
  id?: string;
  fetch?: boolean;
}

const formSchema = z.object({
  tipo: z.array(z.string()).min(1, "Debe seleccionar un tipo."),
  marca: z.array(z.string()).min(1, "Debe seleccionar una marca."),
  modelo: z.array(z.string()).min(1, "Debe seleccionar un modelo."),
  estado: z.array(z.string()).optional(),
  placas: z.string().optional(),
  color: z.array(z.string()).min(1, "Debe seleccionar un color."),
  foto_vehiculo: z.array(z.any()).optional().default([]),
});

export const VehicleLocalPassModal: React.FC<Props> = ({
  title,
  children,
  vehicles,
  setVehiculos,
  isAccesos,
  id = "",
  fetch = false,
}) => {
  const [open, setOpen] = useState(false);
  const { userParentId, userIdSoter } = useAuthStore();

  const [tipoVehiculoState, setTipoVehiculoState] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [marcaState, setMarcaState] = useState("");
  const [tiposCat, setTiposCat] = useState<string[]>([]);
  const [marcasCat, setMarcasCat] = useState<string[]>([]);
  const [modelosCat, setModelosCat] = useState<string[]>([]);
  const { data: dataVehiculosHook } = useGetVehiculos({
    account_id:userIdSoter,
    tipo: tipoVehiculoState,
    marca: marcaState,
    isModalOpen: open,
  });
  console.log("QUE PASA AQUI",dataVehiculosHook)

  const { data: dataVehiculos } = useGetLocalVehiculos({
    tipo: tipoVehiculoState,
    marca: marcaState,
    isModalOpen: true,
  });

  const setSelectedVehiculos = useAccessStore(
    (state) => state.setSelectedVehiculos
  );
  const { updateBitacoraMutation, isLoading } = useUpdateBitacora();

  const catColores = catalogoColores().map((tipo: any) => ({
    value: tipo,
    label: tipo,
  }));

  const { data: dataEstados } = useCatalogoEstados(userParentId ?? 0, open);
  const catEstados = Array.isArray(dataEstados)
    ? dataEstados.map((estado: string) => ({ value: estado, label: estado }))
    : [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: [],
      marca: [],
      estado: [],
      modelo: [],
      placas: "",
      color: [],
      foto_vehiculo: [],
    },
  });

  useEffect(() => {
    setTiposCat(dataVehiculos);
  }, []);

  useEffect(() => {
    if (!tiposCat && dataVehiculos) {
      const opcionesTipos = dataVehiculos.map((tipo: any) => ({
        value: tipo,
        label: tipo,
      }));
      setTiposCat(opcionesTipos);
    }
    if (dataVehiculos && tipoVehiculoState && catalogSearch === "marcas") {
      const opcionesMarcas = dataVehiculos.map((marca: any) => ({
        value: marca,
        label: marca,
      }));
      setMarcasCat(opcionesMarcas);
    }
    if (
      dataVehiculos &&
      tipoVehiculoState &&
      marcaState &&
      catalogSearch === "modelos"
    ) {
      const opcionesModelos = dataVehiculos.map((modelo: any) => ({
        value: modelo,
        label: modelo,
      }));
      setModelosCat(opcionesModelos);
    }
  }, [dataVehiculos]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    addNewVehicle(data);
    form.reset();
    toast.success("Vehículo agregado correctamente.");
    setOpen(false);
  }

  const addNewVehicle = (data: z.infer<typeof formSchema>) => {
    const vehiculo = {
      color: data.color?.length ? data.color[0] : "",
      marca: data.marca?.length ? data.marca[0] : "",
      modelo: data.modelo?.length ? data.modelo[0] : "",
      estado: data.estado?.length ? data.estado[0] : "",
      placas: data.placas || "",
      tipo: data?.tipo ? data.tipo[0] : "",
      foto_vehiculo: data.foto_vehiculo || [],
    };

    if (isAccesos) {
      if (data?.tipo[0] === "") setSelectedVehiculos([vehiculo]);
      setVehiculos([vehiculo, ...vehicles]);
    } else {
      if (fetch) {
        updateBitacoraMutation.mutate({ vehiculo, id });
      } else {
        setVehiculos([vehiculo, ...vehicles]);
      }
    }
  };

  useEffect(() => {
    if (!open) {
      form.setValue("tipo", []);
      form.setValue("marca", []);
      form.setValue("modelo", []);
      form.setValue("color", []);
      form.setValue("estado", []);
      form.setValue("placas", "");
    }
  }, [open]);

const normalizar = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const handleOcrVehiculo = async (result: any) => {
  const v = result?.data;
  if (!v) return;

    // 1. Tipo — dispara fetch de marcas
    if (v.tipo_vehiculo) {
      const tipoNorm = normalizar(v.tipo_vehiculo);
      const tipoMatch = (tiposCat as any[]).find(
        (t) => normalizar(t.value) === tipoNorm
      );
      if (tipoMatch) {
        form.setValue("tipo", [tipoMatch.value]);
        setTipoVehiculoState(tipoMatch.value);
        setCatalogSearch("marcas");
      }
    }

    // 2. Esperar a que lleguen las marcas
    if (v.marca) {
      await new Promise((res) => setTimeout(res, 800));
      const marcaNorm = normalizar(v.marca);
      const marcaMatch = (marcasCat as any[]).find(
        (m) => normalizar(m.value) === marcaNorm
      );
      if (marcaMatch) {
        form.setValue("marca", [marcaMatch.value]);
        setMarcaState(marcaMatch.value);
        setCatalogSearch("modelos");
      }
    }

    // 3. Esperar a que lleguen los modelos
    if (v.modelo) {
      await new Promise((res) => setTimeout(res, 800));
      const modeloNorm = normalizar(v.modelo);
      const modeloMatch = (modelosCat as any[]).find(
        (m) => normalizar(m.value) === modeloNorm
      );
      if (modeloMatch) {
        form.setValue("modelo", [modeloMatch.value]);
      }
    }

    // 4. Color y placas — sin dependencia de catálogo
    if (v.color_principal) {
      const colorNorm = normalizar(v.color_principal);
      const colorMatch = catColores.find(
        (c: any) => normalizar(c.value) === colorNorm
      );
      if (colorMatch) form.setValue("color", [colorMatch.value]);
    }

    form.setValue("placas", v.placa ?? "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl flex flex-col max-h-[90vh]"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target?.closest?.("[class*='react-select']")) return;
          e.preventDefault();
        }}
        aria-describedby=""
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-center font-bold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 overflow-y-auto flex-1 pb-4">
          <Form {...form}>
            <form className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                    <path d="M9 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-blue-900">
                    Análisis automático con IA
                  </p>
                  <p className="text-xs text-blue-600">
                    Sube hasta <span className="font-medium">5 fotos</span> — placas, frente, lateral y trasera. Se extraerá la información automáticamente.
                  </p>
                  <p className="text-xs text-amber-500 font-medium flex items-center gap-1 mt-0.5">
                    ⚠ La IA puede cometer errores, verifica los datos antes de continuar.
                  </p>
                </div>
              </div>
              {/* ── Foto + aviso IA ─────────────────────────────── */}
              <FormField
                control={form.control}
                name="foto_vehiculo"
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <FormLabel>Foto del vehículo</FormLabel>
                    <FormControl>
                      <LoadImage
                        id="foto_vehiculo"
                        titulo=""
                        imgArray={field.value || []}
                        setImg={field.onChange}
                        showWebcamOption={true}
                        facingMode="environment"
                        tipoOcr="vehiculo"
                        onOcrResult={handleOcrVehiculo}
                        showPlaceholder
                        limit={5}
                      />
                    </FormControl>

                    {fieldState.error && (
                      <span className="text-red-500 text-xs mt-1 block px-1">
                        {fieldState.error.message}
                      </span>
                    )}
                  </div>
                )}
              />

              {/* ── Grid dos columnas ────────────────────────────── */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>* Tipo de vehículo</FormLabel>
                      <Select
                        value={
                          field.value?.length
                            ? { value: field.value[0], label: field.value[0] }
                            : null
                        }
                        options={tiposCat}
                        onChange={(value: any) => {
                          if (value) {
                            field.onChange([value.value]);
                            setCatalogSearch("marcas");
                            setTipoVehiculoState(value.value);
                            setMarcaState("");
                            setMarcasCat([]);
                          } else {
                            field.onChange([]);
                          }
                        }}
                        isClearable
                        styles={{
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <Select
                        value={
                          field.value?.length
                            ? { value: field.value[0], label: field.value[0] }
                            : null
                        }
                        options={marcasCat}
                        onChange={(value: any) => {
                          if (value) {
                            field.onChange([value.value]);
                            setMarcaState(value.value);
                            setModelosCat([]);
                            setCatalogSearch("modelos");
                          } else {
                            field.onChange([]);
                            setMarcaState("");
                            setModelosCat([]);
                          }
                        }}
                        isClearable
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <Select
                        menuPlacement="top"
                        value={
                          field.value?.length
                            ? { value: field.value[0], label: field.value[0] }
                            : null
                        }
                        options={modelosCat}
                        onChange={(value: any) => {
                          field.onChange(value ? [value.value] : []);
                        }}
                        isSearchable
                        isClearable
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select
                        menuPlacement="top"
                        value={
                          field.value?.length
                            ? { value: field.value[0], label: field.value[0] }
                            : null
                        }
                        options={catColores}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption ? [selectedOption.value] : []);
                        }}
                        isSearchable
                        isClearable
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placas</FormLabel>
                      <FormControl>
                        <Input
                          maxLength={20}
                          {...field}
                          value={field.value?.toUpperCase() || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        menuPlacement="top"
                        value={
                          field.value?.length
                            ? { value: field.value[0], label: field.value[0] }
                            : null
                        }
                        options={catEstados}
                        onChange={(value: any) => {
                          field.onChange(value ? [value.value] : []);
                        }}
                        isClearable
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

            </form>
          </Form>
        </div>

        <div className="flex gap-2 px-4 pt-2 flex-shrink-0">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? "Cargando..." : "Agregar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};