import { apiPost } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { ApiResponse } from "@/types/api";
import useAuthStore from "@/store/useAuthStore";

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

export const getPassTransportista = (record_id: string, account_id?: number | string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_pass_transportista",
    record_id,
    ...(account_id !== undefined && { account_id }),
  });

export const getPassTransportistaByToken = (token: string, account_id?: number | string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_pass_transportista",
    token,
    ...(account_id !== undefined && { account_id }),
  });

export const generateSubmitTokenTransportista = (record_id: string, account_id?: number | string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "generate_submit_token_transportista",
    record_id,
    ...(account_id !== undefined && { account_id }),
  });

export const validateTokenTransportista = (record_id: string, token: string, account_id?: number | string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "validate_token",
    record_id,
    token,
    ...(account_id !== undefined && { account_id }),
  });

export const getLocationData = (location: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_location_data",
    location,
  });

export const getUsersDataTransportista = (location?: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_users_data",
    ...(location && { location }),
  });

export const getProveedoresTransportista = () =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_proveedores_transportista",
  });

export const updateInformationTransportista = (payload: unknown, account_id?: number | string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "update_information_transportista",
    payload,
    ...(account_id !== undefined && { account_id }),
  });

export const createVisitTransportista = (payload: unknown) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "create_visit_transportista",
    account_id: useAuthStore.getState().userParentId,
    payload,
  });

export const ocrAccesoTransportista = (image_source: { file_url: string; file_name: string }[]) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "ocr_docs_2.py",
    option: "ocr_acceso_transportista",
    image_source,
  });

export const saveDataTransportista = (payload: unknown) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "save_data_transportista",
    account_id: useAuthStore.getState().userParentId,
    payload,
  });

export const getBitacoraTransportistaRecord = (record_id: string) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "get_bitac_transportista_record",
    record_id,
  });

export const saveBitacoraTransportistaRecord = (record_id: string, seccion: string, payload: unknown) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "save_bitac_transportista_record",
    record_id,
    seccion,
    payload,
  });

export const saveInspeccionesTransportista = (record_id: string, inspecciones: unknown[]) =>
  apiPost<ApiResponse>(API_ENDPOINTS.runScript, {
    script_name: "transportistas.py",
    option: "save_inspecciones",
    record_id,
    inspecciones,
  });
