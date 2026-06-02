import {
  ColumnDef, 
} from "@tanstack/react-table";
import { useState } from "react";
import { Eye } from "lucide-react";
import { EditarArticuloModal } from "@/components/modals/editar-article-modal";
import { LoadingModal } from "@/components/modals/loading-modal";
import { DevolucionArticuloModal } from "@/components/modals/devolucion-article-modal";
import ViewImage from "@/components/modals/view-image";
import { Imagen } from "@/components/upload-Image";
import { EstatusBadge } from "@/components/estatus-badge";
import { PhotoGridCardModal } from "@/components/Bitacoras/PhotoGrid/PhotoGridCardModal";
import { PerdidosActionButtons } from "@/components/Bitacoras/Perdidos/customActions";
import { mapArticuloPerdidoGrid } from "@/mappers/perdidos.grid.mapper";


export interface Articulo_perdido_record {
  articulo_seleccion: string
  area_perdido: string
  folio: string
  color_perdido: string
  ubicacion_perdido: string
  foto_perdido: Imagen[]
  tipo_articulo_perdido: string
  comentario_perdido: string
  estatus_perdido: string
  quien_entrega: string
  locker_perdido: string
  quien_entrega_interno: string
  quien_entrega_externo: string
  descripcion: string
  date_hallazgo_perdido: string
  _id: string
  articulo_perdido: string
  identificacion_recibe_perdido: Imagen[]
  telefono_recibe_perdido: string
  foto_recibe_perdido: Imagen[]
  date_entrega_perdido: string
  recibe_perdido: string
}


const OptionsCell: React.FC<{ row: any }> = ({ row }) => {
  const articulo = row.original;
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const record = mapArticuloPerdidoGrid(articulo, {});

  return (
    <div className="flex space-x-2">
      <div className="cursor-pointer" title="Ver Artículo" onClick={() => setIsModalOpen(true)}>
        <Eye className="w-5 h-5" />
      </div>

      <PhotoGridCardModal
        record={record}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        badges={[
          { label: "", value: record?.visit_type || "", customClass: "bg-[#F3E8FF] text-[#9159F4] text-xs font-semibold" },
          { label: "", value: `#${record?.folio || ""}`, customClass: "bg-[#DBEAFE] text-[#2987F7] text-xs font-semibold" },
        ]}
      >
        <PerdidosActionButtons articulo={articulo} />
      </PhotoGridCardModal>
		<LoadingModal isOpen={showLoadingModal} text="Cargando..."/>
		
		<EditarArticuloModal 
        title="Editar Artículo Perdido"
        data={articulo} setShowLoadingModal={setShowLoadingModal} showLoadingModal={showLoadingModal}/>

		<DevolucionArticuloModal 
        title="Devolver Artículo Perdido"
        data={articulo} />

    </div>
  );
};


export const pendientesColumns: ColumnDef<Articulo_perdido_record>[] = [
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
      accessorKey: "articulo_perdido",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("articulo_perdido")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "articulo_seleccion",
      header: "Artículo",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("articulo_seleccion")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "estatus_perdido",
      header: "Estatus",
      cell: ({ row }) => <EstatusBadge estatus={row.getValue("estatus_perdido")} />,
    },
    {
      accessorKey:"foto_perdido",
      header:"Fotografía",
      cell: ({ row }) => {
        const foto = row.original.foto_perdido.length==0 ? [{file_url:"/noarticle.svg", file_name:""}]:row.original.foto_perdido;
          return <ViewImage imageUrl={foto} />;
      }
    },
    {
      accessorKey: "color_perdido",
      header: "Color",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("color_perdido")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "tipo_articulo_perdido",
      header: "Categoría",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("tipo_articulo_perdido")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "date_hallazgo_perdido",
      header: "Fecha del hallazgo",
      cell: ({ row }) => (
        <div>{row.getValue("date_hallazgo_perdido")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "locker_perdido",
      header: "Área de Resguardo",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("locker_perdido")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "quien_entrega_externo",
      header: "Reporta",
      cell: ({ row }) => {
		return (
			<div className="capitalize">{row.original.quien_entrega_externo!=="" ? row.original.quien_entrega_externo: row.original.quien_entrega_interno }</div>
		  )
	  },
      enableSorting: true,
    },
    {
      accessorKey: "date_entrega_perdido",
      header: "Fecha de Devolución",
      cell: ({ row }) => (
        <div>{row.getValue("date_entrega_perdido")}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "comentario_perdido",
      header: "Comentarios",
      cell: ({ row }) => {
        const comentarios = row.getValue("comentario_perdido") as string[];
        return (
          <div className="capitalize">
            {Array.isArray(comentarios) ? (
              <ul className="list-disc pl-5">
                {comentarios.map((comentario, index) => (
                  <li key={index}>{comentario}</li>
                ))}
              </ul>
            ) : (
              <span>{comentarios}</span>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
  ];
  