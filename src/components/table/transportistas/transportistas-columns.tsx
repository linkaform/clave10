import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDownToLine, ArrowUpFromLine, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { BitacoraTransportistaRecord } from "@/hooks/useGetBitacoraTransportistaRecords";
import { ESTATUS_BADGE, ESTATUS_LABELS } from "@/mappers/transportista.bitacora.list.mapper";

const OptionsCell: React.FC<{ record: BitacoraTransportistaRecord }> = ({ record }) => {
  const iconClass = "p-1 rounded transition-colors cursor-pointer hover:bg-slate-200 text-black hover:text-blue-600";
  return (
    <div className="flex items-center">
      <Link href={`/dashboard/accesos/transportista/${record._id}`} className={iconClass} title="Ver detalle">
        <Eye className="w-5 h-5" />
      </Link>
    </div>
  );
};

export const getTransportistasColumns = (): ColumnDef<BitacoraTransportistaRecord>[] => [
  {
    id: "options",
    header: "Opciones",
    cell: ({ row }) => <OptionsCell record={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "folio",
    header: "Folio",
    cell: ({ row }) => (
      <div className="text-xs font-normal text-slate-900 whitespace-nowrap">{row.getValue("folio") ?? ""}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "placas",
    header: "Placas",
    cell: ({ row }) => (
      <div className="text-xs font-semibold text-slate-900 whitespace-nowrap">{row.getValue("placas") || "Sin placas"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "estatus",
    header: "Estatus",
    cell: ({ row }) => {
      const estatus = row.getValue("estatus") as string;
      return (
        <span
          className={cn(
            "inline-flex px-2 py-0.5 min-h-[16px] text-[10px] font-bold tracking-wide rounded-full whitespace-nowrap",
            ESTATUS_BADGE[estatus] || "bg-gray-100 text-gray-600",
          )}
        >
          {ESTATUS_LABELS[estatus] || estatus || ""}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "tipo_de_operacion",
    header: "Operación",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo_de_operacion") as string | null;
      const isEntrega = tipo === "entrega";
      return (
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
          isEntrega ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600",
        )}>
          {isEntrega ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
          {isEntrega ? "Entrega" : "Recolección"}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "proveedor_cliente",
    header: "Empresa",
    cell: ({ row }) => (
      <div className="text-xs font-normal text-slate-900 leading-tight min-w-[140px]">{row.getValue("proveedor_cliente") ?? ""}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "conductor",
    header: "Conductor",
    cell: ({ row }) => (
      <div className="text-xs font-normal text-slate-900 capitalize leading-tight min-w-[140px]">{row.getValue("conductor") ?? ""}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "material",
    header: "Material",
    cell: ({ row }) => (
      <div className="text-xs font-normal text-slate-900 leading-tight min-w-[160px]">{row.getValue("material") ?? "---"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "anden_asignado",
    header: "Andén",
    cell: ({ row }) => (
      <div className="text-xs font-medium text-slate-900 whitespace-nowrap">{row.getValue("anden_asignado") || "---"}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "fecha_hora_ingreso",
    header: "Ingreso",
    cell: ({ row }) => (
      <div className="text-xs font-normal text-slate-900 whitespace-nowrap">{row.getValue("fecha_hora_ingreso") ?? ""}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "num_de_pase",
    header: "Pase",
    cell: ({ row }) => {
      const pase = row.getValue("num_de_pase") as string | null;
      return pase ? (
        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap">{pase}</span>
      ) : (
        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap">SIN PASE</span>
      );
    },
    enableSorting: true,
  },
];
