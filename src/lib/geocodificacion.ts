// Geocodificación de direcciones para los selectores de punto (áreas y
// contactos de ubicaciones). MapQuest va primero porque resuelve el número
// exterior; MapTiler (el de los tiles) solo llega a la calle, pero cubre
// colonias, POIs y autocompletado, así que queda de respaldo.
import osm from "@/app/map-config";
import { catalogoEstados } from "@/lib/utils";

export interface PuntoGeo {
  latitude: number;
  longitude: number;
}

export interface ComponentesDireccion {
  /** Calle y número. */
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
}

export interface ResultadoDireccion {
  id: string;
  nombre: string;
  detalle: string;
  punto: PuntoGeo;
  /** Se ubicó el número exterior, no solo la calle. */
  exacto: boolean;
  componentes: ComponentesDireccion;
}

interface OpcionesBusqueda {
  /** Key de MapTiler (depende de la cuenta, sale de la URL de los tiles). */
  apiKey: string;
  cerca?: PuntoGeo | null;
  /** Código ISO de país en minúsculas ("mx"); vacío o "todos" = cualquiera. */
  pais?: string;
  autocomplete?: boolean;
  /** Tipos de MapTiler ("&types=..."), ya armados. */
  tipos?: string;
  /**
   * Texto distinto para MapQuest. La colonia lo confunde (la toma como calle),
   * así que el modal estructurado le manda solo calle, número, CP, municipio
   * y estado.
   */
  consultaMapquest?: string;
}

const MAPQUEST_URL = "https://www.mapquestapi.com/geocoding/v1";
const MAPTILER_URL = "https://api.maptiler.com/geocoding";

const NOMBRE_PAIS: Record<string, string> = {
  mx: "México",
  do: "República Dominicana",
  us: "Estados Unidos",
};

const unir = (partes: (string | undefined)[], sep = ", ") =>
  partes.map((p) => (p ?? "").trim()).filter(Boolean).join(sep);

const separarNombre = (nombre: string, completo: string) =>
  completo.startsWith(nombre) ? completo.slice(nombre.length).replace(/^,\s*/, "") : completo;

// ---------------------------------------------------------------------------
// MapQuest
// ---------------------------------------------------------------------------

// geocodeQualityCode: los dos primeros caracteres son la granularidad. P1 es
// un punto (POI/edificio) y L1 la dirección con número; B1-B3 es solo la
// calle, y de ahí para arriba colonia, CP, ciudad, estado... El tercero es la
// confianza en la calle (A exacta, B buena, C aproximada).
const esPuntoMapquest = (codigo?: string) => /^(P1|L1)/.test(codigo ?? "");
const esCalleOMejorMapquest = (codigo?: string) => /^(P1|L1|I1|B[123])/.test(codigo ?? "");

// MapQuest pone el número antes de la calle, a la gringa ("318 Calle N9").
const separarNumero = (street: string) => {
  const m = street.match(/^(\d+[A-Za-z]?(?:-\d+)?)\s+(.+)$/);
  return m ? { numero: m[1], calle: m[2] } : { numero: "", calle: street };
};

// "N-9", "n9" y "N 9" cuentan igual.
const palabras = (s: string) =>
  sinAcentos(s).replace(/(\w)-(\w)/g, "$1$2").split(/[^a-z0-9]+/).filter(Boolean);

const GENERICAS = new Set(["calle", "avenida", "av", "blvd", "boulevard", "calzada", "privada", "priv", "carretera", "de", "del", "la", "las", "los", "el"]);

// Con texto ambiguo los dos proveedores regresan casas con número pero de otra
// calle ("318 Apodaca Place" en El Paso al buscar "n9 318 apodaca"), incluso
// MapQuest con confianza A. Es exacto solo si el número escrito coincide y
// todas las palabras propias de la calle aparecen en lo escrito.
const coincideConConsulta = (calle: string, numero: string, consulta: string) => {
  if (!numero) return false;
  const escritas = new Set(palabras(consulta));
  if (!escritas.has(numero.toLowerCase())) return false;
  const propias = palabras(calle).filter((p) => !GENERICAS.has(p));
  return propias.length > 0 && propias.every((p) => escritas.has(p));
};

