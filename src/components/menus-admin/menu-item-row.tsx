"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Pencil, Trash2 } from "lucide-react";
import { MenuItemAdmin } from "@/services/menus-admin";
import { IconAction } from "./icon-action";
import { InlineName } from "./inline-name";

interface MenuItemRowProps {
  item: MenuItemAdmin;
  sectionKey: string;
  /** Abre el modal completo (key, href, icono, sección). */
  onEdit: () => void;
  onDelete: () => void;
  isRenaming: boolean;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
}

export const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  sectionKey,
  onEdit,
  onDelete,
  isRenaming,
  onStartRename,
  onRename,
  onCancelRename,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key, data: { type: "item", sectionKey } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex min-h-9 cursor-grab items-center gap-1 rounded-lg bg-c10-surface pl-1.5 pr-0.5 active:cursor-grabbing"
      {...attributes}
      {...listeners}>
      <GripVertical size={14} className="shrink-0 text-c10-grip" />
      <InlineName
        value={item.elemento}
        editing={isRenaming}
        onSubmit={onRename}
        onCancel={onCancelRename}
        onDoubleClick={onEdit}
        className="pl-1 text-sm text-c10-text"
      />
      {!isRenaming && (
        <>
          <IconAction title="Cambiar nombre" onClick={onStartRename}>
            <Pencil size={14} />
          </IconAction>
          <IconAction title="Más opciones" onClick={onEdit}>
            <Ellipsis size={15} />
          </IconAction>
        </>
      )}
      {!isRenaming && (
        <IconAction title="Eliminar menú" onClick={onDelete} danger>
          <Trash2 size={14} />
        </IconAction>
      )}
    </div>
  );
};
