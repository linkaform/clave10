"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { LogsTabs } from "@/components/common/LogsTabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { ScriptLogsTable } from "@/components/ScriptLogs/ScriptLogsTable";
import { ScriptLogPanel } from "@/components/ScriptLogs/ScriptLogPanel";
import { useScriptLogs } from "@/hooks/ScriptLogs/useScriptLogs";
import { useScriptLogsFilters } from "@/hooks/ScriptLogs/useScriptLogsFilters";

export default function ScriptLogsPage() {
  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    queryFilters,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
  } = useScriptLogsFilters();
  // Paginación en el servidor; 20 está entre los tamaños que ofrece DataTablePagination.
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { scriptLogs, isLoading, refetch } = useScriptLogs(
    queryFilters,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
  );
  const selectedRow = scriptLogs.records.find((r) => r.id === selectedId) ?? null;

  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [queryFilters]);

  return (
    <div className="w-full relative">
      <FloatingFiltersDrawer
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        activeFiltersCount={activeFiltersCount}
        filters={externalFilters}
        onFiltersChange={onExternalFiltersChange}
        filtersConfig={filtersConfig}
      />
      <div className="p-6 space-y-4 pt-3 w-full">
        <PageHeader
          title="Logs de scripts"
          hideTotal
          hideSearch
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        >
          <LogsTabs active="script" />
        </PageHeader>

        <ScriptLogsTable 
          rows={scriptLogs.records}
          isLoading={isLoading}
          hasNext={scriptLogs.has_next}
          pagination={pagination}
          setPagination={setPagination}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <ScriptLogPanel row={selectedRow} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
