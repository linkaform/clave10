import type { FilterState } from "@/types/bitacoras";

export const useFiltersPanel = (
  filters: FilterState,
  onFiltersChange: (filters: FilterState) => void
) => {
  const handleDynamicChange = (
    key: string,
    value: string | string[],
    checked: boolean,
    type: "multiple" | "single" | "multiselect" | "search"
  ) => {
    const currentDynamic = filters.dynamic || {};
    const currentValue = currentDynamic[key];

    let newValue: string | string[];
    if (type === "multiselect") {
      newValue = value as string[];
    } else if (type === "single") {
      newValue = checked ? (value as string) : "";
    } else {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      newValue = checked
        ? [...currentArray, (value as string)]
        : currentArray.filter((v) => v !== (value as string));
    }

    onFiltersChange({
      ...filters,
      dynamic: { ...currentDynamic, [key]: newValue },
    });
  };

  const clearFilters = () => onFiltersChange({ dynamic: {} });

  const hasActiveFilters = Object.values(filters.dynamic || {}).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== ""
  );

  const isChecked = (key: string, value: string) => {
    const currentValue = (filters.dynamic || {})[key];
    return Array.isArray(currentValue)
      ? currentValue.includes(value)
      : currentValue === value;
  };

  return { handleDynamicChange, clearFilters, hasActiveFilters, isChecked };
};