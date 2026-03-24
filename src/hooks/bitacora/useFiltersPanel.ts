import type { FilterState } from "@/types/bitacoras";

export const useFiltersPanel = (
  filters: FilterState,
  onFiltersChange: (filters: FilterState) => void,
) => {
  const handleDynamicChange = (
    key: string,
    value: string | string[],
    checked: boolean,
    type: "multiple" | "single" | "multiselect" | "search",
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
        ? [...currentArray, value as string]
        : currentArray.filter((v) => v !== (value as string));
    }

    onFiltersChange({
      ...filters,
      dynamic: { ...currentDynamic, [key]: newValue },
    });
  };

  const clearFilters = () =>
    onFiltersChange({
      dynamic: { ubicacion: [] },
      dateFilter: "",
      date1: "",
      date2: "",
    });

  const hasActiveFilters =
    Object.entries(filters.dynamic || {}).some(([key, v]) => {
      if (key === "ubicacion") {
        return Array.isArray(v) ? v.length > 0 : !!v;
      }
      return Array.isArray(v) ? v.length > 0 : v !== "";
    }) ||
    filters.dateFilter !== "" ||
    !!filters.date1 ||
    !!filters.date2;

  const isChecked = (key: string, value: string) => {
    const currentValue = (filters.dynamic || {})[key];
    return Array.isArray(currentValue)
      ? currentValue.includes(value)
      : currentValue === value;
  };

  return { handleDynamicChange, clearFilters, hasActiveFilters, isChecked };
};
