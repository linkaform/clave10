"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Building2,
  Check,
  ChevronDown,
  LogIn,
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
import { AsistenciaReminder } from "./asistencia-reminder";
import type { MenuConfig } from "@/types/menu-types";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useLocationOptions } from "@/hooks/useLocationOptions";
import { useCheckInAction } from "@/hooks/useCheckIn";
import { CheckInWizard } from "@/components/checkin/checkin-wizard";
import { CheckInSync } from "@/components/checkin/checkin-sync";
import { ExtraPrompt } from "@/components/checkin/extra-prompt";

import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { useAsistencia } from "@/hooks/useAsistencia";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface HeaderProps {
  menuConfig: MenuConfig;
  user?: {
    name?: string;
    email?: string;
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
  const { selectedLocations, toggleLocation, setSelectedLocations } =
    useSelectedLocationsStore();

  useEffect(() => {
    useAreasLocationStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const allSelected =
    locations.length > 0 && locations.every((loc) => selectedLocations.includes(loc));

  const triggerLabel =
    selectedLocations.length === 0
      ? "Seleccionar Ubicación"
      : allSelected && locations.length > 1
        ? "Todas las ubicaciones"
        : selectedLocations.length === 1
          ? selectedLocations[0]
          : `${selectedLocations.length} ubicaciones`;

  const userName = user?.name || "Usuario";
  // Asistencia: Disponible abre la jornada, Ausente la cierra (employee/asistencia).
  const { asistencia, disponible, setEstatus, isSaving } = useAsistencia();
  const isAway = !disponible;
  const statusDot = disponible ? "bg-green-600" : "bg-amber-500";
  const { checkIn, run: runCheckIn } = useCheckInAction();

  return (
    <header className="w-full sticky top-0 left-0 z-50 bg-white border-b border-gray-200">
      <div className="h-14 lg:h-16 pl-1 pr-2 lg:px-4 2xl:px-6 flex items-center gap-1 lg:gap-3 2xl:gap-5">
        {/* Mobile/Tablet menu trigger */}
        <MobileMenu modules={menuConfig.modules} basePath="/dashboard" />

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            priority
            className="h-[22px] lg:h-6 w-auto object-contain"
          />
        </Link>

        <div className="hidden lg:block w-px h-6 bg-gray-200" />

        {/* Location Selector */}
        <div className="hidden lg:flex items-center flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="group h-9 flex items-center gap-2 pl-2 pr-2.5 rounded-lg text-sm text-neutral-900 whitespace-nowrap transition-colors hover:bg-slate-100 data-[state=open]:bg-slate-100 focus:outline-none"
                title={triggerLabel}>
                <Building2 className="h-4 w-4 text-slate-500" />
                <span className="hidden xl:inline font-medium max-w-[220px] truncate">
                  {triggerLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={8}
              className="w-[280px] p-0 rounded-xl border-gray-200 shadow-[0_10px_15px_-3px_rgba(15,23,42,.08),0_4px_6px_-4px_rgba(15,23,42,.06)]">
              <div className="px-3.5 pt-3 pb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">Ubicaciones</span>
                {locations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedLocations(allSelected ? [] : [...locations])}
                    className="text-xs font-medium text-button-primary hover:text-button-primary-hover">
                    {allSelected ? "Limpiar" : "Seleccionar todas"}
                  </button>
                )}
              </div>
              <div className="px-1.5 pb-1.5 flex flex-col gap-0.5 max-h-80 overflow-y-auto">
                {locations.length > 0 ? (
                  locations.map((loc) => {
                    const isSelected = selectedLocations.includes(loc);
                    return (
                      <DropdownMenuItem
                        key={loc}
                        className="min-h-10 flex items-center gap-2.5 px-2 rounded-lg cursor-pointer text-sm text-neutral-900 focus:bg-slate-100"
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleLocation(loc);
                        }}>
                        <div
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-button-primary border-button-primary"
                              : "bg-white border-slate-300",
                          )}>
                          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                        </div>
                        <span className="flex-1">{loc}</span>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No hay ubicaciones
                  </div>
                )}
              </div>
              {locations.length > 0 && (
                <div className="px-3.5 py-2.5 border-t border-gray-200 text-xs text-slate-500">
                  {selectedLocations.length} de {locations.length} seleccionadas
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex flex-1 min-w-0 justify-end self-stretch">
          <MegaMenu modules={menuConfig.modules} basePath="/dashboard" />
        </nav>
        <div className="flex-1 lg:hidden" />

        {/* User Menu */}
        <div className="flex items-center flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group h-11 w-11 md:w-auto flex items-center justify-center md:justify-start gap-2.5 md:pl-1 md:pr-2.5 rounded-[10px] text-left transition-colors hover:bg-slate-100 data-[state=open]:bg-slate-100 focus:outline-none">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={user?.avatar} alt={userName} className="object-cover" />
                    <AvatarFallback>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  {asistencia && (
                    <StatusDot className={cn("absolute -right-px -bottom-px ring-2 ring-white", statusDot)} />
                  )}
                </div>
                <div className="hidden xl:flex flex-col leading-tight min-w-0">
                  <span className="text-sm font-bold text-slate-900 whitespace-nowrap max-w-[160px] truncate">
                    {userName}
                  </span>
                  {user?.email && (
                    <span className="text-xs text-slate-500 whitespace-nowrap max-w-[160px] truncate">
                      {user.email}
                    </span>
                  )}
                </div>
                <ChevronDown className="hidden md:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-button-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-72 p-0 rounded-2xl border-gray-200 shadow-[0_16px_36px_rgba(15,23,42,.14)]">
              <div className="px-4 pt-4 pb-3">
                <div className="text-[15px] font-bold text-slate-900 truncate">{userName}</div>
                {user?.email && (
                  <div className="text-[13px] text-slate-500 mt-0.5 truncate">{user.email}</div>
                )}
              </div>
              <div className="px-1.5 pb-1.5">
                <DropdownMenuItem
                  disabled={!asistencia || isSaving}
                  onSelect={(e) => {
                    e.preventDefault();
                    setEstatus(isAway ? "disponible" : "ausente");
                  }}
                  className="h-10 gap-2.5 px-2.5 rounded-[10px] cursor-pointer text-sm font-medium text-neutral-900 focus:bg-slate-100">
                  <StatusDot className={statusDot} />
                  <span className="flex-1">{isSaving ? "Guardando…" : disponible ? "Disponible" : "Ausente"}</span>
                  <span
                    className={cn(
                      "relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-150",
                      isAway ? "bg-slate-300" : "bg-green-600",
                    )}>
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-[left] duration-150",
                        isAway ? "left-0.5" : "left-[18px]",
                      )}
                    />
                  </span>
                </DropdownMenuItem>
              </div>
              <div className="h-px bg-slate-100 mx-3" />
              <div className="p-1.5 flex flex-col gap-0.5">
                <DropdownMenuItem
                  onSelect={runCheckIn}
                  className="cursor-pointer rounded-[10px] px-2.5 py-2 gap-3 focus:bg-slate-50">
                  <div
                    className={cn(
                      "h-8 w-8 flex-shrink-0 rounded-[10px] flex items-center justify-center",
                      checkIn ? "bg-red-600/[.12] text-red-600" : "bg-[#EFF6FF] text-[#2F80ED]",
                    )}>
                    {checkIn ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-bold", checkIn ? "text-red-600" : "text-[#2F80ED]")}>
                      {checkIn ? "Check Out" : "Check In"}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {checkIn ? `${checkIn.ubicacion} · ${checkIn.caseta}` : "Hacer Check In"}
                    </div>
                  </div>
                </DropdownMenuItem>
                <ProfileLink
                  href="/dashboard/notas"
                  icon={<StickyNote className="h-4 w-4" />}
                  iconClassName="bg-amber-500/15 text-amber-600"
                  label="Notas"
                />
                <ProfileLink
                  href="/dashboard/configuracion"
                  icon={<Settings className="h-4 w-4" />}
                  iconClassName="bg-slate-500/10 text-slate-500"
                  label="Configuración"
                />
              </div>
              <div className="px-3 pb-3">
                <DropdownMenuItem
                  onClick={onLogout}
                  className="h-10 flex items-center justify-center gap-2 rounded-[10px] cursor-pointer bg-red-50 text-sm font-bold text-red-600 focus:bg-red-100 focus:text-red-600">
                  <LogOut className="h-4 w-4" />
                  Salir
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AsistenciaReminder />
      <CheckInWizard />
      <CheckInSync />
      <ExtraPrompt />
    </header>
  );
}

function StatusDot({ className }: { className?: string }) {
  return <span className={cn("block h-2.5 w-2.5 flex-shrink-0 rounded-full box-border", className)} />;
}

function ProfileLink({
  href,
  icon,
  iconClassName,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
}) {
  return (
    <DropdownMenuItem asChild className="cursor-pointer rounded-[10px] px-2.5 py-2 gap-3 focus:bg-slate-50">
      <Link href={href}>
        <div
          className={cn(
            "h-8 w-8 flex-shrink-0 rounded-[10px] flex items-center justify-center",
            iconClassName,
          )}>
          {icon}
        </div>
        <span className="flex-1 text-sm font-bold text-slate-900">{label}</span>
      </Link>
    </DropdownMenuItem>
  );
}
