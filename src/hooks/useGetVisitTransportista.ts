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
  peso: string | null;
  volumen: string | null;
}

interface RawRecord {
  _id: string;
  folio: string | null;
  estatus: string | null;
  tipo_de_operacion: string | null;
  created_at: string | null;
  fecha_hora_ingreso: string | null;
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
  inspecciones: { tipo: string; unidad?: number; url?: string }[];
}

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
    estatus: raw.estatus,
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
    materiales: (raw.materiales ?? []).map((m) => ({
      lugar:          m.lugar,
      no_referencia:  m.no_referencia,
      producto:       m.producto,
      lote:           m.lote,
      cantidad:       m.cantidad,
      cantidad_fisica: m.cantidad_fisica,
      peso:           m.peso,
      volumen:        m.volumen,
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

export interface MaterialVisita {
  lugar:           string | null;
  no_referencia:   string | null;
  producto:        string | null;
  lote:            string | null;
  cantidad:        string | null;
  cantidad_fisica: string | null;
  peso:            string | null;
  volumen:         string | null;
}

export interface VisitaTransportista {
  id: string;
  folio: string | null;
  tipo_operacion: string | null;
  created_at: string | null;
  estatus: string | null;
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
