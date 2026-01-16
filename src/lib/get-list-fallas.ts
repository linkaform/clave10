import { API_ENDPOINTS } from "@/config/api";

export const getListFallas = async (
    location:string, area:string,status:string,  dateFrom:string, dateTo:string, filterDate:string) => {
    const payload = {
        dateFrom, 
        dateTo, 
        filterDate,
        area:area,
        location: location,
        status:status,
        option: "get_failures",
        script_name: "fallas.py",
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
  