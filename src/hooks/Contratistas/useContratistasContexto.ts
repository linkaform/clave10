"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getContrato, getMiEmpresa, getRelacion } from "@/services/contratistas";
import type { Contrato, EmpresaRef, Relacion } from "@/types/contratistas";
import {
  acentoDe,
  banderasDe,
  etiquetasEspejo,
  leerRuta,
  pestanasDe,
  resolverPestana,
} from "@/lib/contratistas/contexto";

/**
 * Contexto de Contratistas para cualquier pantalla bajo /dashboard/contratistas:
 * modo, lado, etiquetas espejo (kLbl), pestañas, acento, banderas y los
 * registros abiertos (empresa activa, relación o contrato).
 */
export function useContratistasContexto() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const desdeParam = searchParams.get("desde");

  const ruta = useMemo(() => leerRuta(pathname, desdeParam), [pathname, desdeParam]);
  const { modo, lado, relacionId, contratoId } = ruta;

  const empresaQ = useQuery({
    queryKey: ["contratistas", "mi-empresa"],
    queryFn: getMiEmpresa,
    staleTime: 5 * 60 * 1000,
  });

  const relacionQ = useQuery<Relacion>({
    queryKey: ["contratistas", "relacion", relacionId],
    queryFn: () => getRelacion(relacionId!),
    enabled: !!relacionId,
  });

  const contratoQ = useQuery<Contrato>({
    queryKey: ["contratistas", "contrato", contratoId],
    queryFn: () => getContrato(contratoId!),
    enabled: !!contratoId,
  });

  const empresaId = empresaQ.data?.id;

  return useMemo(() => {
    const pestana = resolverPestana(modo, lado, tab);

    // Contraparte del detalle: el otro lado de la relación.
    let contraparte: EmpresaRef | null = null;
    if (relacionQ.data) {
      contraparte = lado === "cli" ? relacionQ.data.cliente : relacionQ.data.contratista;
    }

    // Perspectiva dentro del contrato: quién es "propio" y quién "otro" (ctoBackMode).
    let perspectiva: { propio: EmpresaRef; otro: EmpresaRef; somosCliente: boolean } | null = null;
    if (contratoQ.data && empresaId) {
      const somosCliente = contratoQ.data.cliente.id === empresaId;
      perspectiva = {
        somosCliente,
        propio: somosCliente ? contratoQ.data.cliente : contratoQ.data.contratista,
        otro: somosCliente ? contratoQ.data.contratista : contratoQ.data.cliente,
      };
    }

    return {
      ...ruta,
      etiquetas: etiquetasEspejo(lado, modo),
      pestanas: pestanasDe(modo, lado),
      pestana,
      acento: acentoDe(modo, lado),
      ...banderasDe(modo, lado, pestana.resaltada),
      empresa: empresaQ.data ?? null,
      relacion: relacionQ.data ?? null,
      contrato: contratoQ.data ?? null,
      contraparte,
      perspectiva,
      isLoading:
        empresaQ.isLoading ||
        (!!relacionId && relacionQ.isLoading) ||
        (!!contratoId && contratoQ.isLoading),
      error: empresaQ.error || relacionQ.error || contratoQ.error || null,
    };
  }, [
    ruta,
    modo,
    lado,
    tab,
    relacionId,
    contratoId,
    empresaId,
    empresaQ.data,
    empresaQ.isLoading,
    empresaQ.error,
    relacionQ.data,
    relacionQ.isLoading,
    relacionQ.error,
    contratoQ.data,
    contratoQ.isLoading,
    contratoQ.error,
  ]);
}

export type ContratistasContexto = ReturnType<typeof useContratistasContexto>;
