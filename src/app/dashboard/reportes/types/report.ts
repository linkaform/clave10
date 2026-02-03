export interface asistenciasReport {
    enabled?: boolean;
    dateRange: string;
    locations: string[];
    groupBy: string;
    month?: number;
    year?: number;
}