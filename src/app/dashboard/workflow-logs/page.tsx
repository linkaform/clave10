"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { LogsTabs } from "@/components/common/LogsTabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import { WorkflowLogsTable } from "@/components/WorkflowLogs/WorkflowLogsTable";
import { WorkflowLogPanel } from "@/components/WorkflowLogs/WorkflowLogPanel";
import { useWorkflowLogs } from "@/hooks/WorkflowLogs/useWorkflowLogs";
import { useWorkflowLogsFilters } from "@/hooks/WorkflowLogs/useWorkflowLogsFilters";

export default function WorkflowLogsPage() {
  const {
    externalFilters,
    onExternalFiltersChange,
    activeFiltersCount,
    queryFilters,
    isSidebarOpen,
    setIsSidebarOpen,
    filtersConfig,
  } = useWorkflowLogsFilters();
  // Paginación en el servidor; 20 está entre los tamaños que ofrece DataTablePagination.
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { workflowLogs, isLoading, refetch } = useWorkflowLogs(
    queryFilters,
    pagination.pageSize,
    pagination.pageIndex * pagination.pageSize,
  );
  const selectedRow = workflowLogs.records.find((r) => r.id === selectedId) ?? null;

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
        <PageHeader title="Logs de workflows"
          hideTotal
          hideSearch
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        >
          <LogsTabs active="workflows" />
        </PageHeader>

        <WorkflowLogsTable
          rows={workflowLogs.records}
          isLoading={isLoading}
          hasNext={workflowLogs.has_next}
          pagination={pagination}
          setPagination={setPagination}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <WorkflowLogPanel row={selectedRow} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
