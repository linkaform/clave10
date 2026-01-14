interface Props {
    area?: string;
    location?: string;
    guards: number[]; // Array de IDs de los guardias
    checkin_id?: string;
    guard_id?: number;
}
  
  export const checkoutSupportGuards = async ({
    area = "Caseta Principal",
    location = "Planta Monterrey",
    guards,
    checkin_id,
    guard_id,
  }: Props) => {
    const payload = {
      area,
      location, 
      guards,
      checkin_id,
      guard_id,
      option: "checkout",
      script_name: "script_turnos.py",
    };
  
    const userJwt = localStorage.getItem("access_token");
  
    const response = await fetch(`https://app.linkaform.com/api/infosync/scripts/run/`, {
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
  