const aResultadoMapquest = (loc: any, i: number, exacto: boolean): ResultadoDireccion => {
  const { numero, calle } = separarNumero(loc.street ?? "");
  const estado = loc.adminArea3 ?? "";
  const componentes: ComponentesDireccion = {
    calle: unir([calle, numero], " "),
    colonia: loc.adminArea6 ?? "",
    ciudad: loc.adminArea5 || loc.adminArea4 || "",
    // "NL" -> "Nuevo León"; fuera de México se deja como venga.
    estado: estadoDeCatalogo(estado) || estado,
    codigo_postal: loc.postalCode ?? "",
    pais: NOMBRE_PAIS[(loc.adminArea1 ?? "").toLowerCase()] ?? loc.adminArea1 ?? "",
  };
  const nombre = componentes.calle || componentes.colonia || componentes.ciudad;
  const completo = unir([
    componentes.calle,
    componentes.colonia,
    unir([componentes.codigo_postal, componentes.ciudad], " "),
    componentes.estado,
    componentes.pais,
  ]);
  return {
    id: `mq-${i}-${loc.latLng?.lat},${loc.latLng?.lng}`,
    nombre,
    detalle: separarNombre(nombre, completo),
    punto: { latitude: loc.latLng?.lat ?? 0, longitude: loc.latLng?.lng ?? 0 },
    exacto,
    componentes,
  };
};

const ubicacionesMapquest = async (url: string): Promise<any[]> => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.results?.[0]?.locations ?? [];
};

