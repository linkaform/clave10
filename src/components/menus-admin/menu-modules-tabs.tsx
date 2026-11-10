"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleGroup } from "@/lib/menus-admin-tree";

interface MenuModulesTabsProps {
  modules: ModuleGroup[];
  selectedKey: string | null;
  onSelect: (menuKey: string) => void;
  onReorder: (modules: ModuleGroup[]) => void;
  onAddModule: () => void;
  /** Botones extra al final de la fila (p. ej. Exportar). */
  extra?: React.ReactNode;
}

export const MenuModulesTabs: React.FC<MenuModulesTabsProps> = ({
  modules,
  selectedKey,
  onSelect,
  onReorder,
  onAddModule,
  extra,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.menuKey === active.id);
    const newIndex = modules.findIndex((m) => m.menuKey === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(modules, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-wrap items-center gap-2">
        <SortableContext
          items={modules.map((m) => m.menuKey)}
          strategy={horizontalListSortingStrategy}>
          {modules.map((module) => (
            <ModuleTab
              key={module.menuKey}
              module={module}
              isSelected={module.menuKey === selectedKey}
              onSelect={() => onSelect(module.menuKey)}
            />
          ))}
        </SortableContext>
        <button
          type="button"
          onClick={onAddModule}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-c10-line-strong bg-c10-surface pl-2.5 pr-3 text-sm font-medium text-c10-secondary transition-colors duration-150 hover:border-[#2F80ED] hover:text-[#2F80ED]">
          <Plus size={14} /> Módulo
        </button>
        {extra}
      </div>
    </DndContext>
  );
};

interface ModuleTabProps {
  module: ModuleGroup;
  isSelected: boolean;
  onSelect: () => void;
}

const ModuleTab: React.FC<ModuleTabProps> = ({ module, isSelected, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: module.menuKey });
  const itemCount = module.sections.reduce((n, s) => n + s.items.length, 0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex h-9 shrink-0 cursor-grab items-center gap-1.5 rounded-lg border pl-1.5 pr-2 text-sm transition-colors duration-150 active:cursor-grabbing",
        isSelected
          ? "border-[#2F80ED] bg-[#2F80ED] font-semibold text-white"
          : "border-c10-line bg-c10-surface text-c10-text hover:bg-c10-panel",
      )}
      onClick={onSelect}
      {...attributes}
      {...listeners}>
      <GripVertical
        size={14}
        className={isSelected ? "text-white/70" : "text-c10-faint"}
      />
      {module.menu}
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
          isSelected ? "bg-white/20 text-white" : "bg-c10-sunken text-c10-secondary",
        )}>
        {itemCount}
      </span>
    </div>
  );
};
