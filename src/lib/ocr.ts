import { API_ENDPOINTS } from "@/config/api";

export const runOcrId = async (imageUrls: string[]) => {
    const payload = {
      option: "ocr_id",
      image_source: imageUrls,
      script_name: "ocr_docs.py",
    };
  
    const userJwt = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.runScript, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await response.json();
    return data;
  };

  export const runOcrPaquete = async (imageUrls: string[]) => {
    const payload = {
      option: "ocr_paquete",
      image_source: imageUrls,
      script_name: "ocr_docs.py",
    };
  
    const userJwt = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.runScript, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await response.json();
    return data;
  };
  
  export const runOcrTruck = async (imageUrls: string[]) => {
    const payload = {
      option: "ocr_truck",
      image_source: imageUrls,
      script_name: "ocr_docs.py",
    };
  
    const userJwt = localStorage.getItem("access_token");
    const response = await fetch(API_ENDPOINTS.runScript, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userJwt}`,
      },
      body: JSON.stringify(payload),
    });
  
    const data = await response.json();
    return data;
  };