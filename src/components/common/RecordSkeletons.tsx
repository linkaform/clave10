"use client";

// Placeholders de carga con la forma de los datos (filas/tarjetas grises que
// parpadean), para mostrar que vienen registros nuevos sin dejar la vista vacía.

const Bar = ({ className = "" }: { className?: string }) => (
  <span className={`block rounded-full bg-slate-200 ${className}`} />
);

const WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5", "w-2/5"];

export const GridCardSkeletons = ({ count = 10 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 animate-pulse">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="h-80 bg-slate-100" />
        <div className="flex flex-col gap-3 p-4">
          <Bar className={`h-3.5 ${WIDTHS[i % WIDTHS.length]}`} />
          <Bar className="h-5 w-28" />
          <div className="flex flex-col gap-2 pt-1">
            <Bar className="h-2.5 w-4/5" />
            <Bar className="h-2.5 w-3/5" />
            <Bar className="h-2.5 w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ListCardSkeletons = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-col gap-4 animate-pulse">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex gap-8 p-6 rounded-xl border border-slate-200 bg-white">
        <div className="w-[22%] flex-shrink-0 aspect-[4/3] rounded-xl bg-slate-100" />
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          <Bar className={`h-4 ${WIDTHS[i % WIDTHS.length]}`} />
          <Bar className="h-5 w-24" />
          <Bar className="h-2.5 w-4/5" />
          <Bar className="h-2.5 w-3/5" />
          <Bar className="h-2.5 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

/** Filas para un <TableBody>; `columns` = número de celdas por fila. */
export const TableRowSkeletons = ({ columns, count = 8 }: { columns: number; count?: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <tr key={i} className="border-b border-slate-100 animate-pulse">
        {Array.from({ length: columns }, (_, j) => (
          <td key={j} className="py-3 px-3">
            <Bar className={`h-2.5 ${WIDTHS[(i + j) % WIDTHS.length]}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);
