import { getPdfIncidencias, getPdfIncidenciaConFallback } from "@/lib/get-pdf-incidencias";
import { useQuery } from "@tanstack/react-query";

export const useGetPdfIncidencias = (qr_code: string, template_id:number|null, account_id:number|null, name_pdf?:string) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getPdfIncidencias", qr_code, template_id, account_id],
    queryFn: async () => {
      const data = await getPdfIncidencias(qr_code, template_id, account_id??0, name_pdf);
      return data;
    },
    enabled: false,
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};

// Plantilla v2; si la cuenta aún no tiene la opción en el script, cae al PDF de siempre.
export const useGetPdfIncidenciaV2 = (qr_code: string, account_id: number | null, name_pdf?: string) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getPdfIncidenciaV2", qr_code],
    queryFn: () => getPdfIncidenciaConFallback(qr_code, account_id ?? 0, name_pdf),
    enabled: false,
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};
