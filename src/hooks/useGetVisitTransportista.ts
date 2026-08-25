import { useQuery } from "@tanstack/react-query";
import { getBitacoraTransportistaRecord } from "@/services/endpoints";

interface RawDocumento {
  tipo: string;
  documento: { file_url: string; file_name: string }[];
}

interface RawRemolque {
  tipo_remolque: string | null;
  no_sello: string | null;
  no_caja: string | null;
  placas_caja: string | null;
  color: string | null;
  comentarios: string | null;
  no_referencia_remolque?: string | null; // presente solo en contenedores
}

interface RawMaterial {
  lugar: string | null;
  no_referencia: string | null;
  producto: string | null;
  lote: string | null;
  cantidad: string | null;
  cantidad_fisica: string | null;
  cantidad_buena: string | null;
  cantidad_danada: string | null;
  cantidad_faltante: string | null;
  peso: string | null;
  volumen: string | null;
}

interface RawDesgloseRenglon {
  no_referencia_material: string | null; // índice del material en grupo_materiales, como string
  nivel: string | null;
  tipo_unidad_empaque: string | null;
  cantidad: string | null;
  cantidad_acumulada: string | null;
}

interface RawRecord {
  _id: string;
  folio: string | null;
  estatus: string | null;
  tipo_de_operacion: string | null;
  created_at: string | null;
  fecha_hora_ingreso: string | null;
  ubicacion: string | null;
  area: string | null;
  empresa_transportista: string | null;
  procedencia: string | null;
  tipo_de_vehiculo: string | null;
  placas_de_vehiculo: string | null;
  placas_de_vehiculo_tarjeta_circulacion: string | null;
  anden_asignado: string | null;
  num_eco_num_rotulo: string | null;
  marca_vehiculo: string | null;
  year_vehiculo: string | null;
  color_vehiculo: string | null;
  conductor: string | null;
  num_licencia: string | null;
  proveedor_cliente: string | null;
  orden_de_compra: string | null;
  file_url: string | null;
  file_name: string | null;
  documentos: RawDocumento[];
  remolques: RawRemolque[];
  materiales: RawMaterial[];
  desglose_empaque: RawDesgloseRenglon[];
  inspecciones: { tipo: string; unidad?: number; url?: string }[];
}

// Los campos de cantidad son "texto" en la forma, pero Linkaform/Mongo
// a veces los regresa como número (ej. 10.0) cuando el valor guardado es
// puramente numérico — normalizamos a string para que el resto del código
// (inputs controlados, .trim()) no truene por un tipo inesperado.
const strOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

function mapRecord(raw: RawRecord): VisitaTransportista {
  const findDoc = (tipo: string) =>
    raw.documentos?.find((d) => d.tipo.toUpperCase() === tipo.toUpperCase())?.documento?.[0] ?? null;

  const documentos_adicionales = (raw.documentos ?? [])
    .flatMap((d) => (Array.isArray(d.documento) ? d.documento : d.documento ? [d.documento] : [])
      .map((f) => ({ ...f, tipo: d.tipo })));

  return {
    id: raw._id,
    folio: raw.folio,
    tipo_operacion: raw.tipo_de_operacion,
    created_at: raw.created_at,
    fecha_hora_ingreso: raw.fecha_hora_ingreso,
    estatus: raw.estatus,
    ubicacion: raw.ubicacion,
    area: raw.area,
    vehiculo: {
      transportista: raw.empresa_transportista,
      procedencia: raw.procedencia,
      tipo_vehiculo: raw.tipo_de_vehiculo,
      placa: raw.placas_de_vehiculo,
      placa_tarjeta_circulacion: raw.placas_de_vehiculo_tarjeta_circulacion,
      no_economico: raw.num_eco_num_rotulo,
      marca: raw.marca_vehiculo,
      modelo: raw.year_vehiculo ? `${raw.year_vehiculo}` : null,
      color: raw.color_vehiculo,
      material: null,
      foto_placa: findDoc("FOTO PLACA"),
    },
    conductor: {
      nombre: raw.conductor,
      no_licencia: raw.num_licencia,
      vigencia_licencia: null,
      rfc: null,
      acompanante: null,
      foto_conductor: findDoc("FOTO CONDUCTOR"),
      foto_licencia: findDoc("LICENCIA CONDUCIR"),
      firma: raw.file_url ? { file_url: raw.file_url } : null,
    },
    documentos_adicionales,
    remolques: (raw.remolques ?? []).map((r) => ({
      tipo_remolque:          r.tipo_remolque,
      no_sello:               r.no_sello,
      no_caja:                r.no_caja,
      placas_caja:            r.placas_caja,
      color:                  r.color,
      comentarios:            r.comentarios,
      no_referencia_remolque: r.no_referencia_remolque ?? null,
    })),
    materiales: (raw.materiales ?? []).map((m, matIdx) => ({
      lugar:           m.lugar,
      no_referencia:   m.no_referencia,
      producto:        m.producto,
      lote:            m.lote,
      cantidad:        strOrNull(m.cantidad),
      cantidad_fisica: strOrNull(m.cantidad_fisica),
      cantidad_buena:  strOrNull(m.cantidad_buena),
      cantidad_danada: strOrNull(m.cantidad_danada),
      cantidad_faltante: strOrNull(m.cantidad_faltante),
      peso:            m.peso,
      volumen:         m.volumen,
      // no_referencia_material del desglose guarda el índice del material (ver desglose-materiales-modal.tsx)
      desglose: (raw.desglose_empaque ?? [])
        .filter((d) => Number(d.no_referencia_material) === matIdx)
        .sort((a, b) => Number(a.nivel ?? 0) - Number(b.nivel ?? 0))
        .map((d) => ({
          nivel:               d.nivel ? Number(d.nivel) : null,
          tipo_unidad_empaque: d.tipo_unidad_empaque,
          cantidad:            strOrNull(d.cantidad),
          cantidad_acumulada:  strOrNull(d.cantidad_acumulada),
        })),
    })),
    embarque: {
      proveedor_cliente: raw.proveedor_cliente,
      no_orden_compra:   raw.orden_de_compra,
      anden_asignado:    raw.anden_asignado,
    },
    inspecciones: (raw.inspecciones ?? []).map((ins) => ({
      tipo:   ins.tipo,
      unidad: ins.unidad,
      url:    ins.url,
    })),
  };
}

