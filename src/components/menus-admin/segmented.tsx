import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Ancho fijo por opción (px). */
  itemWidth?: number;
}

/** Control segmentado del diseño (borde #E2E8F0, opción activa azul). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  itemWidth,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--c10-line)]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            style={itemWidth ? { width: itemWidth } : undefined}
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 whitespace-nowrap px-3 text-sm transition-colors duration-150 [&+&]:shadow-[-1px_0_0_var(--c10-line)]",
              active
                ? "bg-[#2F80ED] font-semibold text-white"
                : "bg-c10-surface font-medium text-c10-label hover:bg-c10-panel",
            )}>
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
