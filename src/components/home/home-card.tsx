import * as React from "react";
import { cn } from "@/lib/utils";

// Contenedor de los bloques del inicio (radio 20, sin borde y sombra suave del diseño).
export function HomeCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "min-w-0 flex flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]",
        className,
      )}>
      {children}
    </section>
  );
}
