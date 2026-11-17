"use client";

interface PendingChangesFooterProps {
  /** Texto cuando no se está guardando, p.ej. "2 secciones con cambios sin guardar". */
  label: string;
  saving: boolean;
  /** Avance del guardado; con valor se muestra "Guardando X de N...". */
  progress?: { done: number; total: number } | null;
  /** Deshabilita solo "Guardar cambios" (p.ej. mientras corre otra operación). */
  saveDisabled?: boolean;
  /** Tooltip del botón "Guardar cambios" cuando `saveDisabled`. */
  saveDisabledReason?: string;
  onDiscard: () => void;
  onSave: () => void;
}

/**
 * Footer fijo para guardar o descartar cambios pendientes de una pantalla.
 * Quien lo usa decide cuándo pintarlo (normalmente solo si hay cambios).
 */
export function PendingChangesFooter({
  label,
  saving,
  progress,
  saveDisabled = false,
  saveDisabledReason,
  onDiscard,
  onSave,
}: PendingChangesFooterProps) {
  return (
    <div className="sticky bottom-4 z-30 flex items-center justify-end gap-3 rounded-2xl bg-c10-surface px-4 py-3 shadow-[0_0_0_1px_var(--c10-line-card),0_12px_32px_rgba(15,23,42,.14)]">
      <span className="mr-auto flex items-center gap-2 text-sm text-c10-secondary">
        <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
        {saving && progress ? `Guardando ${progress.done} de ${progress.total}...` : label}
      </span>
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        className="h-10 rounded-lg border border-c10-line bg-c10-surface px-4 text-sm font-medium text-c10-text transition-colors duration-150 hover:bg-c10-sunken disabled:opacity-50">
        Descartar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || saveDisabled}
        title={!saving && saveDisabled ? saveDisabledReason : undefined}
        className="h-10 rounded-lg bg-[#2F80ED] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1E6FDB] disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}
