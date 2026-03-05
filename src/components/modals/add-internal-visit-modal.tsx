"use client";

import React, { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "../ui/input";
import { useSearchPass } from "@/hooks/useSearchPass";
import LoadImage, { Imagen } from "../upload-Image";
import { useBoothStore } from "@/store/useBoothStore";
import { Loader2 } from "lucide-react";
import Multiselect from "multiselect-react-dropdown";
import { getCatalogoPasesAreaNoApi } from "@/lib/get-catalogos-pase-area";

interface Props {
  title: string;
  children: React.ReactNode;
}

const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "Campo requerido",
  }),
  perfil_pase: z.string().min(1, {
    message: "Campo requerido",
  }),
  fecha: z.string(),
  visita_a: z.string().min(1, {
    message: "Campo requerido",
  }),
  areas: z.array(z.string()).min(1, "Selecciona al menos una área"),
});

export const AddInternalVisitModal: React.FC<Props> = ({ title, children }) => {
  const [openModal, setOpenModal] = useState(false);
  const [fotografia, setFotografia] = useState<Imagen[]>([]);
  const [fotoError, setFotoError] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { location, area } = useBoothStore();
  console.log("Location from Booth Store:", location);
  console.log("Area from Booth Store:", area);
  const { assets, assetsLoading, registerNewVisit, loading } = useSearchPass(openModal);
  
  const today = new Date().toISOString().split("T")[0];

  // Logic for Areas (Integrated from pases pattern)
  const [areasTodas, setAreasTodas] = useState<any[]>([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<any[]>([]);

  // Logic for Visita a (Integrated from pases pattern)
  const [visitaASeleccionadas, setVisitaASeleccionadas] = useState<any[]>([{ name: "Usuario Actual", label: "Usuario Actual" }]);
  const [customVisitaA, setCustomVisitaA] = useState("");
  const multiselectRef = useRef<any>(null);

  const assetsUnique = Array.from(new Set(assets?.Visita_a || []));
  if (!assetsUnique.includes("Usuario Actual")) {
    assetsUnique.unshift("Usuario Actual");
  }

  const visitaAFormatted = assetsUnique.map((u: any) => ({ name: u, id: u }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      perfil_pase: "Interno",
      fecha: today,
      visita_a: "Usuario Actual",
      areas: [],
    },
  });

  useEffect(() => {
    if (openModal) {
      setFormSubmitted(false);
      setFotoError(false);
    }
  }, [openModal]);

  useEffect(() => {
    if (fotografia.length > 0) {
      setFotoError(false);
    } else if (formSubmitted) {
      setFotoError(true);
    }
  }, [formSubmitted, fotografia]);

  useEffect(() => {
    if (location && openModal) {
      const fetchAreas = async () => {
        const res = await getCatalogoPasesAreaNoApi(location);
        const areas = res?.response?.data?.areas_by_location ?? [];
        const formatted = areas.map((area: string) => ({
          name: area,
          id: area,
        }));
        setAreasTodas(formatted);
      };
      fetchAreas();
    }
  }, [location, openModal]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    setFormSubmitted(true);
    if (fotografia.length === 0) {
      setFotoError(true);
      return;
    }

    const access_pass = {
      nombre: data.nombre,
      perfil_pase: data.perfil_pase,
      visita_a: visitaASeleccionadas.map((v) => v.name),
      foto: fotografia,
      status_pase: "activo",
      ubicaciones: [location ?? ""],
      areas: areasSeleccionadas.map((a) => a.id),
      tipo_visita_pase: "fecha_fija",
      fecha_desde_visita: today,
      created_from: "nueva_visita_interna",
      location: location ?? "",
      area: area ?? "",
    };

    registerNewVisit.mutate(
      { location: location ?? "", access_pass },
      {
        onSuccess: () => {
          setOpenModal(false);
          form.reset();
          setFotografia([]);
          setAreasSeleccionadas([]);
          setVisitaASeleccionadas([{ name: "Usuario Actual", label: "Usuario Actual" }]);
          setFormSubmitted(false);
        },
      }
    );
  }

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="visita_a"
              render={() => (
                <FormItem>
                  <FormLabel>Visita a:</FormLabel>
                  {assetsLoading ? (
                    <div className="flex items-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-500">Cargando usuarios...</span>
                    </div>
                  ) : (
                    <Multiselect
                      ref={multiselectRef}
                      options={visitaAFormatted}
                      selectedValues={visitaASeleccionadas}
                      onSelect={setVisitaASeleccionadas}
                      onRemove={setVisitaASeleccionadas}
                      onSearch={(value: string) => {
                        if (value.length <= 70) {
                          setCustomVisitaA(value);
                        } else if (multiselectRef.current?.searchBox?.current) {
                          multiselectRef.current.searchBox.current.value = value.substring(0, 70);
                        }
                      }}
                      onKeyPressFn={(e: any) => {
                        if (e.key === "Enter" && customVisitaA.trim()) {
                          const newValue = {
                            name: `${customVisitaA}(No Registrado)`,
                            id: `${customVisitaA}(No Registrado)`,
                          };
                          const updated = [...visitaASeleccionadas, newValue];
                          setVisitaASeleccionadas(updated);
                          setCustomVisitaA("");
                          if (multiselectRef.current) {
                            multiselectRef.current.resetSelectedValues(updated);
                            if (multiselectRef.current.searchBox?.current) {
                              multiselectRef.current.searchBox.current.value = "";
                            }
                          }
                        }
                      }}
                      displayValue="name"
                      placeholder=""
                      emptyRecordMsg={
                        customVisitaA
                          ? `Presiona Enter para agregar "${customVisitaA}"`
                          : "No hay opciones disponibles"
                      }
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>* Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Escribe el nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Tipo de Visita</FormLabel>
              <FormControl>
                <Input value="Interno" disabled className="bg-gray-100" />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Input type="date" value={today} disabled className="bg-gray-100" />
              </FormControl>
              <p className="text-xs text-gray-500 italic">Informativo: Fecha de hoy</p>
            </FormItem>

            <FormField
              control={form.control}
              name="areas"
              render={() => (
                <FormItem>
                  <FormLabel>* Áreas</FormLabel>
                  <Multiselect
                    options={areasTodas}
                    selectedValues={areasSeleccionadas}
                    onSelect={(selected) => {
                      setAreasSeleccionadas(selected);
                      form.setValue("areas", selected.map((a: any) => a.id));
                    }}
                    onRemove={(selected) => {
                      setAreasSeleccionadas(selected);
                      form.setValue("areas", selected.map((a: any) => a.id));
                    }}
                    displayValue="name"
                    placeholder="Seleccione áreas"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>* Fotografía</FormLabel>
              <LoadImage
                id="fotografia_interna"
                titulo={""}
                setImg={setFotografia}
                showWebcamOption={true}
                facingMode="user"
                imgArray={fotografia}
                limit={1}
              />
              {fotoError && fotografia.length === 0 && (
                <p className="text-red-500 text-sm">La fotografía es obligatoria</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <DialogClose asChild>
                <Button variant="outline" className="w-full" onClick={() => form.reset()}>
                  Cancelar
                </Button>
              </DialogClose>

              <Button
                type="submit"
                disabled={loading}
                onClick={() => setFormSubmitted(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? <><Loader2 className="animate-spin mr-2" /> Cargando...</> : "Crear Visita"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
