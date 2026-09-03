"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuSectionCard } from "./menu-section-card";
import { ModuleGroup, SectionGroup } from "@/lib/menus-admin-tree";
import { MenuItemAdmin } from "@/services/menus-admin";

const MAX_COLUMNS = 6;

/**
 * Agrupa las secciones por columna y COMPACTA los huecos: si una columna
 * se queda vacía (todas sus secciones se movieron a otra), desaparece y las
 * columnas siguientes se recorren para que la numeración siempre sea 1..N
 * sin saltos.
 */
function compactColumns(sections: SectionGroup[]): SectionGroup[][] {
  const byColumn = new Map<number, SectionGroup[]>();
  for (const section of sections) {
    const col = section.column || 1;
    if (!byColumn.has(col)) byColumn.set(col, []);
    byColumn.get(col)!.push(section);
  }
  const sortedKeys = Array.from(byColumn.keys()).sort((a, b) => a - b);
  return sortedKeys
    .map((key) => byColumn.get(key)!)
    .filter((sections) => sections.length > 0);
}

interface MenuSectionsBoardProps {
  module: ModuleGroup;
  onChange: (sections: SectionGroup[]) => void;
  onEditSection: (section: SectionGroup) => void;
  onDeleteSection: (section: SectionGroup) => void;
  onAddSection: (column: number) => void;
  onEditItem: (item: MenuItemAdmin) => void;
  onDeleteItem: (item: MenuItemAdmin) => void;
  onAddItem: (sectionKey: string) => void;
}

export const MenuSectionsBoard: React.FC<MenuSectionsBoardProps> = ({
  module,
  onChange,
  onEditSection,
  onDeleteSection,
  onAddSection,
  onEditItem,
  onDeleteItem,
  onAddItem,
}) => {
  const [columns, setColumns] = useState<SectionGroup[][]>(() =>
    compactColumns(module.sections),
  );

  useEffect(() => {
    setColumns(compactColumns(module.sections));
  }, [module]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const emitChange = (next: SectionGroup[][]) => {
    // filtra columnas que quedaron vacías y renumera 1..N sin huecos
    const compacted = next
      .filter((sections) => sections.length > 0)
      .map((sections, idx) => sections.map((s) => ({ ...s, column: idx + 1 })));
    setColumns(compacted);
    onChange(compacted.flat());
  };

  const findSectionColumn = (cols: SectionGroup[][], seccionKey: string): number => {
    return cols.findIndex((sections) => sections.some((s) => s.seccionKey === seccionKey));
  };

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const fromColumn = findSectionColumn(columns, activeId);
    if (fromColumn === -1) return;

    let toColumn = -1;
    if (overId.startsWith("column-")) {
      toColumn = Number(overId.replace("column-", "")) - 1;
    } else {
      toColumn = findSectionColumn(columns, overId);
      if (toColumn === -1) {
        // `over` puede ser un item (no una sección) si el mouse quedó más cerca
        // de un item dentro de otra sección; resolvemos a la sección dueña.
        toColumn = columns.findIndex((sections) =>
          sections.some((s) => s.items.some((it) => it.key === overId)),
        );
      }
    }
    if (toColumn === -1) return;

    const next: SectionGroup[][] = columns.map((sections) => [...sections]);
    while (next.length <= toColumn) next.push([]);

    const fromIndex = next[fromColumn].findIndex((s) => s.seccionKey === activeId);
    const [moved] = next[fromColumn].splice(fromIndex, 1);

    const toIndex = next[toColumn].findIndex((s) => s.seccionKey === overId);
    next[toColumn].splice(toIndex === -1 ? next[toColumn].length : toIndex, 0, moved);

    emitChange(next);
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sectionKey = (active.data.current as { sectionKey?: string } | undefined)
      ?.sectionKey;
    if (!sectionKey) return;

    const columnIndex = findSectionColumn(columns, sectionKey);
    if (columnIndex === -1) return;

    const next: SectionGroup[][] = columns.map((sections) => [...sections]);
    const sectionIdx = next[columnIndex].findIndex((s) => s.seccionKey === sectionKey);
    if (sectionIdx === -1) return;

    const section = next[columnIndex][sectionIdx];
    const oldIndex = section.items.findIndex((i) => i.key === active.id);
    const newIndex = section.items.findIndex((i) => i.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    next[columnIndex][sectionIdx] = {
      ...section,
      items: arrayMove(section.items, oldIndex, newIndex),
    };
    emitChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const type = (event.active.data.current as { type?: string } | undefined)?.type;
    if (type === "item") {
      handleItemDragEnd(event);
    } else {
      handleSectionDragEnd(event);
    }
  };

  const slotsToRender = Math.min(columns.length + 1, MAX_COLUMNS);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: slotsToRender }, (_, i) => i).map((columnIdx) => (
          <BoardColumn
            key={columnIdx}
            columnNumber={columnIdx + 1}
            sections={columns[columnIdx] || []}
            onAddSection={() => onAddSection(columnIdx + 1)}
            onEditSection={onEditSection}
            onDeleteSection={onDeleteSection}
            onAddItem={onAddItem}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>
    </DndContext>
  );
};

interface BoardColumnProps {
  columnNumber: number;
  sections: SectionGroup[];
  onAddSection: () => void;
  onEditSection: (section: SectionGroup) => void;
  onDeleteSection: (section: SectionGroup) => void;
  onAddItem: (sectionKey: string) => void;
  onEditItem: (item: MenuItemAdmin) => void;
  onDeleteItem: (item: MenuItemAdmin) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  columnNumber,
  sections,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const { setNodeRef } = useDroppable({ id: `column-${columnNumber}` });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-3 min-h-[120px] bg-muted/20 rounded-lg p-2">
      <SortableContext
        items={sections.map((s) => s.seccionKey)}
        strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <MenuSectionCard
            key={section.seccionKey}
            section={section}
            onEditSection={() => onEditSection(section)}
            onDeleteSection={() => onDeleteSection(section)}
            onAddItem={() => onAddItem(section.seccionKey)}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </SortableContext>
      <Button type="button" variant="ghost" size="sm" onClick={onAddSection}>
        <Plus size={14} /> Sección
      </Button>
    </div>
  );
};
