// Si el geocodificador ubicó el número exterior o solo la calle.
export function EtiquetaPrecision({ exacto }: { exacto: boolean }) {
  return exacto ? (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-green-50 text-green-700">
      Número exacto
    </span>
  ) : (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500">
      Aproximada
    </span>
  );
}
