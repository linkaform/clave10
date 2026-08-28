"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MenuItemAdmin } from "@/services/menus-admin";

interface MenuItemRowProps {
  item: MenuItemAdmin;
  sectionKey: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const MenuItemRow: React.FC<MenuItemRowProps> = ({
  item,
  sectionKey,
  onEdit,
  onDelete,
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
      className="flex items-center gap-2 bg-white border rounded-md px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}>
      <GripVertical size={14} className="text-muted-foreground shrink-0" />
      <span className="flex-1 truncate">{item.elemento}</span>
      {item.platforms === "mobile" ? (
        <span className="text-[10px] text-muted-foreground/60 shrink-0">solo mobile</span>
      ) : (
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {item.platforms}
        </Badge>
      )}
      <button
        title="Editar"
        className="text-blue-500 hover:text-blue-600 shrink-0"
        onClick={onEdit}>
        <Pencil size={13} />
      </button>
      <button
        title="Eliminar"
        className="text-red-500 hover:text-red-600 shrink-0"
        onClick={onDelete}>
        <Trash2 size={13} />
      </button>
    </div>
  );
};
