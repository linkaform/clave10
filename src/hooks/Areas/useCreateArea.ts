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

  const { data: tiposDeArea } = useQuery<FilterOption[]>({
    queryKey: ["filtersAreas", "tipo"],
    queryFn: async () => {
      const result = await getFiltersAreasSdk();
      const filters = result?.response?.data ?? [];
      const tipoFilter = filters.find((f: any) => f.key === "tipo");
      return tipoFilter?.options ?? [];
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

  return { tiposDeArea: tiposDeArea ?? [], handleCreateArea, isCreating };
};
