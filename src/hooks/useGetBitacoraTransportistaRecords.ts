import { useQuery } from "@tanstack/react-query";
import { getBitacoraTransportistaRecords } from "@/services/endpoints";

export interface BitacoraTransportistaRecord {
  _id: string;
  folio: string;
  num_de_pase: string | null;
  placas: string | null;
  proveedor_cliente: string | null;
  conductor: string | null;
  tipo_de_operacion: "entrega" | "recoleccion" | string | null;
  estatus: string;
  fecha_hora_ingreso: string | null;
  material: string | null;
  anden_asignado: string | null;
}

function extractRecords(res: unknown): BitacoraTransportistaRecord[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  // Intentar response.data primero, luego data directo
  const inner = (r?.response as Record<string, unknown>)?.data ?? r?.data ?? res;
  if (Array.isArray(inner)) return inner as BitacoraTransportistaRecord[];
  return [];
}

export const useGetBitacoraTransportistaRecords = (fecha?: string) => {
  const { data, isLoading, error, refetch } = useQuery<BitacoraTransportistaRecord[]>({
    queryKey: ["bitacoraTransportistaRecords", fecha ?? "all"],
    queryFn: async () => {
      const res = await getBitacoraTransportistaRecords(fecha);
      return extractRecords(res);
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return { data: Array.isArray(data) ? data : [], isLoading, error, refetch };
};
