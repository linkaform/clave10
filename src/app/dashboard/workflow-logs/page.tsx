"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { LogsTabs } from "@/components/common/LogsTabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import PaginationPases from "@/components/pages/pases/PaginationPases";
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
  const [limit, setLimit] = React.useState(25);
  const [skip, setSkip] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { workflowLogs, isLoading, refetch } = useWorkflowLogs(queryFilters, limit, skip);
  const selectedRow = workflowLogs.records.find((r) => r.id === selectedId) ?? null;

  React.useEffect(() => {
    setSkip(0);
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
        <PageHeader title="Logs de workflows" totalRecords={workflowLogs.total_records}
          hideSearch
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        >
          <LogsTabs active="workflows" />
        </PageHeader>

        <WorkflowLogsTable rows={workflowLogs.records} isLoading={isLoading} selectedId={selectedId} onSelect={setSelectedId} />
        {!isLoading && (
          <PaginationPases
            actual_page={workflowLogs.actual_page}
            records_on_page={workflowLogs.records_on_page}
            total_pages={workflowLogs.total_pages}
            total_records={workflowLogs.total_records}
            limit={limit}
            onPageChange={(newSkip, newLimit) => {
              setSkip(newSkip);
              setLimit(newLimit);
            }}
          />
        )}
      </div>

      <WorkflowLogPanel row={selectedRow} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
