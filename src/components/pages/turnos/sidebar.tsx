"use client"
import { ChangeBoothModal } from "@/components/modals/change-booth-modal";
import { NombreSuplenteModal } from "@/components/modals/nombre-suplente";
import { SuplenteItem } from "@/components/suplente-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeUserPhoto, changeUserPhotoPatch } from "@/lib/change-user-photo";
import { capitalizeOnlyFirstLetter } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { useBoothStore } from "@/store/useBoothStore";
import React , { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

const Sidebar = ({shift, nombreSuplente, setNombreSuplente, onSuplenteConfirmado}: {shift:any, nombreSuplente:string, setNombreSuplente: Dispatch<SetStateAction<string>>, onSuplenteConfirmado:()=>void}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { userEmailSoter, userNameSoter, userPhoto, userIdSoter , setUserPhoto} = useAuthStore();
  const [openNombreSuplenteModal, setOpenNombreSuplenteModal] = useState(false)
  
  const location = useBoothStore((state) => state.location);
  const area = useBoothStore((state) => state.area);
  const getInitials = (name: string | null) => {
    if (!name) return "N/A";
    return name
      .split(" ") 
      .map((word) => word[0])
      .join("")
      .toUpperCase(); 
  };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event:any) => {
      const file = event.target.files[0];
      if (file) {
        const res= await changeUserPhoto( userIdSoter, file);
        if(res.thumb){
          const response= await changeUserPhotoPatch( userIdSoter, res.thumb);
          if(response){
            setUserPhoto(`${res.thumb}?t=${Date.now()}`);
            toast.success("Foto de perfil cambiada correctamente")
          }
        }
      }
    };

  return (
    <div className="max-w-[520px]  lg:max-w-[320px] mx-auto">
      <div className="flex  flex-col space-y-5 mb-10 ">
        <Avatar className="w-32 h-32 mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.2)] rounded-full overflow-hidden">
          <AvatarImage
           className="object-contain "
            width="300"
            height="300"
            src={userPhoto ?? "/nouser.svg"}
            alt="Avatar"
          />
          <AvatarFallback>{getInitials(userNameSoter)}</AvatarFallback>
        </Avatar>

        <div className="">


          <p className="font-bold text-2xl">{userNameSoter}</p>
          <p className="font-bold">{shift?.guard?.position}</p>
          <p className="">{userEmailSoter}</p>
        </div>
 
        <Input 
          type="file" 
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={handleButtonClick}>
          Cambiar Imagen
        </Button>
      </div>

      <div className="flex flex-col space-y-5 mb-10">
        <div className="flex">
          <div className="w-full">
            <p>Ubicación:</p>
            <p className="font-bold">{location || "---"}</p>{" "}
          </div>

          <div className="w-full">
            <p>Ciudad:</p>
            <p className="font-bold">{shift?.location?.city || "---"}</p>
          </div>
        </div>

        <div className="flex">
          <div className="w-full">
            <p>Estado:</p>
            <p className="font-bold">{shift?.location?.state || "---"}</p>
          </div>

          <div className="w-full">
            <p>Dirección:</p>
            <p className="font-bold">{shift?.location?.address || "---"}</p>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="w-full">
            <p>Caseta:</p>
            <p className="font-bold">{area || "---"}</p>
          </div>
        </div>

        <ChangeBoothModal title="Cambiar caseta">
        <Button
          className="w-full bg-blue-500 text-white hover:bg-blue-600"
          disabled={
            shift?.guard?.status_turn == "Turno Abierto" ||
            !!shift?.guard?.config_exception
          }
        >
          Cambiar Caseta
        </Button>
      </ChangeBoothModal>

          <Button
            className="w-full  bg-violet-600 text-white hover:bg-violet-700"
            disabled={shift?.guard?.status_turn !== "Turno Cerrado"}
            onClick={()=>{setOpenNombreSuplenteModal(true)}}
          >
            Ingresar como suplente
          </Button>

          <NombreSuplenteModal title={"Suplente"} nombreSuplente={nombreSuplente} setNombreSuplente={setNombreSuplente} onSuplenteConfirmado={onSuplenteConfirmado} open={openNombreSuplenteModal} setOpen={setOpenNombreSuplenteModal}
          mode={"create"}/>

          { nombreSuplente && (
            <SuplenteItem
              turno={shift?.guard?.status_turn}
              nombreSuplente={nombreSuplente}
              setNombreSuplente={setNombreSuplente}
            />
          )}

      </div>
      <div className="flex  flex-col space-y-5 mb-10">
     
        <div className="">
          <p>Estatus de la caseta:</p>

          <Badge
            className={`text-white  text-md hover:${shift?.booth_status?.status === "Abierta"? 'bg-green-600':'bg-red-600'} ${
              shift?.booth_status?.status === "Abierta"
                ? "bg-green-600"
                : "bg-red-600"
            }`}
          >
            { capitalizeOnlyFirstLetter(shift?.booth_status?.status)}
          </Badge>
        </div>
       
        {shift?.booth_status?.status === "Abierta" && (
          <>
            <div className="">
              <p className="">Inició el guardia:</p>
              <p className="font-bold">{shift?.booth_status?.guard_on_dutty || "---"}</p>
            </div>
            <div className="">
              <p className="">Fecha de apertura:</p>
              <div className="flex justify-between">
                <p className="font-bold">{shift?.booth_status?.stated_at || "---"}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
