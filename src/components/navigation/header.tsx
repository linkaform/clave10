"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Building2,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MegaMenu } from "./mega-menu";
import type { MenuConfig } from "@/types/menu-types";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { useBoothStore } from "@/store/useBoothStore";
import { useSelectedLocationsStore } from "@/store/useSelectedLocationsStore";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Check } from "lucide-react";

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
  const { location: locationBooth } = useBoothStore();
  const { locations, fetchLocations } = useAreasLocationStore();

  const { selectedLocations, toggleLocation, setSelectedLocations } = useSelectedLocationsStore();
  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (!initializedRef.current && locationBooth) {
      initializedRef.current = true;
      setSelectedLocations([locationBooth]);
    }
  }, [locationBooth, setSelectedLocations]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleToggleLocation = (loc: string) => {
    toggleLocation(loc);
  };

  const triggerLabel =
    selectedLocations.length === 0
      ? "Seleccionar Ubicación"
      : selectedLocations.length === 1
        ? selectedLocations[0]
        : `${selectedLocations.length} ubicaciones`;

  return (
    <header className="w-full shadow-sm py-2 px-6 lg:px-12 sticky top-0 left-0 bg-background z-50 border-b border-border">
      <div className="mx-auto grid grid-cols-3 items-center">
        {/* Left Section: Logo & Location */}
        <div className="flex items-center gap-8 justify-self-start">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 relative h-10 w-[120px]">
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                priority
                className="dark:invert object-contain object-left"
                sizes="120px"
              />
            </Link>
          </div>

          {/* Location Selector */}
          <div className="hidden lg:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2",
                    selectedLocations.length > 0 && "text-primary",
                  )}>
                  <Building2 className="h-5 w-5" strokeWidth={1.5} />
                  {triggerLabel}
                  <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 mt-1">
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {locations.length > 0 ? (
                    locations.map((loc) => {
                      const isSelected = selectedLocations.includes(loc);
                      return (
                        <DropdownMenuItem
                          key={loc}
                          className="cursor-pointer rounded-sm px-3 py-2 text-sm transition-colors focus:bg-accent focus:text-accent-foreground flex items-center justify-between gap-3 text-foreground"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleToggleLocation(loc);
                          }}>
                          {loc}
                          <div className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "bg-blue-600 border-blue-600" : "border-muted-foreground/40",
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No hay ubicaciones
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center Section: Navigation */}
        <nav className="hidden lg:flex items-center justify-self-center">
          <MegaMenu modules={menuConfig.modules} basePath="/dashboard" />
        </nav>

        {/* Right Section: User Menu */}
        <div className="flex items-center justify-self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-9 w-9 shadow-sm ring-2 ring-border hover:ring-primary transition-all cursor-pointer">
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.name || "Usuario"}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user?.email && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {user.name || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              <Link href="/dashboard/notas">
                <DropdownMenuItem className="cursor-pointer">
                  <StickyNote className="mr-2 h-4 w-4" />
                  Notas
                </DropdownMenuItem>
              </Link>

              <Link href="/dashboard/configuracion">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
