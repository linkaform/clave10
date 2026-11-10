"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InlineNameProps {
  value: string;
  editing: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  /** Doble clic sobre el nombre (abre el modal completo). */
  onDoubleClick?: () => void;
  onClick?: () => void;
  className?: string;
  inputClassName?: string;
}

/**
 * Nombre que se vuelve input al editar: Enter o salir del campo aplica,
 * Escape cancela. Vacío o sin cambios no hace nada.
 */
export function InlineName({
  value,
  editing,
  onSubmit,
  onCancel,
  onDoubleClick,
  onClick,
  className,
  inputClassName,
}: InlineNameProps) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      doneRef.current = false;
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, value]);

  const commit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const next = draft.trim();
    if (next && next !== value) onSubmit(next);
    else onCancel();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label="Nombre"
        onChange={(e) => setDraft(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            doneRef.current = true;
            onCancel();
          }
        }}
        onBlur={commit}
        className={cn(
          "h-[30px] min-w-0 flex-1 rounded-md border border-[#2F80ED] bg-c10-surface px-2 text-sm text-c10-title shadow-[0_0_0_3px_rgba(59,130,246,.15)] outline-none",
          inputClassName,
        )}
      />
    );
  }

  return (
    <span
      title={value}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn("min-w-0 flex-1 truncate", className)}>
      {value}
    </span>
  );
}