export interface RemolqueVisita {
  tipo_remolque:          string | null;
  no_sello:               string | null;
  no_caja:                string | null;
  placas_caja:            string | null;
  color:                  string | null;
  comentarios:            string | null;
  no_referencia_remolque?: string | null;
}

export interface DesgloseRenglonVisita {
  nivel:               number | null;
  tipo_unidad_empaque: string | null;
  cantidad:            string | null;
  cantidad_acumulada:  string | null;
}

export interface MaterialVisita {
  lugar:           string | null;
  no_referencia:   string | null;
  producto:        string | null;
  lote:            string | null;
  cantidad:        string | null;
  cantidad_fisica: string | null;
  cantidad_buena:  string | null;
  cantidad_danada: string | null;
  cantidad_faltante: string | null;
  peso:            string | null;
  volumen:         string | null;
  desglose:        DesgloseRenglonVisita[];
}

export interface VisitaTransportista {
  id: string;
  folio: string | null;
  tipo_operacion: string | null;
  created_at: string | null;
  fecha_hora_ingreso: string | null;
  estatus: string | null;
  ubicacion: string | null;
  area: string | null;
  vehiculo: {
    transportista: string | null;
    procedencia: string | null;
    tipo_vehiculo: string | null;
    placa: string | null;
    placa_tarjeta_circulacion: string | null;
    material: string | null;
    no_economico: string | null;
    marca: string | null;
    modelo: string | null;
    color: string | null;
    foto_placa: { file_url: string; file_name: string } | null;
  } | null;
  conductor: {
    nombre: string | null;
    no_licencia: string | null;
    vigencia_licencia: string | null;
    rfc: string | null;
    acompanante: string | null;
    foto_conductor: { file_url: string } | null;
    foto_licencia: { file_url: string } | null;
    firma: { file_url: string } | null;
  } | null;
  embarque?: {
    proveedor_cliente: string | null;
    no_orden_compra: string | null;
    anden_asignado: string | null;
  } | null;
  remolques: RemolqueVisita[];
  materiales: MaterialVisita[];
  documentos_adicionales?: { file_url: string; file_name: string; tipo?: string }[];
  inspecciones: { tipo: string; unidad?: number; url?: string }[];
}

export const useGetVisitTransportista = (id: string) => {
  const { data, isLoading, error, refetch } =
    useQuery<VisitaTransportista | null>({
      queryKey: ["visitaTransportista", id],
      queryFn: async () => {
        const res = await getBitacoraTransportistaRecord(id);
        const raw = res?.response?.data as RawRecord | null;
        return raw ? mapRecord(raw) : null;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });

  return { data: data ?? null, isLoading, error, refetch };
};
