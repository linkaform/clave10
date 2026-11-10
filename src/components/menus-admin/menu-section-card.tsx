"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { IconAction } from "./icon-action";
import { InlineName } from "./inline-name";
import { RenameProps } from "./rename";
import { MenuItemRow } from "./menu-item-row";
import { SectionGroup } from "@/lib/menus-admin-tree";
import { MenuItemAdmin } from "@/services/menus-admin";

interface MenuSectionCardProps extends RenameProps {
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
  renamingId,
  onStartRename,
  onRename,
  onCancelRename,
}) => {
  const sectionId = `section:${section.seccionKey}`;
  const renamingSection = renamingId === sectionId;
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
      className="flex min-w-0 flex-col gap-1.5 rounded-xl bg-c10-panel p-2.5">
      <div
        className="flex min-h-8 cursor-grab items-center gap-1 pl-0.5 active:cursor-grabbing"
        {...attributes}
        {...listeners}>
        <GripVertical size={14} className="shrink-0 text-c10-faint" />
        <InlineName
          value={section.seccion}
          editing={renamingSection}
          onSubmit={(name) => onRename(sectionId, name)}
          onCancel={onCancelRename}
          onClick={() => setCollapsed((c) => !c)}
          onDoubleClick={onEditSection}
          className="cursor-pointer pl-1 text-left text-sm font-bold text-c10-title"
        />
        {!renamingSection && (
          <>
            <IconAction title="Cambiar nombre" onClick={() => onStartRename(sectionId)}>
              <Pencil size={14} />
            </IconAction>
            <IconAction title="Más opciones" onClick={onEditSection}>
              <Ellipsis size={15} />
            </IconAction>
            <IconAction title="Eliminar sección" onClick={onDeleteSection} danger>
              <Trash2 size={14} />
            </IconAction>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          <SortableContext
            items={section.items.map((i) => i.key)}
            strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {section.items.map((item) => (
                <MenuItemRow
                  key={item.key}
                  item={item}
                  sectionKey={section.seccionKey}
                  onEdit={() => onEditItem(item)}
                  onDelete={() => onDeleteItem(item)}
                  isRenaming={renamingId === `item:${item.key}`}
                  onStartRename={() => onStartRename(`item:${item.key}`)}
                  onRename={(name) => onRename(`item:${item.key}`, name)}
                  onCancelRename={onCancelRename}
                />
              ))}
              {section.items.length === 0 && (
                <div className="rounded-lg border border-dashed border-c10-line-strong p-2.5 text-center text-[13px] text-c10-faint">
                  Sin menús
                </div>
              )}
            </div>
          </SortableContext>
          <button
            type="button"
            onClick={onAddItem}
            className="flex h-[30px] items-center gap-1 self-start rounded-lg pl-2 pr-2.5 text-[13px] font-medium text-c10-meta transition-colors duration-150 hover:bg-c10-blue-subtle hover:text-[#2F80ED]">
            <Plus size={14} /> Menú
          </button>
        </>
      )}
    </div>
  );
};
