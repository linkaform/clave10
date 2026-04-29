"use client";

import React, { useEffect, useState } from "react";
import { useGetMyPases } from "@/hooks/useGetMyPases";
import PasesEntradaTable from "@/components/table/pases-entrada/table";
import PaginationPases from "@/components/pages/pases/PaginationPases";
import { useSearchParams } from "next/navigation";
import { useBoothStore } from "@/store/useBoothStore";

const ListaPasesPage = () => {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <ListaPasesContent />
    </React.Suspense>
  );
};

const ListaPasesContent = () => {
  const [limit, setLimit] = useState(25);
  const [skip, setSkip] = useState(0);
  const [searchName, setSearchName] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("");
  const searchParams = useSearchParams();
  const { location } = useBoothStore();

  useEffect(() => {
    const status = searchParams.get("status");
    setActiveStatus(status ?? "");
  }, [searchParams]);

  const { data, isLoading } = useGetMyPases({
    skip,
    limit,
    searchName,
    tab: activeStatus,
    location: location ?? "",
  });
  const { records, actual_page, records_on_page, total_pages, total_records } =
    data || {};

  const handlePageChange = (newSkip: number, newLimit: number) => {
    setSkip(newSkip);
    setLimit(newLimit);
  };

  return (
    <div className="">
      <div className="flex flex-col m-3">
        <PasesEntradaTable
          isLoading={isLoading}
          pases={records ?? []}
          onSearch={setSearchName}
          title="Historial De Pases De Entrada"
        />
        {!isLoading && (
          <PaginationPases
            actual_page={actual_page}
            records_on_page={records_on_page}
            total_pages={total_pages}
            total_records={total_records}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default ListaPasesPage;
