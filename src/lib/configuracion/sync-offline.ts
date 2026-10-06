import { API_ENDPOINTS } from "@/config/api";
import { getValidToken } from "@/lib/login/get-valid-token";

export const syncOffline = async (records: unknown[] = []) => {
  const payload = {
    option: "sync",
    records,
    script_name: "offline_services.py",
  };
  const userJwt = await getValidToken();

  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userJwt}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
};
