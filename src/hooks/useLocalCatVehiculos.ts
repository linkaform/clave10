import { getCatalogVehiculos } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface getVehiculosParams {
  tipo: string;
  marca?: string;
  isModalOpen: boolean;
}

// Compartida con quien necesite el catálogo fuera del hook (ej. el
// autollenado por OCR en add-local-vehicule.tsx vía queryClient.fetchQuery)
// para no duplicar cómo se obtiene el dato — si esto pasa a pegarle a un
// backend, se actualiza en un solo lugar.
export const catalogVehiculosQueryKey = (tipo: string, marca?: string) =>
  ["getCatalogVehiculos", tipo, marca] as const;

export const fetchCatalogVehiculos = ({ tipo = "", marca = "" }: { tipo?: string; marca?: string } = {}) =>
  getCatalogVehiculos({ tipo, marca }) || [];

export const useGetLocalVehiculos = ({ tipo, marca, isModalOpen }: getVehiculosParams) => {
  const { data, isLoading, error, isFetching, refetch } = useQuery<any>({
    queryKey: catalogVehiculosQueryKey(tipo, marca),
    enabled: isModalOpen,
    queryFn: () => fetchCatalogVehiculos({ tipo, marca }),
  });

  return {
    data,
    isLoading,
    error,
    isFetching,
    refetch,
  };
};