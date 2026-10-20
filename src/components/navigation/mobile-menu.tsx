"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Check, ChevronDown, Menu, X } from "lucide-react";
import { MenuItemLabel } from "./menu-item-label";
import { cn } from "@/lib/utils";
import type { MenuItem, MenuModule } from "@/types/menu-types";
import { useLocationOptions } from "@/hooks/useLocationOptions";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";

interface MobileMenuProps {
  modules: MenuModule[];
  basePath?: string;
}

function resolveHref(
  basePath: string,
  href?: string,
  moduleKey?: string,
  sectionKey?: string,
  itemKey?: string,
) {
  if (!href) {
    return `${basePath}/${moduleKey}/${sectionKey}/${itemKey}`;
  }
  if (href.startsWith("/") && !href.startsWith(basePath)) {
    const [path, query] = href.split("?");
    return `${basePath}${path}${query ? `?${query}` : ""}`;
  }
  return href;
}

const itemClassName =
  "min-h-10 flex items-center gap-2 text-[15px] text-slate-600 hover:text-button-primary";

function ItemLabel({ item }: { item: MenuItem }) {
  return <MenuItemLabel label={item.label} iconClassName="h-4 w-4" />;
}

// Panel de pantalla completa bajo el header (h-14), visible debajo de lg.
export function MobileMenu({ modules, basePath = "/dashboard" }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [openModule, setOpenModule] = React.useState<string | null>(null);
  const [locOpen, setLocOpen] = React.useState(false);
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  const locations = useLocationOptions();
  const { selectedLocations, toggleLocation } = useSelectedLocationsStore();
  const locationLabel =
    selectedLocations.length === 0
      ? "Seleccionar Ubicación"
      : selectedLocations.length === 1
        ? selectedLocations[0]
        : `${selectedLocations.length} ubicaciones`;

  const close = () => setOpen(false);

  // Cerrar al navegar y bloquear el scroll del fondo mientras está abierto.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="lg:hidden h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-[10px] text-slate-900 hover:bg-slate-100">
        {open ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
      </button>

      {open && (
        <div className="lg:hidden fixed left-0 right-0 top-14 bottom-0 z-50 overflow-y-auto bg-white px-4 pt-3 pb-10 animate-in fade-in-0 duration-200">
          {/* Ubicación */}
          <button
            type="button"
            onClick={() => setLocOpen((v) => !v)}
            className="w-full min-h-12 mb-2 flex items-center gap-2.5 px-3.5 rounded-xl border border-gray-200 bg-slate-50 text-[15px] text-slate-900">
            <Building2 className="h-[18px] w-[18px] text-slate-500" />
            <span className="flex-1 text-left font-semibold truncate">{locationLabel}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200",
                locOpen && "rotate-180 text-button-primary",
              )}
            />
          </button>
          {locOpen && (
            <div className="mb-2 flex flex-col gap-0.5 rounded-xl border border-gray-200 p-1.5">
              {locations.length > 0 ? (
                locations.map((loc) => {
                  const isSelected = selectedLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className="min-h-10 flex items-center gap-2.5 px-2 rounded-lg text-[15px] text-neutral-900 hover:bg-slate-100">
                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-button-primary border-button-primary"
                            : "bg-white border-slate-300",
                        )}>
                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                      </div>
                      <span className="flex-1 text-left">{loc}</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-2 text-sm text-muted-foreground text-center">
                  No hay ubicaciones
                </div>
              )}
            </div>
          )}

          {/* Módulos */}
          {sortedModules.map((module) => {
            const isActive = pathname.includes(`${basePath}/${module.key}`);

            if (module.sections.length === 0 && module.href) {
              return (
                <Link
                  key={module.id}
                  href={resolveHref(basePath, module.href)}
                  onClick={close}
                  className={cn(
                    "min-h-[52px] flex items-center px-1 border-b border-slate-100 text-base font-semibold text-slate-900",
                    isActive && "text-button-primary",
                  )}>
                  {module.label}
                </Link>
              );
            }

            const isOpen = openModule === module.id;
            const sortedSections = [...module.sections].sort((a, b) => a.order - b.order);

            return (
              <div key={module.id} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenModule(isOpen ? null : module.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    "w-full min-h-[52px] flex items-center justify-between px-1 text-base font-semibold text-slate-900",
                    isActive && "text-button-primary",
                  )}>
                  <span>{module.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-[18px] w-[18px] text-slate-400 transition-transform duration-200",
                      isOpen && "rotate-180 text-button-primary",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-1 pb-3 animate-in fade-in-0 duration-200">
                    {sortedSections.map((section) => {
                      const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
                      return (
                        <div
                          key={section.id}
                          className="flex flex-col gap-1.5 py-3.5 border-t border-slate-100">
                          {section.href ? (
                            <Link
                              href={resolveHref(basePath, section.href)}
                              onClick={close}
                              className="py-1.5 text-[15px] font-bold text-slate-900 hover:text-button-primary">
                              {section.label}
                            </Link>
                          ) : (
                            <span className="py-1.5 text-[15px] font-bold text-slate-900">
                              {section.label}
                            </span>
                          )}
                          {sortedItems.map((item) => (
                            <Link
                              key={item.key}
                              href={resolveHref(
                                basePath,
                                item.href,
                                module.key,
                                section.key,
                                item.key,
                              )}
                              onClick={close}
                              className={cn(
                                itemClassName,
                                item.type === "link" &&
                                  item.variant === "primary" &&
                                  "text-button-primary font-medium",
                              )}>
                              <ItemLabel item={item} />
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                    {module.sidebar && module.sidebar.items.length > 0 && (
                      <div className="flex flex-col gap-1.5 py-3.5 border-t border-slate-100">
                        {module.sidebar.items.map((item) => {
                          const href =
                            item.type === "link"
                              ? resolveHref(basePath, item.href, module.key)
                              : undefined;
                          return href ? (
                            <Link key={item.key} href={href} onClick={close} className={itemClassName}>
                              <ItemLabel item={item} />
                            </Link>
                          ) : (
                            <button
                              key={item.key}
                              type="button"
                              className={cn(itemClassName, "text-left")}
                              onClick={close}>
                              <ItemLabel item={item} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
