import { cn } from "@/lib/utils";

interface ConfigCardProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Tarjeta blanca de las secciones de Configuración (radio 20, sombra suave). */
export function ConfigCard({ title, actions, className, children }: ConfigCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-[18px] rounded-[20px] bg-c10-surface px-[22px] pb-[22px] pt-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]",
        className,
      )}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          {title && (
            <div className="text-base font-semibold tracking-[-0.01em] text-c10-title">
              {title}
            </div>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
