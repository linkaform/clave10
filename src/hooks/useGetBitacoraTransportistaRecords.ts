import { useQuery } from "@tanstack/react-query";
import { getBitacoraTransportistaRecords, BitacoraTransportistaRecordsParams } from "@/services/endpoints";

export interface BitacoraTransportistaRecord {
  _id: string;
  folio: string;
  num_de_pase: string | null;
  placas: string | null;
  proveedor_cliente: string | null;
  conductor: string | null;
  tipo_de_operacion: "entrega" | "recoleccion" | string | null;
  tipo_de_vehiculo: string | null;
  estatus: string;
  fecha_hora_ingreso: string | null;
  material: string | null;
  anden_asignado: string | null;
}

export interface BitacoraTransportistaPagination {
  actual_page: number;
  records_on_page: number;
  total_pages: number;
  total_records: number;
}

interface ExtractedResponse {
  records: BitacoraTransportistaRecord[];
  pagination: BitacoraTransportistaPagination;
}

function extractResponse(res: unknown): ExtractedResponse {
  const empty: ExtractedResponse = {
    records: [],
    pagination: { actual_page: 1, records_on_page: 0, total_pages: 1, total_records: 0 },
  };
  if (!res) return empty;
  const r = res as Record<string, unknown>;
  // Intentar response.data primero, luego data directo
  const inner = ((r?.response as Record<string, unknown>)?.data ?? r?.data ?? res) as
    | BitacoraTransportistaRecord[]
    | (Partial<BitacoraTransportistaPagination> & { records?: BitacoraTransportistaRecord[] })
    | undefined;

  // Backend legacy (aún no sincronizado): lista plana sin metadata de paginación
  if (Array.isArray(inner)) {
    return {
      records: inner,
      pagination: { actual_page: 1, records_on_page: inner.length, total_pages: 1, total_records: inner.length },
    };
  }

  if (inner && Array.isArray(inner.records)) {
    const records = inner.records;
    return {
      records,
      pagination: {
        actual_page: inner.actual_page ?? 1,
        records_on_page: inner.records_on_page ?? records.length,
        total_pages: inner.total_pages ?? 1,
        total_records: inner.total_records ?? records.length,
      },
    };
  }

  return empty;
}

export const useGetBitacoraTransportistaRecords = (
  fecha?: string,
  params: BitacoraTransportistaRecordsParams = {},
) => {
  const {
    date_from, date_to, tipo_de_vehiculo, proveedor_cliente, anden_asignado,
    estatus, tipo_de_operacion, conductor, material, search, skip, limit,
  } = params;

  const { data, isLoading, error, refetch } = useQuery<ExtractedResponse>({
    queryKey: [
      "bitacoraTransportistaRecords",
      fecha ?? "all",
      date_from ?? "",
      date_to ?? "",
      [...(tipo_de_vehiculo ?? [])].sort().join(","),
      [...(proveedor_cliente ?? [])].sort().join(","),
      [...(anden_asignado ?? [])].sort().join(","),
      [...(estatus ?? [])].sort().join(","),
      [...(tipo_de_operacion ?? [])].sort().join(","),
      [...(conductor ?? [])].sort().join(","),
      [...(material ?? [])].sort().join(","),
      search ?? "",
      skip ?? 0,
      limit ?? 0,
    ],
    queryFn: async () => {
      const res = await getBitacoraTransportistaRecords({ fecha, ...params });
      return extractResponse(res);
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.records ?? [],
    pagination: data?.pagination ?? { actual_page: 1, records_on_page: 0, total_pages: 1, total_records: 0 },
    isLoading,
    error,
    refetch,
  };
};
