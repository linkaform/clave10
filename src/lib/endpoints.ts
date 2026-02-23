import { API_ENDPOINTS } from "@/config/api";

export const getAreasByLocations = async (locations: string[]) => {
    const userJwt = localStorage.getItem("access_token");
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

export const forceQuitAllPersons = async (location: string) => {
    const userJwt = localStorage.getItem("access_token");
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

export const getGoogleWalletPassUrl = async (qr_code: string) => {
    const userJwt = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({
            script_id: 146540,
            qr_code,
        }),
    });
    const data = await response.json();
    return data;
};

export const getImgPassUrl = async (qr_code: string) => {
    const userJwt = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({
            script_name: "pase_de_acceso_use_api.py",
            option: "get_pass_img",
            qr_code,
        }),
    });
    const data = await response.json();
    return data;
};
