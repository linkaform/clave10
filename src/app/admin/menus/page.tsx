"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

import { useMenuItems } from "@/hooks/menus-admin/useMenuItems";
import {
  useMenuUsers,
  useUserMenuAssignment,
} from "@/hooks/menus-admin/useUserMenuAssignment";
import { MenuUserAssignmentTree } from "@/components/menus-admin/menu-user-assignment-tree";
import { MenuCatalogBoard } from "@/components/menus-admin/menu-catalog-board";
import { ImportCatalogDialog } from "@/components/modals/import-catalog-dialog";
import { MenuItemAdmin } from "@/services/menus-admin";
import { exportMenuItemsToExcel } from "@/lib/menus-admin-export";

export default function AdminMenusPage() {
  const { menuItems, isLoadingMenuItems, saveBoardMutation, replaceCatalogMutation } =
    useMenuItems();
  const [importOpen, setImportOpen] = useState(false);

  const { users, isLoadingUsers } = useMenuUsers();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const selectedUserIdsNum = selectedUserIds.map(Number);
  const { assignedKeys, isLoadingAssignedKeys, saveAssignmentMutation } =
    useUserMenuAssignment(selectedUserIdsNum);
  const [pendingKeys, setPendingKeys] = useState<string[] | null>(null);

  const selectedKeys = pendingKeys ?? assignedKeys;

  const handleSelectUsers = (values: string[]) => {
    setSelectedUserIds(values);
    setPendingKeys(null);
  };

  const handleSaveAssignment = () => {
    saveAssignmentMutation.mutate(selectedKeys, {
      onSuccess: () => setPendingKeys(null),
    });
  };

  const handleSaveBoard = (rows: MenuItemAdmin[], deletedIds: string[]) => {
    saveBoardMutation.mutate({ rows, deletedIds });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Configuración de Menús</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload size={16} /> Importar Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => exportMenuItemsToExcel(menuItems)}
            disabled={menuItems.length === 0}>
            <Download size={16} /> Exportar Excel
          </Button>
        </div>
      </div>

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

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo de Menús</TabsTrigger>
          <TabsTrigger value="asignacion">Asignación por Usuario</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4">
          {isLoadingMenuItems ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <MenuCatalogBoard
              items={menuItems}
              onSave={handleSaveBoard}
              isSaving={saveBoardMutation.isPending}
            />
          )}
        </TabsContent>

        <TabsContent value="asignacion" className="mt-4">
          <div className="mb-4 max-w-sm">
            <MultiSelect values={selectedUserIds} onValuesChange={handleSelectUsers}>
              <MultiSelectTrigger disabled={isLoadingUsers}>
                <MultiSelectValue placeholder="Selecciona uno o más usuarios" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {users.map((user) => (
                  <MultiSelectItem key={user.user_id} value={String(user.user_id)}>
                    {user.nombre || user.username} ({user.user_id})
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>

          {selectedUserIds.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Selecciona uno o más usuarios para ver y editar sus menús asignados.
            </div>
          ) : isLoadingAssignedKeys ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <>
              {selectedUserIds.length > 1 && (
                <p className="text-sm text-muted-foreground mb-2">
                  Mostrando la unión de los menús de los {selectedUserIds.length} usuarios
                  seleccionados. Al guardar, esta misma selección se aplica igual a los{" "}
                  {selectedUserIds.length}.
                </p>
              )}
              <MenuUserAssignmentTree
                items={menuItems}
                selectedKeys={selectedKeys}
                onChange={setPendingKeys}
              />
              <div className="flex justify-end mt-4">
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleSaveAssignment}
                  disabled={saveAssignmentMutation.isPending}>
                  Guardar asignación
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
