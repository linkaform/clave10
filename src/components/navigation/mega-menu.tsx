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

interface MegaMenuProps {
  modules: MenuModule[];
  basePath?: string;
}

export function MegaMenu({ modules, basePath = "/dashboard" }: MegaMenuProps) {
  const pathname = usePathname();
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
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
            className={cn(
              "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              isActive && "text-primary font-semibold",
            )}>
            {module.label}
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  const columnGroups = groupSectionsByColumn(module.sections);
  const maxColumns = Math.max(...Array.from(columnGroups.keys()), 1);
  const hasSidebar = module.sidebar && module.sidebar.items.length > 0;

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          "bg-transparent data-[state=open]:bg-accent/50",
          isActive && "text-primary font-semibold",
        )}>
        {module.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="md:left-1/2 md:-translate-x-1/2">
        <div className="flex">
          {/* Contenido principal del menú */}
          <div
            className={cn(
              "grid gap-6 p-6",
              maxColumns === 1 && "w-[220px]",
              maxColumns === 2 && "w-[420px] grid-cols-2",
              maxColumns === 3 && "w-[580px] grid-cols-3",
              maxColumns >= 4 && "w-[750px] grid-cols-4",
            )}>
            {Array.from({ length: maxColumns }, (_, i) => i + 1).map(
              (colNum) => (
                <MenuColumn
                  key={colNum}
                  sections={columnGroups.get(colNum) || []}
                  basePath={basePath}
                  moduleKey={module.key}
                />
              ),
            )}
          </div>

          {/* Sidebar opcional */}
          {hasSidebar && (
            <div className="border-l border-border bg-muted/30 p-6 w-[180px]">
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
    <div className="flex flex-col gap-4">
      {sortedSections.map((section) => (
        <MenuSectionComponent
          key={section.id}
          section={section}
          basePath={basePath}
          moduleKey={moduleKey}
        />
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

  const SectionLabel = () => (
    <h4
      className={cn(
        "text-sm font-semibold mb-2 text-foreground transition-colors",
        section.href && "hover:text-primary relative group/section w-max",
      )}>
      {section.label}
      {section.href && (
        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/section:w-1/2" />
      )}
    </h4>
  );

  return (
    <div className="flex flex-col">
      {section.href ? (
        <Link
          href={
            section.href.startsWith("/") && !section.href.startsWith(basePath)
              ? `${basePath}${section.href}`
              : section.href
          }>
          <SectionLabel />
        </Link>
      ) : (
        <SectionLabel />
      )}
      <ul className="flex flex-col gap-1">
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
  let href = item.href;

  if (href) {
    if (href.startsWith("/") && !href.startsWith(basePath)) {
      const [path, query] = href.split("?");
      href = `${basePath}${path}${query ? `?${query}` : ""}`;
    }
  } else {
    href = `${basePath}/${moduleKey}/${sectionKey}/${item.key}`;
  }

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "block text-sm py-1 transition-colors text-foreground hover:text-primary relative group/item",
          item.type === "link" &&
            item.variant === "primary" &&
            "text-primary font-medium",
        )}>
        {item.label}
        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover/item:w-1/2" />
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
