import { useQuery } from "@tanstack/react-query";
import { getFotografiasTransportista } from "@/services/endpoints";
import { FotoGaleria } from "@/components/modals/galeria-fotos-modal";

export interface RegistroFotografias {
  record_id: string;
  tipo_de_registro: string;
}

const KIND_LABELS: Record<string, string> = {
  bitacora: "Documentos",
  tractor: "Tractor",
  remolque: "Remolque",
  contenedor: "Contenedor",
  sello: "Sello",
};

function labelFromTipoRegistro(tipo: string): string {
  const isSalida = tipo.startsWith("salida_");
  const base = tipo.replace(/^salida_/, "");
  const match = base.match(/^(tractor|remolque|contenedor|sello)(?:_(\d+))?$/);
  if (!match) return KIND_LABELS[base] ?? base;
  const [, kind, num] = match;
  const kindLabel = KIND_LABELS[kind] ?? kind;
  const unidadLabel = num ? ` · Unidad ${num}` : "";
  return `${isSalida ? "Salida · " : ""}${kindLabel}${unidadLabel}`;
}

// extractId(url) extrae el _id de Mongo de la url de la inspección — mismo
// criterio que useGetInspeccionRecord.ts, ya que get_fotografias espera el
// _id resuelto, no la url completa.
function extractId(url: string): string {
  return url.split("/").filter(Boolean).pop() ?? url;
}

export function buildRegistrosFotografias(
  bitacoraId: string,
  inspecciones: { tipo: string; unidad?: number; url?: string }[],
): RegistroFotografias[] {
  const registros: RegistroFotografias[] = [{ record_id: bitacoraId, tipo_de_registro: "bitacora" }];
  for (const ins of inspecciones) {
    if (!ins.url) continue;
    registros.push({ record_id: extractId(ins.url), tipo_de_registro: ins.tipo });
  }
  return registros;
}

const isImagen = (fileName: string): boolean => /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(fileName);

export const useGetFotografiasTransportista = (registros: RegistroFotografias[]) => {
  const { data, isLoading, error } = useQuery<FotoGaleria[]>({
    queryKey: ["fotografiasTransportista", registros],
    queryFn: async () => {
      const res = await getFotografiasTransportista(registros);
      const items = (res?.response?.data ?? []) as {
        record_id: string;
        tipo_de_registro: string;
        fotografias: { file_name: string; file_url: string }[];
      }[];
      return items.flatMap((item) =>
        (item.fotografias ?? [])
          .filter((f) => isImagen(f.file_name))
          .map((f) => ({
            ...f,
            tipo: labelFromTipoRegistro(item.tipo_de_registro),
          })),
      );
    },
    enabled: registros.length > 0,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return { fotos: data ?? [], isLoading, error };
};
