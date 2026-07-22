import { API_ENDPOINTS } from "@/config/api";

export interface getCatalogoRolesParams {
  account_id: number;
  isModalOpen?: boolean;
}
export const getCatalogoRoles = async ({
  account_id,
}: getCatalogoRolesParams) => {
  const payload = {
    account_id,
    option: "catalogo_roles",
    script_name: "script_turnos.py",
  };

  const response = await fetch(API_ENDPOINTS.runScript, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data;
};