import { useQuery } from "@tanstack/react-query";
import { getEmpleadosByUbicacionSdk } from "@/lib/ubicaciones-sdk";
import { errorMsj } from "@/lib/utils";
import { EmpleadoUbicacionRow } from "@/lib/ubicaciones";

export const useEmpleadosByUbicacion = (ubicacion: string) => {
  const { data, isLoading, error, refetch } = useQuery<EmpleadoUbicacionRow[]>({
    queryKey: ["empleadosByUbicacion", ubicacion],
    enabled: Boolean(ubicacion),
    queryFn: async () => {
      const res = await getEmpleadosByUbicacionSdk(ubicacion);
      const textMsj = errorMsj(res);
      if (textMsj) {
        throw new Error(`Error al obtener los empleados de ${ubicacion}: ${textMsj.text}`);
      }
      const rows = res.response?.data;
      return Array.isArray(rows) ? rows : [];
    },
  });

  return { empleados: data ?? [], isLoading, error, refetch };
};
