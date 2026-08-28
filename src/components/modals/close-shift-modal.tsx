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
import { Loader2, ShieldCheck } from "lucide-react";
import { useTurnoRoles } from "@/hooks/useTurnoRoles";
import useAuthStore from "@/store/useAuthStore";

interface CloseShiftModalProps {
  title: string;
  // children: React.ReactNode;
  shift: any;
  area: string;
  location: string;
  identificacion: Imagen[];
  roles: string[];
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  checkin_id?: string;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  title,
  // children,
  area,
  location,
  identificacion,
  roles,
  open,
  setOpen,
  checkin_id,
}) => {
  const { mutate, isPending } = useCloseShift();
  const { userIdSoter } = useAuthStore();
  const { rolesDisponibles } = useTurnoRoles(open, userIdSoter);
  console.log("roles",roles)
  const rolesConLabel = (roles ?? []).map((r) => {
    const match = rolesDisponibles.find(
      (rol: any) => (rol.value ?? rol.id ?? rol) === r,
    );
    return {
      value: r,
      label: (match as any)?.label ?? (match as any)?.nombre ?? r,
    };
  });

  return (
    <Dialog open={open} onOpenChange={setOpen} modal>
      {/* <DialogTrigger asChild>{children}</DialogTrigger> */}

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-16 mb-5">
          <p className="text-center mb-5">
            Estás a punto de cerrar el turno en la{" "}
            <span className="font-semibold">{area}</span> de la{" "}
            <span className="font-semibold">{location}</span>. ¿Deseas
            continuar?
          </p>

          <div className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Estás cerrando turno como
            </label>
            {rolesConLabel.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {rolesConLabel.map((r) => (
                  <span
                    key={r.value}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {r.label}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Sin roles asignados</span>
            )}
          </div>
        </div>

        <div className="flex gap-5">
          <DialogClose asChild>
            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancelar
            </Button>
          </DialogClose>

          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isPending}
            onClick={() =>
              mutate(
                {
                  fotografia: identificacion,
                  roles: rolesConLabel.map((r) => r.label),
                  checkin_id: checkin_id,
                },
                {
                  onSuccess: () => {
                    setOpen(false);
                  },
                },
              )
            }
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" /> {"Cerrando Turno..."}
              </>
            ) : (
              <>{"Confirmar"}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};