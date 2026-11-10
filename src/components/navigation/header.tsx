"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Settings,
  StickyNote,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MegaMenu } from "./mega-menu";
import { MobileMenu } from "./mobile-menu";
import type { MenuConfig } from "@/types/menu-types";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useLocationOptions } from "@/hooks/useLocationOptions";

import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface HeaderProps {
  menuConfig: MenuConfig;
  user?: {
    name?: string;
    email?: string;
    /** Usuario con el que inicia sesión; se muestra bajo el nombre. */
    login?: string;
    avatar?: string;
  };
  logo?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  onLogout?: () => void;
}

export function Header({
  menuConfig,
  user,
  logo = {
    src: "https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png",
    alt: "Logo",
    width: 120,
    height: 40,
  },
  onLogout,
}: HeaderProps) {
  const { fetchLocations } = useAreasLocationStore();
  const locations = useLocationOptions();
  const {
    selectedLocations,
    toggleLocation,
    setSelectedLocations,
    clearSelectedLocations,
  } = useSelectedLocationsStore();

  useEffect(() => {
    useAreasLocationStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Altura real del header (puede crecer si los módulos hacen wrap) para que
  // el panel del mega-menú se ancle justo debajo.
  const headerRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () =>
      document.documentElement.style.setProperty(
        "--c10-header-h",
        `${el.getBoundingClientRect().height}px`,
      );
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const allSelected =
    locations.length > 0 && locations.every((l) => selectedLocations.includes(l));

  const toggleAll = () => {
    if (allSelected) clearSelectedLocations();
    else setSelectedLocations([...locations]);
  };

  const triggerLabel =
    selectedLocations.length === 0
      ? "Seleccionar Ubicación"
      : selectedLocations.length === 1
        ? selectedLocations[0]
        : `${selectedLocations.length} ubicaciones`;

  // Si el nombre y el correo son iguales (usuarios sin nombre capturado),
  // no se repite la segunda línea.
  const loginRaw = user?.login || user?.email;
  const userLogin = loginRaw && loginRaw !== user?.name ? loginRaw : undefined;
  // En el botón va el nombre corto (dos palabras); en el menú, el completo.
  const userShort = (user?.name || "Usuario").split(" ").slice(0, 2).join(" ");

  const locCount =
    selectedLocations.length === 0
      ? `${locations.length} disponibles`
      : `${selectedLocations.length} de ${locations.length} seleccionadas`;

  return (
    <header ref={headerRef} className="sticky top-0 left-0 z-50 w-full border-b border-c10-line-card bg-c10-surface font-[Arial,Helvetica,sans-serif]">
      <div className="flex min-h-16 items-center gap-3 px-4 min-[1440px]:gap-5 min-[1440px]:px-6">
        {/* Menú móvil / tablet */}
        <MobileMenu modules={menuConfig.modules} basePath="/dashboard" />

        {/* Logo */}
        <Link
          href="/"
          aria-label="Ir a Inicio"
          className="relative flex h-10 w-[104px] flex-shrink-0 items-center">
          <Image
            src={logo.src}
            alt={logo.alt}
            fill
            priority
            className="object-contain object-left dark:brightness-0 dark:invert"
            sizes="104px"
          />
        </Link>

        <div className="hidden h-6 w-px bg-c10-line-card min-[1080px]:block" />

        {/* Ubicación */}
        <div className="hidden flex-shrink-0 min-[1080px]:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title={triggerLabel}
                className="group flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-transparent pl-2 pr-2.5 text-sm text-c10-text transition-colors duration-150 hover:bg-c10-sunken focus:outline-none data-[state=open]:border-c10-line data-[state=open]:bg-c10-panel">
                <Building2 className="h-4 w-4 text-c10-meta" strokeWidth={2} />
                <span
                  className={cn(
                    "hidden max-w-[200px] truncate font-medium min-[1440px]:inline",
                    selectedLocations.length === 0 && "text-c10-meta",
                  )}>
                  {triggerLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-c10-faint transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={10}
              className="w-80 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_16px_40px_rgba(15,23,42,.14),0_2px_6px_rgba(15,23,42,.06)]">
              <div className="flex items-start justify-between gap-2 px-4 pb-2.5 pt-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-c10-title">Ubicaciones</span>
                  <span className="text-xs text-c10-meta">{locCount}</span>
                </div>
                {locations.length > 1 && (
                  <button
                    onClick={toggleAll}
                    className="h-7 rounded-lg bg-c10-sunken px-2.5 text-xs font-semibold text-c10-secondary transition-colors duration-150 hover:bg-c10-blue-light hover:text-[#2F80ED]">
                    {allSelected ? "Quitar todas" : "Todas"}
                  </button>
                )}
              </div>
              <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
                {locations.length > 0 ? (
                  locations.map((loc) => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                      <DropdownMenuItem
                        key={loc}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 text-sm text-c10-text transition-colors duration-150 focus:bg-c10-sunken",
                          isSelected && "bg-c10-blue-subtle",
                        )}
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleLocation(loc);
                        }}>
                        <div
                          className={cn(
                            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors duration-150",
                            isSelected
                              ? "border-[#2F80ED] bg-[#2F80ED]"
                              : "border-c10-line-strong bg-c10-surface",
                          )}>
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate",
                            isSelected && "font-semibold",
                          )}>
                          {loc}
                        </span>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-c10-meta">
                    No hay ubicaciones
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navegación */}
        <nav className="hidden min-w-0 flex-1 items-center justify-end min-[1080px]:flex">
          <MegaMenu modules={menuConfig.modules} basePath="/dashboard" />
        </nav>
        <div className="flex-1 min-[1080px]:hidden" />

        {/* Usuario */}
        <div className="flex flex-shrink-0 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex h-11 items-center gap-2.5 rounded-[10px] pl-1 pr-2.5 text-left transition-colors duration-150 hover:bg-c10-sunken focus:outline-none data-[state=open]:bg-c10-sunken">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.name || "Usuario"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-c10-sunken">
                    <User className="h-4 w-4 text-c10-meta" />
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-col leading-tight min-[1200px]:flex">
                  <span className="max-w-[160px] truncate text-sm font-bold text-c10-title">
                    {userShort}
                  </span>
                  {userLogin && (
                    <span className="max-w-[160px] truncate text-xs text-c10-meta">
                      {userLogin}
                    </span>
                  )}
                </div>
                <ChevronDown className="hidden h-3.5 w-3.5 text-c10-faint transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#2F80ED] min-[1080px]:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-72 rounded-2xl border border-c10-line-card p-0 shadow-[0_16px_36px_rgba(15,23,42,.14)]">
              <div className="px-4 pb-3 pt-4">
                <div className="truncate text-[15px] font-bold text-c10-title">
                  {user?.name || "Usuario"}
                </div>
                {userLogin && (
                  <div className="mt-0.5 truncate text-[13px] text-c10-meta">
                    {userLogin}
                  </div>
                )}
              </div>
              <div className="mx-3 h-px bg-c10-sunken" />
              <div className="flex flex-col gap-0.5 p-1.5">
                <ProfileRow
                  href="/dashboard/notas"
                  icon={<StickyNote className="h-4 w-4" />}
                  label="Notas"
                />
                <ProfileRow
                  href="/dashboard/configuracion"
                  icon={<Settings className="h-4 w-4" />}
                  label="Configuración"
                />
              </div>
              <div className="px-3 pb-3">
                <DropdownMenuItem
                  onClick={onLogout}
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#DC2626] text-sm font-bold text-white transition-colors duration-150 focus:bg-[#B91C1C] focus:text-white">
                  <LogOut className="h-4 w-4 text-white" />
                  Salir
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function ProfileRow({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <DropdownMenuItem asChild className="cursor-pointer p-0 focus:bg-c10-panel">
      <Link
        href={href}
        className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-c10-text">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(100,116,139,.12)] text-c10-meta">
          {icon}
        </div>
        <span className="flex-1 text-sm font-bold text-c10-title">{label}</span>
      </Link>
    </DropdownMenuItem>
  );
}
