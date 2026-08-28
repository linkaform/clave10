"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuModulesTabs } from "./menu-modules-tabs";
import { MenuSectionsBoard } from "./menu-sections-board";
import { EditModuleDialog } from "@/components/modals/edit-module-dialog";
import { EditSectionDialog, SectionFormValues } from "@/components/modals/edit-section-dialog";
import { MenuItemFormDialog, ItemFormValues } from "@/components/modals/menu-item-form-dialog";
import { ConfirmDeleteModal } from "@/components/modals/delete-menu-item-modal";
import {
  ModuleGroup,
  SectionGroup,
  groupByModule,
  flattenAllModules,
  newItemKey,
} from "@/lib/menus-admin-tree";
import { MenuItemAdmin } from "@/services/menus-admin";

interface MenuCatalogBoardProps {
  items: MenuItemAdmin[];
  platform: "web" | "mobile";
  onSave: (rows: MenuItemAdmin[], deletedIds: string[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
  isSaving: boolean;
}

export const MenuCatalogBoard: React.FC<MenuCatalogBoardProps> = ({
  items,
  platform,
  onSave,
  onDirtyChange,
  isSaving,
}) => {
  const [modules, setModules] = useState<ModuleGroup[]>([]);
  const [selectedMenuKey, setSelectedMenuKey] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

  useEffect(() => {
    if (!dirty) {
      const grouped = groupByModule(items);
      setModules(grouped);
      setSelectedMenuKey((prev) =>
        prev && grouped.some((m) => m.menuKey === prev) ? prev : grouped[0]?.menuKey ?? null,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    onDirtyChange?.(dirty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  const selectedModule = modules.find((m) => m.menuKey === selectedMenuKey) || null;

  // las keys solo tienen que ser únicas DENTRO de esta plataforma - compartir
  // key con el mismo item de la otra plataforma es válido a propósito
  const existingItemKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);
  const existingSectionKeys = useMemo(
    () => new Set(items.map((i) => i.seccion_key)),
    [items],
  );
  const existingModuleKeys = useMemo(() => new Set(items.map((i) => i.menu_key)), [items]);

  const updateModules = (updater: (mods: ModuleGroup[]) => ModuleGroup[]) => {
    setModules(updater);
    setDirty(true);
  };

  // ---- módulos ----
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleGroup | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<ModuleGroup | null>(null);

  const handleAddModule = () => {
    setEditingModule(null);
    setModuleDialogOpen(true);
  };

  const handleEditModule = () => {
    if (!selectedModule) return;
    setEditingModule(selectedModule);
    setModuleDialogOpen(true);
  };

  const handleSubmitModule = (values: { menuKey: string; menu: string; menuIcon: string }) => {
    if (editingModule) {
      updateModules((mods) =>
        mods.map((m) =>
          m.menuKey === editingModule.menuKey
            ? { ...m, menu: values.menu, menuIcon: values.menuIcon }
            : m,
        ),
      );
    } else {
      const key = newItemKey(values.menuKey || values.menu, existingModuleKeys);
      const newModule: ModuleGroup = {
        menuKey: key,
        menu: values.menu,
        menuIcon: values.menuIcon,
        order: modules.length + 1,
        sections: [],
      };
      updateModules((mods) => [...mods, newModule]);
      setSelectedMenuKey(key);
    }
    setModuleDialogOpen(false);
  };

  const handleDeleteModule = () => {
    if (!deleteModuleTarget) return;
    const ids = deleteModuleTarget.sections.flatMap((s) =>
      s.items.map((i) => i._id).filter(Boolean),
    ) as string[];
    setPendingDeletes((prev) => [...prev, ...ids]);
    updateModules((mods) => mods.filter((m) => m.menuKey !== deleteModuleTarget.menuKey));
    setSelectedMenuKey((prev) => (prev === deleteModuleTarget.menuKey ? null : prev));
    setDeleteModuleTarget(null);
  };

  // ---- secciones ----
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionGroup | null>(null);
  const [newSectionColumn, setNewSectionColumn] = useState(1);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<SectionGroup | null>(null);

  const handleSectionsChange = (sections: SectionGroup[]) => {
    if (!selectedModule) return;
    updateModules((mods) =>
      mods.map((m) => (m.menuKey === selectedModule.menuKey ? { ...m, sections } : m)),
    );
  };

  const handleAddSection = (column: number) => {
    setEditingSection(null);
    setNewSectionColumn(column);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: SectionGroup) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };

  const handleSubmitSection = (values: SectionFormValues) => {
    if (!selectedModule) return;
    if (editingSection) {
      updateModules((mods) =>
        mods.map((m) =>
          m.menuKey !== selectedModule.menuKey
            ? m
            : {
                ...m,
                sections: m.sections.map((s) =>
                  s.seccionKey === editingSection.seccionKey
                    ? {
                        ...s,
                        seccion: values.seccion,
                        seccionHref: values.seccionHref,
                        seccionIcon: values.seccionIcon,
                        seccionIconColor: values.seccionIconColor,
                        seccionDescription: values.seccionDescription,
                      }
                    : s,
                ),
              },
        ),
      );
    } else {
      const key = newItemKey(values.seccionKey || values.seccion, existingSectionKeys);
      const newSection: SectionGroup = {
        seccionKey: key,
        seccion: values.seccion,
        seccionHref: values.seccionHref,
        seccionIcon: values.seccionIcon,
        seccionIconColor: values.seccionIconColor,
        seccionDescription: values.seccionDescription,
        column: newSectionColumn,
        items: [],
      };
      updateModules((mods) =>
        mods.map((m) =>
          m.menuKey !== selectedModule.menuKey
            ? m
            : { ...m, sections: [...m.sections, newSection] },
        ),
      );
    }
    setSectionDialogOpen(false);
  };

  const handleDeleteSection = () => {
    if (!selectedModule || !deleteSectionTarget) return;
    const ids = deleteSectionTarget.items.map((i) => i._id).filter(Boolean) as string[];
    setPendingDeletes((prev) => [...prev, ...ids]);
    updateModules((mods) =>
      mods.map((m) =>
        m.menuKey !== selectedModule.menuKey
          ? m
          : { ...m, sections: m.sections.filter((s) => s.seccionKey !== deleteSectionTarget.seccionKey) },
      ),
    );
    setDeleteSectionTarget(null);
  };

  // ---- items ----
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemAdmin | null>(null);
  const [newItemSectionKey, setNewItemSectionKey] = useState<string>("");
  const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItemAdmin | null>(null);

  const handleAddItem = (sectionKey: string) => {
    setEditingItem(null);
    setNewItemSectionKey(sectionKey);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: MenuItemAdmin) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleSubmitItem = (values: ItemFormValues) => {
    if (!selectedModule) return;
    updateModules((mods) =>
      mods.map((m) => {
        if (m.menuKey !== selectedModule.menuKey) return m;
        let sections = m.sections.map((s) => ({ ...s, items: [...s.items] }));
        if (editingItem) {
          sections = sections.map((s) => ({
            ...s,
            items: s.items.filter((i) => i.key !== editingItem.key),
          }));
        }
        const targetIdx = sections.findIndex((s) => s.seccionKey === values.seccionKey);
        if (targetIdx === -1) return m;
        const key = editingItem
          ? editingItem.key
          : newItemKey(values.key || values.elemento, existingItemKeys);
        const target = sections[targetIdx];
        const newRow: MenuItemAdmin = {
          _id: editingItem?._id,
          menu_key: m.menuKey,
          menu: m.menu,
          menu_order: 0,
          menu_icon: m.menuIcon,
          menu_columns: 1,
          seccion_key: target.seccionKey,
          seccion: target.seccion,
          seccion_order: 0,
          seccion_column: target.column,
          seccion_href: target.seccionHref,
          seccion_icon: target.seccionIcon,
          seccion_icon_color: target.seccionIconColor,
          seccion_description: target.seccionDescription,
          elemento: values.elemento,
          key,
          type: values.type,
          item_order: 0,
          href_web: values.href_web,
          route_mobile: values.route_mobile,
          item_icon: values.item_icon,
          platforms: platform,
        };
        sections[targetIdx] = { ...target, items: [...target.items, newRow] };
        return { ...m, sections };
      }),
    );
    setItemDialogOpen(false);
  };

  const handleDeleteItem = () => {
    if (!selectedModule || !deleteItemTarget) return;
    if (deleteItemTarget._id) {
      setPendingDeletes((prev) => [...prev, deleteItemTarget._id as string]);
    }
    updateModules((mods) =>
      mods.map((m) =>
        m.menuKey !== selectedModule.menuKey
          ? m
          : {
              ...m,
              sections: m.sections.map((s) => ({
                ...s,
                items: s.items.filter((i) => i.key !== deleteItemTarget.key),
              })),
            },
      ),
    );
    setDeleteItemTarget(null);
  };

  const handleDiscard = () => {
    setModules(groupByModule(items));
    setPendingDeletes([]);
    setDirty(false);
  };

  const handleSave = () => {
    const rows = flattenAllModules(modules);
    onSave(rows, pendingDeletes);
    setDirty(false);
    setPendingDeletes([]);
  };

  const sectionOptions = (selectedModule?.sections || []).map((s) => ({
    seccionKey: s.seccionKey,
    seccion: s.seccion,
  }));

  return (
    <div className="flex flex-col gap-4 pb-20">
      <MenuModulesTabs
        modules={modules}
        selectedKey={selectedMenuKey}
        onSelect={setSelectedMenuKey}
        onReorder={(next) => updateModules(() => next)}
        onAddModule={handleAddModule}
      />

      {selectedModule && (
        <>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{selectedModule.menu}</h2>
            <button
              title="Editar módulo"
              className="text-blue-500 hover:text-blue-600"
              onClick={handleEditModule}>
              <Pencil size={14} />
            </button>
            <button
              title="Eliminar módulo"
              className="text-red-500 hover:text-red-600"
              onClick={() => setDeleteModuleTarget(selectedModule)}>
              <Trash2 size={14} />
            </button>
          </div>

          <MenuSectionsBoard
            module={selectedModule}
            onChange={handleSectionsChange}
            onEditSection={handleEditSection}
            onDeleteSection={setDeleteSectionTarget}
            onAddSection={handleAddSection}
            onEditItem={handleEditItem}
            onDeleteItem={setDeleteItemTarget}
            onAddItem={handleAddItem}
          />
        </>
      )}

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-6 py-3 flex items-center justify-end gap-3 z-40">
          <span className="text-sm text-muted-foreground mr-auto">Tienes cambios sin guardar</span>
          <Button type="button" variant="outline" onClick={handleDiscard} disabled={isSaving}>
            Descartar
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSave}
            disabled={isSaving}>
            Guardar cambios
          </Button>
        </div>
      )}

      <EditModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        initialValues={
          editingModule
            ? { menuKey: editingModule.menuKey, menu: editingModule.menu, menuIcon: editingModule.menuIcon }
            : null
        }
        isSaving={false}
        onSubmit={handleSubmitModule}
      />

      <EditSectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        initialValues={
          editingSection
            ? {
                seccionKey: editingSection.seccionKey,
                seccion: editingSection.seccion,
                seccionHref: editingSection.seccionHref,
                seccionIcon: editingSection.seccionIcon,
                seccionIconColor: editingSection.seccionIconColor,
                seccionDescription: editingSection.seccionDescription,
              }
            : null
        }
        isSaving={false}
        onSubmit={handleSubmitSection}
      />

      <MenuItemFormDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        initialValues={editingItem}
        defaultSeccionKey={editingItem?.seccion_key || newItemSectionKey}
        sectionOptions={sectionOptions}
        platform={platform}
        isSaving={false}
        onSubmit={handleSubmitItem}
      />

      <ConfirmDeleteModal
        open={!!deleteModuleTarget}
        onOpenChange={(open) => !open && setDeleteModuleTarget(null)}
        title="Eliminar módulo"
        label={deleteModuleTarget?.menu || ""}
        onConfirm={handleDeleteModule}
      />

      <ConfirmDeleteModal
        open={!!deleteSectionTarget}
        onOpenChange={(open) => !open && setDeleteSectionTarget(null)}
        title="Eliminar sección"
        label={deleteSectionTarget?.seccion || ""}
        onConfirm={handleDeleteSection}
      />

      <ConfirmDeleteModal
        open={!!deleteItemTarget}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        title="Eliminar item"
        label={deleteItemTarget?.elemento || ""}
        onConfirm={handleDeleteItem}
      />
    </div>
  );
};
