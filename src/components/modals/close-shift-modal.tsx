/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "../ui/dialog";
import { useCloseShift } from "@/hooks/useGetShift";
import { Dispatch, SetStateAction } from "react";
import { Imagen } from "../upload-Image";
import { Loader2 } from "lucide-react";

interface CloseShiftModalProps {
  title: string;
  // children: React.ReactNode;
  shift: any;
  area: string;
  location: string;
  identificacion: Imagen[];
  open:boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  checkin_id?: string;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  title,
  // children,
  area,
  location,
  identificacion,
  open,
  setOpen,
  checkin_id
}) => {
  const { mutate, isPending } = useCloseShift();
  
  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      {/* <DialogTrigger asChild>{children}</DialogTrigger> */}

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center  font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-16 mb-5">
          <p className="text-center mb-5">
            Estás a punto de cerrar el turno en la{" "}
            <span className="font-semibold">{area}</span> de la {" "}
            <span className="font-semibold">{location}</span>
            . ¿Deseas continuar?
          </p>
        </div>

        <div className="flex gap-5">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            className="w-full  bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isPending}
            onClick={() => mutate({fotografia:identificacion, checkin_id:checkin_id},{
              onSuccess:()=>{
                setOpen(false)
              }
            })}
          >
            {isPending? <> <Loader2 className="animate-spin"/> {"Cerrando Turno..."} </>: <> {"Confirmar"}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};