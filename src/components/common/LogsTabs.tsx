"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LogsTabsProps {
  active: "script" | "workflows";
}

// Script y Workflows viven en rutas propias; este toggle solo navega entre
// ellas (mismo patron que AreasUbicacionesTabs).
export function LogsTabs({ active }: LogsTabsProps) {
  const router = useRouter();
  const triggerClass =
    "data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 h-full font-medium transition-all rounded-none border-x border-slate-300/50 shadow-none text-slate-600 hover:bg-slate-200/50";

  return (
    <Tabs
      value={active}
      onValueChange={(val) => router.push(val === "script" ? "/dashboard/script-logs" : "/dashboard/workflow-logs")}
      className="w-auto"
    >
      <TabsList className="bg-slate-100/50 h-10 p-0 border border-slate-300 divide-x divide-slate-300 rounded-lg overflow-hidden shadow-sm">
        <TabsTrigger value="script" className={triggerClass}>
          Script
        </TabsTrigger>
        <TabsTrigger value="workflows" className={triggerClass}>
          Workflows
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
