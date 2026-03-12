// components/ui/app-select.tsx
import ReactSelect from "react-select";

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderRadius: "10px",
    border: state.isFocused ? "1px solid #93c5fd" : "1px solid #e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(147,197,253,0.3)" : "none",
    background: "#fff",
    minHeight: "40px",
    fontSize: "14px",
    "&:hover": { borderColor: "#93c5fd" },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 9999,
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: "14px",
    color: state.isSelected ? "#fff" : "#374151",
    background: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "#fff",
    borderRadius: "6px",
    margin: "2px 4px",
    width: "calc(100% - 8px)",
    cursor: "pointer",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#9ca3af",
    fontSize: "14px",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#111827",
    fontSize: "14px",
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
};
interface AppSelectProps {
  options: string[] | { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  noOptionsMessage?: string;
}

export const SearchSelect = ({ options,noOptionsMessage = "Sin opciones", value, onChange, ...props }: AppSelectProps) => {
  const formatted = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  return (
    <ReactSelect
      options={formatted}
      value={value ? { value, label: value } : null}
      onChange={(opt) => onChange(opt?.value ?? "")}
      styles={selectStyles} 
      menuPlacement="auto"
      noOptionsMessage={() => noOptionsMessage} 
      {...props}
    />
  );
};