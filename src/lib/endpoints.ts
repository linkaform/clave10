import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "./login/get-valid-token";

export const getAreasByLocations = async (locations: string[]) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({
      script_name: "pase_de_acceso.py",
      option: "get_areas_by_locations",
      locations,
    }),
  });
  const data = await response.json();
  return data;
};

export const forceQuitAllPersons = async (location: string | string[]) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({
      script_name: "script_turnos.py",
      option: "force_quit_all_persons",
      location,
    }),
  });
  const data = await response.json();
  return data;
};

export const getGoogleWalletPassUrl = async (
  account_id: number,
  qr_code: string,
) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({
      script_name: "create_pass_google_wallet.py",
      account_id,
      qr_code,
    }),
  });
  const data = await response.json();
  return data;
};

export const getImgPassUrl = async (account_id: number, qr_code: string) => {
  const userJwt = await getValidToken();
  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify({
      script_name: "pase_de_acceso_use_api.py",
      option: "get_pass_img",
      account_id,
      qr_code,
    }),
  });
  const data = await response.json();
  return data;
};
