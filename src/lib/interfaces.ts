export interface AccessPass {
    nombre: string;
    visita_a: string[];
    empresa: string;
    ubicaciones: string[];
    num_accesos: number;
    fecha_desde: string;
    fecha_hasta: string;
    geolocations: {
        latitude: number;
        longitude: number;
    }[];
}