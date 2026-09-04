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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModuleGroup } from "@/lib/menus-admin-tree";

interface MenuModulesTabsProps {
  modules: ModuleGroup[];
  selectedKey: string | null;
  onSelect: (menuKey: string) => void;
  onReorder: (modules: ModuleGroup[]) => void;
  onAddModule: () => void;
}

export const MenuModulesTabs: React.FC<MenuModulesTabsProps> = ({
  modules,
  selectedKey,
  onSelect,
  onReorder,
  onAddModule,
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
      <div className="flex items-center gap-2 border-b pb-2 mb-4 overflow-x-auto">
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
        <Button type="button" variant="outline" size="sm" onClick={onAddModule}>
          <Plus size={14} /> Módulo
        </Button>
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
        "flex items-center gap-1 rounded-md border px-2 py-1 text-sm cursor-pointer shrink-0 cursor-grab active:cursor-grabbing",
        isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-50",
      )}
      onClick={onSelect}
      {...attributes}
      {...listeners}>
      <GripVertical
        size={14}
        className={isSelected ? "text-white/80" : "text-muted-foreground"}
      />
      {module.menu}
    </div>
  );
};
