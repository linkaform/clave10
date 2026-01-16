const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL no está definida");
}

export const API_ENDPOINTS = {
    runScript: `${API_BASE_URL}/clave10/scripts/run/`,
};
