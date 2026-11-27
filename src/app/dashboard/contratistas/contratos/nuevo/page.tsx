import { Suspense } from "react";
import { NuevoContrato } from "@/components/contratistas/contratos/NuevoContrato";

/** ME-12 · Alta de contrato. Gana sobre /contratos/[contratoId] por ser ruta estática. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <NuevoContrato />
    </Suspense>
  );
}
