/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useGuardSelectionStore } from "@/store/useGuardStore";
import { useStartShift } from "@/hooks/useGetShift";
import { Dispatch, SetStateAction } from "react";
import { Imagen } from "../upload-Image";
import { Loader2, ShieldCheck } from "lucide-react";
import { useBoothStore } from "@/store/useBoothStore";
import { useTurnoRoles } from "@/hooks/useTurnoRoles";
import useAuthStore from "@/store/useAuthStore";

interface StartShiftModalProps {
  title: string;
  evidencia: Imagen[];
  roles: string[];
  open: boolean;
  nombreSuplente: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  checkin_id?: string;
}

export const StartShiftModal: React.FC<StartShiftModalProps> = ({
  title,
  // children,
  nombreSuplente,
  evidencia,
  roles,
  open,
  setOpen,
  checkin_id,
}) => {
  const { area, location } = useBoothStore();

  const { selectedGuards } = useGuardSelectionStore();

  const { mutate, isPending } = useStartShift();

  const { userIdSoter } = useAuthStore();
  const { rolesDisponibles } = useTurnoRoles(open, userIdSoter);

  const rolesConLabel = (roles ?? []).map((r) => {
    const match = rolesDisponibles.find(
      (rol: any) => (rol.value ?? rol.id ?? rol) === r,
    );
    return {
      value: r,
      label: (match as any)?.label ?? (match as any)?.nombre ?? r,
    };
  });

  const guardNames = selectedGuards
    ?.map((guardia: { name: string }) => guardia.name)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* <DialogTrigger asChild>{children}</DialogTrigger> */}

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-16 mb-5">
          <p className="text-center mb-5">
            ¿Desea iniciar el turno en la ubicación{" "}
            <span className="font-semibold">{area}</span> en la
            <span className="font-semibold"> {location}</span>
            {guardNames?.length > 0 ? (
              <>
                {"  "}con los siguientes guardias{" "}
                <span className="font-semibold">{guardNames}</span>?
              </>
            ) : (
              "?"
            )}
          </p>

          <div className="flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Vas a abrir turno como
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
            onClick={() => {
              const formattedGuards = selectedGuards?.map(
                (guard: { user_id: number; name: string }) => ({
                  user_id: guard.user_id,
                  name: guard.name,
                }),
              );

              mutate(
                {
                  employee_list: formattedGuards,
                  fotografia: evidencia,
                  roles: rolesConLabel.map((r) => r.label),
                  nombre_suplente: nombreSuplente,
                  checkin_id,
                },
                {
                  onSuccess: () => {
                    setOpen(false);
                  },
                },
              );
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" /> {"Iniciando Turno..."}
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