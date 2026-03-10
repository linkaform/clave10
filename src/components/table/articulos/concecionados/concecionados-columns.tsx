import {
  ColumnDef, 
} from "@tanstack/react-table";
import {  ArrowLeftRight, Eye } from "lucide-react";
import { DetalleDeLaConcesion } from "@/components/modals/concesionados-detalle-de-la-concesion";
import { Imagen } from "@/components/upload-Image";
import { DetalleDelSeguimiento } from "@/components/modals/concesionados-detalle-del-seguimiento";
import { EquipoConcesionado } from "@/components/concesionados-tab-datos";

export interface Articulo_con_record {
    _id:string,
    folio:string,
    ubicacion_concesion:string, 
    fecha_concesion:string,
    caseta_concesion:string,
    area_concesion:string, 
    solicita_concesion: string,
    observacion_concesion:string, 
    nombre_concesion:string,
    fecha_devolucion_concesion:string,
    status_concesion:string,
    persona_nombre_concesion:string,
    evidencia:Imagen[],
    persona_text:string,
    persona_nombre_otro:string
    equipos:EquipoConcesionado[]
}


const OptionsCell: React.FC<{ row: any }> = ({ row}) => {
  const articulo = row.original;

  return (
    <><div className="flex space-x-2">
      <DetalleDeLaConcesion
        data={articulo} isSuccess={false}>
        <div className="cursor-pointer" title="Ver Artículo">
          <Eye />
        </div>
      </DetalleDeLaConcesion>

    
      <DetalleDelSeguimiento data={articulo} isSuccess={false}>
      <div><ArrowLeftRight /> </div>
      </DetalleDelSeguimiento>

    </div>
    </>
  );
};


export const conColumns: ColumnDef<Articulo_con_record>[] = [
    {
      id: "options",
      header: "Opciones",
      cell: ({ row }) => {
        
        return <OptionsCell row={row} key={row.original._id} />;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "folio",
      header: "Folio",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("folio")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status_concesion",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status_concesion") as string;
        const styles: Record<string, string> = {
          abierto:  "bg-red-100 text-red-700 border-red-300",
          parcial:  "bg-yellow-100 text-yellow-700 border-yellow-300",
          devuelto: "bg-green-100 text-green-700 border-green-300",
        };
        const style = styles[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
        return (
          <div className={`inline-flex items-center justify-center px-2 text-sm font-semibold rounded-md border capitalize ${style}`}>
            {status}
          </div>
        );
      },
      enableSorting: true,
    },   
    {
      accessorKey: "persona_nombre_concesion",
      header: "Empleado",
      cell: ({ row }) => {
        const nombreConcesion = row.getValue("persona_nombre_concesion");
        const nombreOtro = row.original.persona_nombre_otro;
        const nombre = nombreConcesion || nombreOtro || "";
        
        return (
          <div className="capitalize">{String(nombre)}</div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "caseta_concesion",
      header: "Departamento",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("caseta_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "grupo_equipos",
      header: "Equipos",
      cell: ({ row }) => {
        console.log("row original:", row.original);
        const equipos: EquipoConcesionado[] = row.getValue("grupo_equipos") || [];
        if (!equipos.length) return <span className="text-gray-400 text-xs">—</span>;
    
        const getParsed = (val: any) =>
          typeof val === "object" ? val?.parsedValue ?? val : Number(val ?? 0);
    
        return (
          <div className="max-h-20 overflow-y-auto flex flex-col gap-1 pr-1">
            {equipos.map((eq, i) => {
              const cantidad = getParsed(eq.cantidad_equipo_concesion);
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-2 py-0.5 whitespace-nowrap"
                >
                  {eq.nombre_equipo || "—"}
                  <span className="font-bold">x {cantidad}</span>
                </span>
              );
            })}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "fecha_concesion",
      header: "Fecha y hora de entrega",
      cell: ({ row }) => (
        <div>{row.getValue("fecha_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "fecha_cierre_concesion",
      header: "Fecha de devolucion",
      cell: ({ row }) => (
        <div>{row.getValue("fecha_cierre_concesion")}</div>
      ),
      enableSorting: true,
    },

 
  ];
  