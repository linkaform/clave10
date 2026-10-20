"use client";

import Image from "next/image";
import { LogIn } from "lucide-react";
import { useCheckInAction } from "@/hooks/useCheckIn";

// Pantallas que operan sobre una caseta: sin Check In abierto no se puede trabajar.
export function RequiereCheckIn() {
  const { run } = useCheckInAction();
  return (
    <div className="flex justify-center items-center overflow-hidden mt-32">
      <div className="flex items-center flex-col gap-2">
        <Image src="/guardia1.png" alt="Guardia" width={300} height={300} priority />
        <div className="text-2xl font-bold">Haz Check In para comenzar...</div>
        <p className="text-gray-500">Registra en qué caseta estás para activar tus funciones.</p>
        <button
          type="button"
          onClick={run}
          className="mt-5 h-9 px-4 rounded-full bg-[#2F80ED] text-sm font-semibold text-white flex items-center gap-1.5 transition-colors hover:bg-[#1E6FDB]">
          <LogIn className="h-4 w-4" />
          Check In
        </button>
      </div>
    </div>
  );
}
