"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuItemRow } from "./menu-item-row";
import { SectionGroup } from "@/lib/menus-admin-tree";
import { MenuItemAdmin } from "@/services/menus-admin";

interface MenuSectionCardProps {
  section: SectionGroup;
  onEditSection: () => void;
  onDeleteSection: () => void;
  onAddItem: () => void;
  onEditItem: (item: MenuItemAdmin) => void;
  onDeleteItem: (item: MenuItemAdmin) => void;
}

export const MenuSectionCard: React.FC<MenuSectionCardProps> = ({
  section,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: section.seccionKey,
      data: { type: "section" },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-50 border rounded-lg p-2 flex flex-col gap-2">
      <div
        className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}>
        <GripVertical size={16} className="text-muted-foreground shrink-0" />
        <button
          type="button"
          className="flex-1 text-left font-semibold text-sm truncate flex items-center gap-1.5"
          onClick={() => setCollapsed((c) => !c)}>
          <span className="truncate">{section.seccion}</span>
        </button>
        <button
          title="Editar sección"
          className="text-blue-500 hover:text-blue-600 shrink-0"
          onClick={onEditSection}>
          <Pencil size={14} />
        </button>
        <button
          title="Eliminar sección"
          className="text-red-500 hover:text-red-600 shrink-0"
          onClick={onDeleteSection}>
          <Trash2 size={14} />
        </button>
      </div>

      {!collapsed && (
        <>
          <SortableContext
            items={section.items.map((i) => i.key)}
            strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1 pl-2">
              {section.items.map((item) => (
                <MenuItemRow
                  key={item.key}
                  item={item}
                  sectionKey={section.seccionKey}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item)}
                />
              ))}
            </div>
          </SortableContext>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground"
            onClick={onAddItem}>
            <Plus size={14} /> Item
          </Button>
        </>
      )}
    </div>
  );
};
