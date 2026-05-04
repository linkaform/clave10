"use client";

import { useMemo } from "react";
import { PhotoGridView } from "@/components/Bitacoras/PhotoGrid/PhotoGridView";
import { PhotoRecord } from "@/types/bitacoras";
import { formatPhotoRecord } from "@/utils/formatRecords";

interface PasesGridProps {
  pases: any[];
  isLoading?: boolean;
}

export default function PasesGrid({ pases, isLoading }: PasesGridProps) {
  const records: PhotoRecord[] = useMemo(
    () => (pases ?? []).map((p) => formatPhotoRecord(p, "pase")),
    [pases],
  );

  return (
    <PhotoGridView
      isLoading={isLoading}
      records={records}
    />
  );
}
