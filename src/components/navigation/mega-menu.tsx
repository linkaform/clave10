"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
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

const TRIGGER_CLASS =
  "inline-flex h-8 w-max items-center rounded-lg bg-transparent px-[7px] text-[13px] min-[1200px]:px-[9px] min-[1200px]:text-sm min-[1440px]:px-[11px] font-medium text-c10-label whitespace-nowrap transition-colors duration-150 hover:bg-c10-sunken hover:text-c10-title focus:bg-c10-sunken focus:outline-none";

interface MegaMenuProps {
  modules: MenuModule[];
  basePath?: string;
}

export function MegaMenu({ modules, basePath = "/dashboard" }: MegaMenuProps) {
  const pathname = usePathname();
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);

  return (
    <NavigationMenu viewport={false} className="max-w-full justify-end">
      <NavigationMenuList className="flex-wrap justify-end gap-0.5 py-2">
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
              TRIGGER_CLASS,
              isActive && "text-[#2F80ED]",
            )}>
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
  const maxColumns = populatedColumns.length || 1;
  const hasSidebar = module.sidebar && module.sidebar.items.length > 0;

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          TRIGGER_CLASS,
          "[&>svg]:hidden data-[state=open]:bg-c10-sunken data-[state=open]:text-[#2F80ED] data-[state=open]:hover:bg-c10-sunken data-[state=open]:focus:bg-c10-sunken",
          isActive && "text-[#2F80ED]",
        )}>
        {module.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="md:!fixed md:!top-[var(--c10-header-h,65px)] md:!left-0 md:!right-0 md:!mt-0 md:!w-screen md:!translate-x-0 md:!rounded-none md:!border-0 md:!border-b md:!border-c10-line-card md:!bg-c10-surface md:!p-0 md:!shadow-[0_16px_32px_rgba(15,23,42,.08)] max-h-[calc(100vh-var(--c10-header-h,65px))] overflow-y-auto">
        <div className="flex justify-center px-6 pb-8 pt-7 font-[Arial,Helvetica,sans-serif]">
          <div
            className="grid w-fit max-w-full gap-x-10 gap-y-7 min-[1440px]:gap-x-14"
            style={{
              gridTemplateColumns: `repeat(${maxColumns}, minmax(168px, max-content))`,
            }}>
            {populatedColumns.map((sections, i) => (
              <MenuColumn
                key={i}
                sections={sections}
                basePath={basePath}
                moduleKey={module.key}
              />
            ))}
          </div>

          {/* Sidebar opcional */}
          {hasSidebar && (
            <div className="ml-12 w-[180px] border-l border-c10-line-card pl-8">
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
    <div className="flex flex-col">
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
        "mb-2.5 text-sm font-bold text-c10-title transition-colors duration-150",
        section.href && "w-max hover:text-[#2F80ED]",
      )}>
      {section.label}
    </h4>
  );

  return (
    <div className="flex flex-col [&+&]:mt-4 [&+&]:border-t [&+&]:border-c10-line-card [&+&]:pt-3.5">
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
  let href = item.href;

  if (href) {
    if (href.startsWith("/") && !href.startsWith(basePath)) {
      const [path, query] = href.split("?");
      href = `${basePath}${path}${query ? `?${query}` : ""}`;
    }
  } else {
    href = `${basePath}/${moduleKey}/${sectionKey}/${item.key}`;
  }

  const isAction = item.label.trim().startsWith("+");

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1.5 py-1 text-sm text-c10-secondary transition-colors duration-150 hover:text-[#2F80ED]",
          item.type === "link" && item.variant === "primary" && "text-[#2F80ED]",
        )}>
        {isAction ? (
          <>
            <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="italic">{item.label.trim().replace(/^\+\s*/, "")}</span>
          </>
        ) : (
          item.label
        )}
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
                  "block py-1 text-sm transition-colors duration-150 hover:text-[#2F80ED]",
                  item.variant === "primary" ? "text-[#2F80ED]" : "text-c10-secondary",
                )}>
                {item.label}
              </Link>
            ) : (
              <button
                className="block w-full py-1 text-left text-sm text-c10-secondary transition-colors duration-150 hover:text-[#2F80ED]"
                onClick={() => {
                  // Aquí puedes manejar acciones personalizadas
                  console.log(`Action triggered: ${item.key}`);
                }}>
                {item.label}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
