import { useQuery } from "@tanstack/react-query";
import { getBandeja } from "@/lib/asistencia-sdk";

export const useBandeja = () =>
  useQuery({
    queryKey: ["bandeja"],
    queryFn: getBandeja,
    staleTime: 1000 * 20,
    // La app avisa al instante; en web basta con revisar seguido.
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
  });
