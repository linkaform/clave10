"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Check, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuModule } from "@/types/menu-types";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
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

export function MobileMenu({ modules, basePath = "/dashboard" }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  const { locations } = useAreasLocationStore();
  const { selectedLocations, toggleLocation } = useSelectedLocationsStore();
  const locationLabel =
    selectedLocations.length === 0
      ? "Seleccionar Ubicación"
      : selectedLocations.length === 1
        ? selectedLocations[0]
        : `${selectedLocations.length} ubicaciones`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] sm:max-w-sm overflow-y-auto p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <Accordion type="multiple" className="px-4">
          <AccordionItem value="ubicacion">
            <AccordionTrigger
              className={cn("text-sm", selectedLocations.length > 0 && "text-primary font-semibold")}>
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" strokeWidth={1.5} />
                {locationLabel}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1 pl-2 max-h-[240px] overflow-y-auto">
                {locations.length > 0 ? (
                  locations.map((loc) => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleLocation(loc)}
                        className="flex items-center justify-between gap-3 py-1.5 text-sm text-foreground hover:text-primary">
                        {loc}
                        <div
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-muted-foreground/40",
                          )}>
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-2 text-sm text-muted-foreground text-center">
                    No hay ubicaciones
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          {sortedModules.map((module) => {
            const isActive = pathname.includes(`${basePath}/${module.key}`);

            if (module.sections.length === 0 && module.href) {
              return (
                <Link
                  key={module.id}
                  href={resolveHref(basePath, module.href)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-4 text-sm font-medium border-b border-border",
                    isActive && "text-primary font-semibold",
                  )}>
                  {module.label}
                </Link>
              );
            }

            const sortedSections = [...module.sections].sort(
              (a, b) => a.order - b.order,
            );

            return (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger
                  className={cn("text-sm", isActive && "text-primary font-semibold")}>
                  {module.label}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-4 pl-2">
                    {sortedSections.map((section) => {
                      const sortedItems = [...section.items].sort(
                        (a, b) => a.order - b.order,
                      );
                      return (
                        <div key={section.id} className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {section.label}
                          </span>
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
                              onClick={() => setOpen(false)}
                              className={cn(
                                "text-sm py-1 text-foreground hover:text-primary",
                                item.type === "link" &&
                                  item.variant === "primary" &&
                                  "text-primary font-medium",
                              )}>
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                    {module.sidebar && module.sidebar.items.length > 0 && (
                      <div className="flex flex-col gap-1 border-t border-border pt-3">
                        {module.sidebar.items.map((item) => {
                          const href =
                            item.type === "link"
                              ? resolveHref(basePath, item.href, module.key)
                              : undefined;
                          return href ? (
                            <Link
                              key={item.key}
                              href={href}
                              onClick={() => setOpen(false)}
                              className="text-sm py-1 text-foreground hover:text-primary">
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              key={item.key}
                              type="button"
                              className="text-sm py-1 text-left text-foreground hover:text-primary"
                              onClick={() => setOpen(false)}>
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
