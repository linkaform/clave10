import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { ApiResponse } from "@/types/api";

export const getBitacoraFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "in_and_out",
    public_script: true,
  });

export const getRecorridosFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "recorridos",
    public_script: true,
  });

export const getRondinesFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "rondines",
    public_script: true,
  });

export const getCheckAreasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "check_areas",
    public_script: true,
  });

export const getIncidenciasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "incidencias",
    public_script: true,
  });

export const getIncidenciasRondinesFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "incidencias_rondines",
    public_script: true,
  });

    
export const getFallasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "fallas",
    public_script: true,
  });

export const getPasesFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "pases",
    public_script: true,
  });

export const getMenus = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "menus.py",
    option: "get_menus",
  });

export const getPaqueteriaFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "paqueteria",
    public_script: true,
  });

export const getConcesionadosFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "concesionados",
    public_script: true,
  });

export const getPerdidosFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "perdidos",
    public_script: true,
  });

export const getNotasFilters = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "filters.py",
    option: "notas",
    public_script: true,
  });

export const createPaseTransportista = (payload: unknown) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "create_pass_transportista",
    payload,
  });

export const getHorariosData = (dia?: number) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_horarios_data",
    ...(dia !== undefined && { dia }),
  });

export const getAndenes = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_andenes",
  });

export const getPassTransportista = (record_id: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_pass_transportista",
    record_id,
  }, {}, true);

export const getPassTransportistaByToken = (token: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_pass_transportista",
    token,
  }, {}, true);

export const generateSubmitTokenTransportista = (record_id: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "generate_submit_token_transportista",
    record_id,
  }, {}, true);
