import { cn } from "@/lib/utils";

interface IconActionProps {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}

/** Botón de ícono redondo gris (editar/eliminar) del editor de menús. */
export function IconAction({ title, onClick, danger, children }: IconActionProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-c10-faint transition-colors duration-150",
        danger
          ? "hover:bg-c10-red-subtle hover:text-[#DC2626]"
          : "hover:bg-c10-blue-light hover:text-[#2F80ED]",
      )}>
      {children}
    </button>
  );
}
