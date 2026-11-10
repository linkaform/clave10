import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckState = "all" | "some" | "none";

interface AssignCheckboxProps {
  state: CheckState;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}

/** Checkbox de 20px del diseño, con estado parcial (guion). */
export function AssignCheckbox({ state, onToggle, label, disabled }: AssignCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={state === "all" ? true : state === "some" ? "mixed" : false}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        state === "none"
          ? "border-c10-line-strong bg-c10-surface hover:border-[#2F80ED]"
          : "border-[#2F80ED] bg-[#2F80ED] hover:bg-[#1E6FDB]",
      )}>
      {state === "all" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {state === "some" && <Minus className="h-3.5 w-3.5" strokeWidth={3} />}
    </button>
  );
}

/** Estado de un conjunto de keys dentro de las asignadas. */
export function checkState(keys: string[], assigned: Set<string>): CheckState {
  if (keys.length === 0) return "none";
  let n = 0;
  for (const k of keys) if (assigned.has(k)) n++;
  return n === 0 ? "none" : n === keys.length ? "all" : "some";
}
