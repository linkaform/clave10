"use client";

import { useState } from "react";
import { FileSpreadsheet, Monitor, RefreshCw, Smartphone, Upload } from "lucide-react";

import { useMenuItems } from "@/hooks/menus-admin/useMenuItems";
import { useResyncAllPermissions } from "@/hooks/menus-admin/useUserMenuAssignment";
import { MenuAssignmentGrid } from "./menu-assignment-grid";
import { MenuCatalogBoard } from "./menu-catalog-board";
import { MenuConfigDiagnosticsPanel } from "./menu-config-diagnostics";
import { Segmented } from "./segmented";
import { ConfigCard } from "@/components/configuracion/config-card";
import { ImportCatalogDialog } from "@/components/modals/import-catalog-dialog";
import { ResyncPermissionsDialog } from "@/components/modals/resync-permissions-dialog";
import { MenuItemAdmin } from "@/services/menus-admin";
import { exportMenuItemsToExcel } from "@/lib/menus-admin-export";
import { cn } from "@/lib/utils";

type MenusTab = "catalogo" | "asignacion" | "diagnostico";
type Platform = "web" | "mobile";

const PLATFORM_OPTIONS = [
  { value: "web" as const, label: "Web", icon: <Monitor className="h-4 w-4" /> },
  { value: "mobile" as const, label: "Móvil", icon: <Smartphone className="h-4 w-4" /> },
];

/** Configuración > Menús: editor del catálogo, asignación por usuario y diagnóstico. */
export function MenusAdminSection() {
  const [tab, setTab] = useState<MenusTab>("catalogo");

  const { menuItems, isLoadingMenuItems, saveBoardMutation, replaceCatalogMutation } =
    useMenuItems();
  const [importOpen, setImportOpen] = useState(false);

  // ---- Catálogo ----
  const [platformTab, setPlatformTab] = useState<Platform>("web");
  const [catalogDirty, setCatalogDirty] = useState(false);

  const confirmDiscardCatalog = () => {
    if (!catalogDirty) return true;
    const ok = window.confirm(
      "Tienes cambios sin guardar en el catálogo. ¿Descartarlos y continuar?",
    );
    if (ok) setCatalogDirty(false);
    return ok;
  };

  const handlePlatformTabChange = (next: Platform) => {
    if (next === platformTab) return;
    if (!confirmDiscardCatalog()) return;
    setPlatformTab(next);
  };

  const handleTabChange = (next: MenusTab) => {
    if (next === tab) return;
    if (tab === "catalogo" && !confirmDiscardCatalog()) return;
    if (
      tab === "asignacion" &&
      assignmentDirty &&
      !window.confirm("Tienes cambios sin guardar en la asignación. ¿Descartarlos y continuar?")
    )
      return;
    if (tab === "asignacion") setAssignmentDirty(false);
    setTab(next);
  };

  const filteredMenuItems = menuItems.filter((i) => i.platforms === platformTab);

  const handleSaveBoard = (rows: MenuItemAdmin[], deletedIds: string[]) => {
    saveBoardMutation.mutate({ rows, deletedIds });
  };

  // ---- Asignación ----
  const [assignmentPlatformTab, setAssignmentPlatformTab] = useState<Platform>("web");
  const assignmentMenuItems = menuItems.filter((i) => i.platforms === assignmentPlatformTab);
  const [assignmentDirty, setAssignmentDirty] = useState(false);

  // ---- Resincronizar ----
  const { resyncMutation, isRunning: isResyncRunning } = useResyncAllPermissions();
  const [resyncOpen, setResyncOpen] = useState(false);
  const handleConfirmResync = () => {
    resyncMutation.mutate(undefined, {
      onSuccess: () => setResyncOpen(false),
    });
  };

  const showPlatform = tab !== "diagnostico";
  const platformValue = tab === "asignacion" ? assignmentPlatformTab : platformTab;
  const onPlatformChange = (p: Platform) =>
    tab === "asignacion" ? setAssignmentPlatformTab(p) : handlePlatformTabChange(p);

  return (
    <ConfigCard
      title={
        <span className="flex items-center gap-2">
          Menús
          <button
            type="button"
            onClick={() => setResyncOpen(true)}
            disabled={isResyncRunning}
            title={isResyncRunning ? "Resincronizando permisos..." : "Resincronizar permisos"}
            aria-label="Resincronizar permisos"
            className="flex h-8 w-8 items-center justify-center rounded-full text-c10-secondary transition-colors duration-150 hover:bg-c10-blue-light hover:text-[#2F80ED] disabled:opacity-50">
            <RefreshCw className={cn("h-4 w-4", isResyncRunning && "animate-spin")} />
          </button>
        </span>
      }
      actions={
        <Segmented<MenusTab>
          ariaLabel="Vista de menús"
          value={tab}
          onChange={handleTabChange}
          options={[
            { value: "catalogo", label: "Catálogo" },
            { value: "asignacion", label: "Asignación" },
            { value: "diagnostico", label: "Diagnóstico" },
          ]}
        />
      }>
      {showPlatform && (
        <div className="-mt-1 flex flex-wrap items-center gap-2">
          <Segmented<Platform>
            ariaLabel="Plataforma"
            value={platformValue}
            onChange={onPlatformChange}
            options={PLATFORM_OPTIONS}
            itemWidth={104}
          />
        </div>
      )}

      {tab === "catalogo" &&
        (isLoadingMenuItems ? (
          <CatalogSkeleton />
        ) : (
          <MenuCatalogBoard
            key={platformTab}
            items={filteredMenuItems}
            platform={platformTab}
            onSave={handleSaveBoard}
            onDirtyChange={setCatalogDirty}
            isSaving={saveBoardMutation.isPending}
            toolbarExtra={
              <>
                <button
                  type="button"
                  onClick={() => exportMenuItemsToExcel(menuItems)}
                  disabled={menuItems.length === 0}
                  title="Exportar menús a Excel"
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#16A34A] pl-2.5 pr-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-50">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Menús
                </button>
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  title="Importar menús desde Excel"
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-c10-line bg-c10-surface pl-2.5 pr-3 text-sm font-medium text-c10-label transition-colors duration-150 hover:bg-c10-sunken">
                  <Upload className="h-4 w-4" />
                  Importar
                </button>
              </>
            }
          />
        ))}

      {tab === "asignacion" && (
        <MenuAssignmentGrid
          items={assignmentMenuItems}
          onDirtyChange={setAssignmentDirty}
        />
      )}

      {tab === "diagnostico" && <MenuConfigDiagnosticsPanel />}

      <ResyncPermissionsDialog
        open={resyncOpen}
        onOpenChange={setResyncOpen}
        isResyncing={isResyncRunning}
        onConfirm={handleConfirmResync}
      />

      <ImportCatalogDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        currentItemCount={menuItems.length}
        isImporting={replaceCatalogMutation.isPending}
        onConfirm={(items) =>
          replaceCatalogMutation.mutate(items, {
            onSuccess: () => setImportOpen(false),
          })
        }
      />
    </ConfigCard>
  );
}

function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Cargando">
      <div className="flex flex-wrap gap-2">
        {[120, 100, 150, 110, 120, 96].map((w, i) => (
          <div key={i} className="h-9 animate-pulse rounded-lg bg-c10-skeleton" style={{ width: w }} />
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-c10-skeleton" />
        ))}
      </div>
    </div>
  );
}
