import {
  ColumnDef, 
} from "@tanstack/react-table";
import {  Eye } from "lucide-react";
// import { LoadingModal } from "@/components/modals/loading-modal";
import { ViewArticuloCon } from "@/components/modals/view-articulo-con";
import { DevolucionArticuloConModal } from "@/components/modals/devolucion-article-con-modal";
import { Imagen } from "@/components/upload-Image";

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
    persona_nombre_concesion:string
    evidencia:Imagen[],
    persona_text:string
}


const OptionsCell: React.FC<{ row: any }> = ({ row}) => {
  const articulo = row.original;
  // const [showLoadingModal, setShowLoadingModal] = useState(false);

  return (
    <><div className="flex space-x-2">
      <ViewArticuloCon
        title="Información del Artículo Concesionado"
        data={articulo} isSuccess={false}>
        <div className="cursor-pointer" title="Ver Artículo">
          <Eye />
        </div>
      </ViewArticuloCon>

      {/* <LoadingModal isOpen={showLoadingModal} text="Cargando..."/> */}
      {/* <AddArticuloConModal
        title={"Editar Artículo Concesionado"}
        isSuccess={isSuccessCon}
        setIsSuccess={setIsSuccessCon}
        initialData={articulo}
        mode={"edit"}>
      <div className="cursor-pointer" title="Editar Artículo">
        <Edit />
      </div>
    </AddArticuloConModal> */}
    
    <DevolucionArticuloConModal
        title="Devolver Artículo Concesionado" data={articulo} />
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
        const isAbierto = status?.toLowerCase() === "abierto";
    
        return (
          <div
            className={`inline-flex items-center justify-center px-2  text-sm font-semibold rounded-md border capitalize
              ${
                isAbierto
                  ? "bg-red-100 text-red-700 border-red-700"
                  : "bg-green-100 text-green-700 border-green-700"
              }
            `}
          >
            {status}
          </div>
        );
      },
      enableSorting: true,
    },    
    {
      accessorKey: "nombre_concesion",
      header: "Empleado",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("nombre_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "area",
      header: "Departamento",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("area")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "otro",
      header: "Otro",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("otro")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "equipos",
      header: "Equipos",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("equipos")}</div>
      ),
      enableSorting: true,
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
      accessorKey: "fecha_devolucion_concesion",
      header: "Fecha de devolucion",
      cell: ({ row }) => (
        <div>{row.getValue("fecha_devolucion_concesion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "entrego",
      header: "Entrego",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("entrego")}</div>
      ),
      enableSorting: true,
    },
 
  ];
  