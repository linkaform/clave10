import { getPdf } from "@/lib/get-pdf";
import { getPdfIncidencias } from "@/lib/get-pdf-incidencias";
import { useQuery } from "@tanstack/react-query";

export const useGetPdf = (account_id: number|null,qr_code:string, enable:boolean) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getPdf", account_id, qr_code],
    enabled:enable,
    queryFn: async () => {
      const data = await getPdf(
        account_id,
        qr_code
    );
      return data ;
    },
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};


export const useGetPdfMutation = (
  qr_code: string,
  template_id: number | null,
  account_id: number,
  name_pdf?: string
) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: ["getPdf", qr_code, template_id, account_id, name_pdf],
    queryFn: async () => {
      const data = await getPdfIncidencias(qr_code, template_id, account_id, name_pdf);
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