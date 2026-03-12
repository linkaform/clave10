import { useMemo, useState } from "react";

const normalize = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function useTagFilter<T extends Record<string, any>>(
  data: T[] | undefined,
  getSearchText: (row: T) => string
) {
  const [tags, setTags] = useState<string[]>([]);

  const safeData = Array.isArray(data) ? data : [];

  const filteredData = useMemo(() => {
    if (tags.length === 0) return safeData;

    return safeData.filter((row) => {
      const texto = normalize(getSearchText(row));
      return tags.some((tag) => texto.includes(normalize(tag)));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeData, tags]);

  return { tags, setTags, filteredData };
}