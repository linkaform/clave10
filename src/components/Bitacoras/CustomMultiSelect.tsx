import React from "react";

import Select from "react-select";

interface Option {
  value: string;
  label: string;
}

interface CustomMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export const CustomMultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
}: CustomMultiSelectProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <Select
      value={selectedOptions}
      onChange={(newValue) => {
        onChange((newValue as Option[]).map((opt) => opt.value));
      }}
      isMulti
      name="dynamic-select"
      options={options}
      placeholder={placeholder}
      className="basic-multi-select"
      classNamePrefix="select"
      menuPortalTarget={mounted ? (document.body as HTMLElement) : null}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};