const distancia2 = (a: PuntoGeo, b: PuntoGeo) =>
  (a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2;

// Solo resultados con número: para "solo la calle" MapTiler da lo mismo y,
// cuando MapQuest no encuentra nada, regresa el centro de la ciudad o del
// país, que no sirve.
const buscarMapquest = async (
  consulta: string,
  pais?: string,
  cerca?: PuntoGeo | null,
): Promise<ResultadoDireccion[]> => {
  const key = osm.mapquest.key;
  if (!key) return [];
  const nombrePais = pais && pais !== "todos" ? NOMBRE_PAIS[pais] : "";
  const consultar = (texto: string) =>
    ubicacionesMapquest(
      `${MAPQUEST_URL}/address?key=${key}&location=${encodeURIComponent(unir([texto, nombrePais]))}&maxResults=5&thumbMaps=false`,
    );
  const coincidentes = (locs: any[]) =>
    locs.filter((loc) => {
      const { calle, numero } = separarNumero(loc.street ?? "");
      return esPuntoMapquest(loc.geocodeQualityCode) && coincideConConsulta(calle, numero, consulta);
    });

  const locations = await consultar(consulta);
  let encontrados = coincidentes(locations);

  // Una colonia escrita junto a la calle ("metroplex n9 318") hace que MapQuest
  // tome la colonia como calle. Si no hubo match, se reintenta una vez sin las
  // palabras que resultaron ser colonia en lo que regresó.
  if (!encontrados.length) {
    const deColonias = new Set(palabras(locations.map((loc) => loc.adminArea6 ?? "").join(" ")));
    const escritas = palabras(consulta);
    const reducida = escritas.filter((p) => /\d/.test(p) || !deColonias.has(p));
    if (reducida.length && reducida.length < escritas.length) {
      encontrados = coincidentes(await consultar(reducida.join(" ")));
    }
  }

  const resultados = encontrados.map((loc, i) => aResultadoMapquest(loc, i, true));
  if (cerca) resultados.sort((a, b) => distancia2(a.punto, cerca) - distancia2(b.punto, cerca));
  return resultados;
};

const reverseMapquest = async (punto: PuntoGeo): Promise<ResultadoDireccion | null> => {
  const key = osm.mapquest.key;
  if (!key) return null;
  const [loc] = await ubicacionesMapquest(
    `${MAPQUEST_URL}/reverse?key=${key}&location=${punto.latitude},${punto.longitude}&thumbMaps=false`,
  );
  if (!loc || !esCalleOMejorMapquest(loc.geocodeQualityCode)) return null;
  // En reverse no hay texto contra el cual validar: basta con que traiga número.
  const exacto = esPuntoMapquest(loc.geocodeQualityCode) && !!separarNumero(loc.street ?? "").numero;
  return { ...aResultadoMapquest(loc, 0, exacto), punto };
};

// ---------------------------------------------------------------------------
// MapTiler
// ---------------------------------------------------------------------------

const contexto = (feature: any, tipo: string): string =>
  (feature.context ?? []).find((c: any) => String(c.id ?? "").startsWith(`${tipo}.`))?.text ?? "";

// `consulta`: lo escrito, para validar el número (ver coincideConConsulta).
// Sin ella (reverse) basta con que MapTiler traiga número.
const aResultadoMaptiler = (feature: any, consulta?: string): ResultadoDireccion => {
  const [lng, lat] = feature.center ?? [0, 0];
  const nombre: string = feature.text || feature.place_name || "";
  const completo: string = feature.place_name || nombre;
  const numero: string = feature.address ?? "";
  const esCalle = (feature.place_type ?? []).includes("address");
  return {
    id: feature.id ?? completo,
    nombre: numero ? `${nombre} ${numero}` : nombre,
    detalle: separarNombre(numero ? `${nombre} ${numero}` : nombre, completo),
    punto: { latitude: lat, longitude: lng },
    exacto: consulta === undefined ? !!numero : coincideConConsulta(nombre, numero, consulta),
    componentes: {
      calle: esCalle ? unir([nombre, numero], " ") : "",
      colonia: contexto(feature, "neighbourhood"),
      ciudad: contexto(feature, "municipality") || contexto(feature, "place") || contexto(feature, "locality"),
      estado: contexto(feature, "region"),
      codigo_postal: contexto(feature, "postal_code"),
      pais: contexto(feature, "country"),
    },
  };
};

const buscarMaptiler = async (consulta: string, opciones: OpcionesBusqueda): Promise<ResultadoDireccion[]> => {
  const { apiKey, cerca, pais, autocomplete = false, tipos = "" } = opciones;
  const filtroPais = pais && pais !== "todos" ? `&country=${pais}` : "";
  const proximity = cerca ? `&proximity=${cerca.longitude},${cerca.latitude}` : "";
  const res = await fetch(
    `${MAPTILER_URL}/${encodeURIComponent(consulta)}.json?key=${apiKey}&autocomplete=${autocomplete}&limit=8&language=es${filtroPais}${tipos}${proximity}`,
  );
  const data = await res.json();
  return (data?.features ?? []).map((feature: any) => aResultadoMaptiler(feature, consulta));
};

const reverseMaptiler = async (punto: PuntoGeo, apiKey: string): Promise<ResultadoDireccion | null> => {
  const res = await fetch(
    `${MAPTILER_URL}/${punto.longitude},${punto.latitude}.json?key=${apiKey}&language=es&limit=1`,
  );
  const data = await res.json();
  const feature = data?.features?.[0];
  return feature ? { ...aResultadoMaptiler(feature), punto } : null;
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Busca una dirección escrita. Los resultados exactos de MapQuest van primero,
 * luego los de MapTiler. MapQuest solo se consulta si el texto trae algún
 * número: sin número exterior no puede ganarle a MapTiler y así el
 * autocompletado no gasta cuota en cada tecla.
 */
export const buscarDirecciones = async (
  consulta: string,
  opciones: OpcionesBusqueda,
): Promise<ResultadoDireccion[]> => {
  const consultaMapquest = opciones.consultaMapquest ?? consulta;
  const conMapquest = /\d/.test(consultaMapquest);
  const [mapquest, maptiler] = await Promise.all([
    conMapquest
      ? buscarMapquest(consultaMapquest, opciones.pais, opciones.cerca).catch(() => [])
      : Promise.resolve([]),
    buscarMaptiler(consulta, opciones).catch(() => []),
  ]);
  // MapTiler a veces repite un feature (mismo id) y las listas usan el id de
  // key; también se quitan los que se leen igual (mismo texto, misma precisión).
  const vistos = new Set<string>();
  return [...mapquest, ...maptiler].filter((r) => {
    const texto = `${r.exacto}|${textoResultado(r)}`;
    if (vistos.has(r.id) || vistos.has(texto)) return false;
    vistos.add(r.id);
    vistos.add(texto);
    return true;
  });
};

/** Dirección del punto elegido en el mapa (clic, arrastre, GPS, coordenadas). */
export const direccionDePunto = async (punto: PuntoGeo, apiKey: string): Promise<ResultadoDireccion | null> => {
  const mapquest = await reverseMapquest(punto).catch(() => null);
  if (mapquest) return mapquest;
  return reverseMaptiler(punto, apiKey).catch(() => null);
};

/** Texto completo de un resultado ("Calle 123, Colonia, CP Ciudad, ..."). */
export const textoResultado = (r: ResultadoDireccion) => unir([r.nombre, r.detalle]);

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

// Abreviaturas que regresan los geocodificadores (ISO 3166-2:MX y las de uso
// común) contra los nombres de catalogoEstados().
const ABREVIATURAS_ESTADO: Record<string, string> = {
  ags: "Aguascalientes", agu: "Aguascalientes", bc: "Baja California", bcn: "Baja California",
  bcs: "Baja California Sur", camp: "Campeche", cam: "Campeche", chis: "Chiapas", chp: "Chiapas",
  chih: "Chihuahua", chh: "Chihuahua", cdmx: "Ciudad de México", cmx: "Ciudad de México",
  df: "Ciudad de México", "distrito federal": "Ciudad de México", coah: "Coahuila", coa: "Coahuila",
  col: "Colima", dgo: "Durango", dur: "Durango", gto: "Guanajuato", gua: "Guanajuato",
  gro: "Guerrero", hgo: "Hidalgo", hid: "Hidalgo", jal: "Jalisco", mex: "México",
  edomex: "México", "edo mex": "México", "estado de mexico": "México", mich: "Michoacán", mic: "Michoacán",
  mor: "Morelos", nay: "Nayarit", nl: "Nuevo León", nle: "Nuevo León", oax: "Oaxaca",
  pue: "Puebla", qro: "Querétaro", que: "Querétaro", qroo: "Quintana Roo", "q roo": "Quintana Roo", roo: "Quintana Roo",
  slp: "San Luis Potosí", sin: "Sinaloa", son: "Sonora", tab: "Tabasco", tamps: "Tamaulipas",
  tam: "Tamaulipas", tlax: "Tlaxcala", tla: "Tlaxcala", ver: "Veracruz", yuc: "Yucatán",
  zac: "Zacatecas",
};

/**
 * Nombre del estado tal como está en catalogoEstados(), para el select de
 * contactos. Acepta abreviaturas y nombres oficiales largos ("Coahuila de
 * Zaragoza", "Veracruz de Ignacio de la Llave"). Vacío si no hay match.
 */
export const estadoDeCatalogo = (estado: string): string => {
  const buscado = sinAcentos(estado);
  if (!buscado) return "";
  if (ABREVIATURAS_ESTADO[buscado]) return ABREVIATURAS_ESTADO[buscado];
  const catalogo = catalogoEstados();
  return (
    catalogo.find((e) => sinAcentos(e) === buscado) ??
    // El más largo primero: "Baja California Sur" antes que "Baja California".
    [...catalogo].sort((a, b) => b.length - a.length).find((e) => buscado.startsWith(sinAcentos(e))) ??
    ""
  );
};
