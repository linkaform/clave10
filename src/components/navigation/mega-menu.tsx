"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/navigation/navigation-menu";
import type { MenuModule, MenuSection, MenuItem } from "@/types/menu-types";
import { groupSectionsByColumn } from "@/types/menu-types";
import { MenuItemLabel } from "./menu-item-label";

interface MegaMenuProps {
  modules: MenuModule[];
  basePath?: string;
}

export function MegaMenu({ modules, basePath = "/dashboard" }: MegaMenuProps) {
  const pathname = usePathname();
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <NavigationMenu viewport={false} className="max-w-none justify-end">
      <NavigationMenuList className="flex-wrap justify-end gap-0.5">
        {sortedModules.map((module) => (
          <MegaMenuItem
            key={module.id}
            module={module}
            basePath={basePath}
            isActive={pathname.includes(`${basePath}/${module.key}`)}
          />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const triggerClassName =
  "h-8 w-max inline-flex items-center rounded-lg bg-transparent px-[7px] xl:px-[9px] 2xl:px-[11px] text-[13px] xl:text-sm font-medium whitespace-nowrap text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:outline-none data-[state=open]:bg-transparent data-[state=open]:text-button-primary data-[state=open]:hover:bg-slate-100 data-[state=open]:focus:bg-slate-100";

function resolveHref(href: string, basePath: string) {
  if (href.startsWith("/") && !href.startsWith(basePath)) {
    const [path, query] = href.split("?");
    return `${basePath}${path}${query ? `?${query}` : ""}`;
  }
  return href;
}

interface MegaMenuItemProps {
  module: MenuModule;
  basePath: string;
  isActive: boolean;
}

function MegaMenuItem({ module, basePath, isActive }: MegaMenuItemProps) {
  // Si el módulo no tiene secciones, es un enlace directo
  if (module.sections.length === 0 && module.href) {
    return (
      <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link
            href={module.href}
            className={cn(triggerClassName, isActive && "text-button-primary")}>
            {module.label}
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  const columnGroups = groupSectionsByColumn(module.sections);
  const populatedColumns = Array.from(columnGroups.entries())
    .sort(([a], [b]) => a - b)
    .map(([, sections]) => sections);
  const hasSidebar = module.sidebar && module.sidebar.items.length > 0;

  return (
    <NavigationMenuItem className="static">
      <NavigationMenuTrigger
        className={cn(
          triggerClassName,
          "[&>svg]:hidden",
          isActive && "text-button-primary",
        )}>
        {module.label}
      </NavigationMenuTrigger>
      {/* Panel de ancho completo pegado al borde inferior del header (h-16). */}
      <NavigationMenuContent className="md:!fixed md:!top-16 md:!left-0 md:!right-0 md:!mt-0 md:!w-screen !p-0 md:!rounded-none md:!border-0 md:!border-b md:!border-gray-200 md:!bg-white md:!shadow-[0_16px_32px_rgba(15,23,42,.08)] max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex flex-wrap justify-center items-start gap-x-10 2xl:gap-x-14 gap-y-7 px-6 pt-7 pb-8">
          {populatedColumns.map((sections, i) => (
            <MenuColumn
              key={i}
              sections={sections}
              basePath={basePath}
              moduleKey={module.key}
            />
          ))}

          {hasSidebar && (
            <div className="min-w-[168px] pl-10 border-l border-slate-100">
              <MenuSidebar items={module.sidebar!.items} basePath={basePath} />
            </div>
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

interface MenuColumnProps {
  sections: MenuSection[];
  basePath: string;
  moduleKey: string;
}

function MenuColumn({ sections, basePath, moduleKey }: MenuColumnProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-w-[168px] flex flex-col gap-2.5">
      {sortedSections.map((section, i) => (
        <div key={section.id} className={cn(i > 0 && "pt-2.5 border-t border-gray-200")}>
          <MenuSectionComponent section={section} basePath={basePath} moduleKey={moduleKey} />
        </div>
      ))}
    </div>
  );
}

interface MenuSectionComponentProps {
  section: MenuSection;
  basePath: string;
  moduleKey: string;
}

function MenuSectionComponent({
  section,
  basePath,
  moduleKey,
}: MenuSectionComponentProps) {
  const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
  const titleClassName = "text-sm font-bold text-slate-900 transition-colors";

  return (
    <div className="flex flex-col gap-1.5">
      {section.href ? (
        <Link
          href={resolveHref(section.href, basePath)}
          className={cn(titleClassName, "w-max hover:text-button-primary")}>
          {section.label}
        </Link>
      ) : (
        <h4 className={titleClassName}>{section.label}</h4>
      )}
      <ul className="flex flex-col gap-0.5">
        {sortedItems.map((item) => (
          <MenuItemComponent
            key={item.key}
            item={item}
            basePath={basePath}
            moduleKey={moduleKey}
            sectionKey={section.key}
          />
        ))}
      </ul>
    </div>
  );
}

interface MenuItemComponentProps {
  item: MenuItem;
  basePath: string;
  moduleKey: string;
  sectionKey: string;
}

function MenuItemComponent({
  item,
  basePath,
  moduleKey,
  sectionKey,
}: MenuItemComponentProps) {
  const href = item.href
    ? resolveHref(item.href, basePath)
    : `${basePath}/${moduleKey}/${sectionKey}/${item.key}`;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1.5 text-sm py-1 text-slate-600 transition-colors hover:text-button-primary",
          item.type === "link" && item.variant === "primary" && "text-button-primary font-medium",
        )}>
        <MenuItemLabel label={item.label} />
      </Link>
    </li>
  );
}

interface MenuSidebarProps {
  items: MenuItem[];
  basePath: string;
}

function MenuSidebar({ items, basePath }: MenuSidebarProps) {
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <ul className="flex flex-col gap-2">
      {sortedItems.map((item) => {
        let href = item.href;
        if (href && href.startsWith("/") && !href.startsWith(basePath)) {
          const [path, query] = href.split("?");
          href = `${basePath}${path}${query ? `?${query}` : ""}`;
        }

        return (
          <li key={item.key}>
            {item.type === "link" && href ? (
              <Link
                href={href}
                className={cn(
                  "block text-sm py-1 transition-colors relative group/sidebar-item",
                  item.variant === "primary"
                    ? "text-primary hover:text-primary/80 font-medium"
                    : "text-foreground hover:text-primary",
                )}>
                {item.label}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/sidebar-item:w-1/2" />
              </Link>
            ) : (
              <button
                className="block text-sm py-1 text-foreground hover:text-primary transition-colors w-full text-left relative group/sidebar-btn"
                onClick={() => {
                  // Aquí puedes manejar acciones personalizadas
                  console.log(`Action triggered: ${item.key}`);
                }}>
                {item.label}
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/sidebar-btn:w-1/2" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
