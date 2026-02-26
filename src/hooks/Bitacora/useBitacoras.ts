import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns";
import { getListBitacora } from "@/lib/bitacoras";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface Data {
    total_records: number
    records: Bitacora_record[]
    actual_page: number
    total_pages: number
    records_on_page: number
}

export const useBitacoras = (location: string, area: string, prioridades: string[], enableList: boolean, date1: string, date2: string, dateFilter: string, limit: number = 20, offset: number = 0) => {
    const { data: listBitacoras, isLoading: isLoadingListBitacoras, error: errorListBitacoras, refetch } = useQuery<Data>({
        queryKey: ["getListBitacoras", area, location, prioridades, date1, date2, dateFilter, limit, offset],
        enabled: enableList,
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
        queryFn: async () => {
            const data = await getListBitacora(location, area, prioridades, date1, date2, dateFilter, limit, offset);
            const textMsj = errorMsj(data);
            if (textMsj) {
                throw new Error(`Error al obtener lista de bitacoras, Error: ${data.error}`);
            } else {
                return data?.response?.data ?? { records: [], total_records: 0, total_pages: 0, actual_page: 1, records_on_page: 0 };
            }
        },
    });

    return {
        listBitacoras,
        isLoadingListBitacoras,
        errorListBitacoras,
        refetchBitacoras: refetch,
    }
}