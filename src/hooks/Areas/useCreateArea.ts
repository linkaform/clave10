import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createAreaSdk, getFiltersAreasSdk, CreateAreaData } from "@/lib/areas-sdk";
import { errorMsj } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

export const useCreateArea = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const { data: filtros } = useQuery<{ tipo: FilterOption[]; disponibilidad: FilterOption[] }>({
    queryKey: ["filtersAreas", "crear"],
    queryFn: async () => {
      const result = await getFiltersAreasSdk();
      const filters = result?.response?.data ?? [];
      const opciones = (key: string) => filters.find((f: any) => f.key === key)?.options ?? [];
      return { tipo: opciones("tipo"), disponibilidad: opciones("disponibilidad") };
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleCreateArea = async (data: CreateAreaData) => {
    setIsCreating(true);
    try {
      const result = await createAreaSdk(data);
      const textMsj = errorMsj(result);
      if (textMsj) {
        toast.error(`Error al crear el área: ${textMsj.text}`);
        return false;
      }
      // create_new_area no crea nada si ya hay un área con ese nombre en la
      // ubicación: responde { status_comment: "El area ya existe. ..." }.
      const statusComment: string = result?.response?.data?.status_comment ?? "";
      if (statusComment.toLowerCase().includes("ya existe")) {
        toast.warning("Ya existe un área con ese nombre en esta ubicación.");
        return false;
      }
      toast.success("Área creada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["areasCatalog"] });
      return true;
    } catch (err) {
      console.error("Error al crear área:", err);
      toast.error("Error inesperado al crear el área.");
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    tiposDeArea: filtros?.tipo ?? [],
    disponibilidadOptions: filtros?.disponibilidad ?? [],
    handleCreateArea,
    isCreating,
  };
};
