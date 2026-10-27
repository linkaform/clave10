"use client";

import React from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { FacetSearch } from "@/components/common/FacetSearch";
import { UsersTable } from "@/components/Users/UsersTable";
import { UserPanel } from "@/components/Users/UserPanel";
import { UserFormModal } from "@/components/Users/UserFormModal";
import { UserImportModal } from "@/components/Users/UserImportModal";
import { useUsers } from "@/hooks/Users/useUsers";
import { useUsersFilters } from "@/hooks/Users/useUsersFilters";

export default function UsuariosPage() {
  const { fields, facets, setFacets, queryFilters } = useUsersFilters();
  // Paginación en el servidor; 20 está entre los tamaños que ofrece DataTablePagination.
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  const { users, isLoading, refetch } = useUsers(
    queryFilters,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
  );
  const selectedRow = users.records.find((r) => r.id === selectedId) ?? null;

  // Cambiar los filtros regresa a la página 1.
  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [queryFilters]);

  const onSelect = React.useCallback((id: string, edit = false) => {
    setSelectedId(id);
    setEditing(edit);
  }, []);

  return (
    <div className="w-full relative">
      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title="Usuarios"
          totalRecords={users.total_records}
          isLoadingTotal={isLoading}
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
          search={
            <FacetSearch
              fields={fields}
              facets={facets}
              onChange={setFacets}
              placeholder="Buscar por nombre, email, username o estatus..."
            />
          }
        >
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setImportOpen(true)}
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} />
            Nuevo usuario
          </Button>
        </PageHeader>

        <UsersTable
          rows={users.records}
          isLoading={isLoading}
          total={users.total_records}
          pagination={pagination}
          setPagination={setPagination}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>

      <UserFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <UserImportModal open={importOpen} onOpenChange={setImportOpen} />
      <UserPanel
        row={selectedRow}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setEditing(false);
          }
        }}
        editing={editing}
        onEditingChange={setEditing}
      />
    </div>
  );
}
