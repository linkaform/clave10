"use client";

import React from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { LogsTabs } from "@/components/common/LogsTabs";
import { FloatingFiltersDrawer } from "@/components/Bitacoras/PhotoGrid/FloatingFiltersDrawer";
import PaginationPases from "@/components/pages/pases/PaginationPases";
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
  const [limit, setLimit] = React.useState(25);
  const [skip, setSkip] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { scriptLogs, isLoading, refetch } = useScriptLogs(queryFilters, limit, skip);
  const selectedRow = scriptLogs.records.find((r) => r.id === selectedId) ?? null;

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
        <PageHeader
          title="Logs de scripts"
          totalRecords={scriptLogs.total_records}
          hideSearch
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        >
          <LogsTabs active="script" />
        </PageHeader>

        <ScriptLogsTable rows={scriptLogs.records} isLoading={isLoading} selectedId={selectedId} onSelect={setSelectedId} />
        {!isLoading && (
          <PaginationPases
            actual_page={scriptLogs.actual_page}
            records_on_page={scriptLogs.records_on_page}
            total_pages={scriptLogs.total_pages}
            total_records={scriptLogs.total_records}
            limit={limit}
            onPageChange={(newSkip, newLimit) => {
              setSkip(newSkip);
              setLimit(newLimit);
            }}
          />
        )}
      </div>

      <ScriptLogPanel row={selectedRow} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
