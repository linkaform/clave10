import { RondinResponse } from "@/components/table/rondines/table";
import { getListRondin } from "@/lib/rondines";
import { errorMsj } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export const useGetListRecorridos = (enableList:boolean, date1:string, date2:string, limit:number, offset:number) => {

    const {data: listRecorridos, isLoading:isLoadingListRecorridos, error:errorListRecorridos} = useQuery<RondinResponse>({
        queryKey: ["getListRondines", date1, date2, limit, offset],
        enabled:enableList,
        queryFn: async () => {
            const data = await getListRondin(date1, date2, limit, offset);
            const textMsj = errorMsj(data) 
            if (textMsj){
              throw new Error (`Error al obtener lista de rondines, Error: ${data.error}`);
            }else {
              return Array.isArray(data.response?.data)? data.response?.data : [];
            }
        },
    });

    return{
        listRecorridos,
        isLoadingListRecorridos,
        errorListRecorridos,
    }
}