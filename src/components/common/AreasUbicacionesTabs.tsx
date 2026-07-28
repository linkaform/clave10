"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AreasUbicacionesTabsProps {
  active: "areas" | "ubicaciones";
}

// Ubicaciones y Áreas viven en rutas propias (/dashboard/ubicaciones,
// /dashboard/areas) — este toggle solo navega entre ellas, ya no cambia
// estado local dentro de una sola página.
export function AreasUbicacionesTabs({ active }: AreasUbicacionesTabsProps) {
  const router = useRouter();

  return (
    <Tabs
      value={active}
      onValueChange={(val) => router.push(val === "areas" ? "/dashboard/areas" : "/dashboard/ubicaciones")}
      className="w-auto"
    >
      <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
        <TabsTrigger
          value="ubicaciones"
          className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50"
        >
          Ubicaciones
        </TabsTrigger>
        <TabsTrigger
          value="areas"
          className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50"
        >
          Áreas
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
