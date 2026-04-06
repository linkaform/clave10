import { useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook personalizado para obtener todos los parámetros de la URL
 * de forma reactiva y estructurada como arrays de strings.
 *
 * @param onParamsChange Callback opcional para reaccionar a cambios en los parámetros.
 *
 * @example
 * const params = useQueryParams((p) => {
 *   if (p.status) setFilters(prev => ({ ...prev, status: p.status }));
 * });
 */
export const useQueryParams = (
  onParamsChange?: (params: Record<string, string[]>) => void,
) => {
  const searchParams = useSearchParams();
  const onParamsChangeRef = useRef(onParamsChange);

  // Actualizamos la referencia del callback para que el useEffect no dependa de su identidad
  useEffect(() => {
    onParamsChangeRef.current = onParamsChange;
  }, [onParamsChange]);

  const params = useMemo(() => {
    const p: Record<string, string[]> = {};

    searchParams.forEach((value, key) => {
      if (p[key]) {
        p[key].push(value);
      } else {
        p[key] = [value];
      }
    });

    return p;
  }, [searchParams]);

  useEffect(() => {
    if (onParamsChangeRef.current) {
      onParamsChangeRef.current(params);
    }
  }, [params]);

  return params;
};
