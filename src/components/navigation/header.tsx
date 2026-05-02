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
import { cn } from "@/lib/utils";

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
  const { location: locationBooth, area, setBooth } = useBoothStore();
  const { locations } = useAreasLocationStore();

  const [currentLocation, setCurrentLocation] = React.useState<string>("");

  React.useEffect(() => {
    if (locationBooth) {
      setCurrentLocation(locationBooth);
    }
  }, [locationBooth]);

  const handleLocationChange = (loc: string) => {
    setCurrentLocation(loc);
    setBooth(area ?? "", loc);
  };

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
                    currentLocation && "text-primary",
                  )}>
                  <Building2 className="h-5 w-5" strokeWidth={1.5} />
                  {currentLocation || "Seleccionar Ubicación"}
                  <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 mt-1">
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <DropdownMenuItem
                        key={loc}
                        className={cn(
                          "cursor-pointer rounded-sm px-3 py-2 text-sm transition-colors focus:bg-accent focus:text-accent-foreground",
                          currentLocation === loc
                            ? "bg-accent text-primary font-semibold"
                            : "text-foreground",
                        )}
                        onClick={() => {
                          handleLocationChange(loc);
                        }}>
                        {loc}
                      </DropdownMenuItem>
                    ))
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
