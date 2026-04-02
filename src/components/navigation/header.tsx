"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import { LogOut, Settings, StickyNote, User } from "lucide-react";
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
  return (
    <header className="w-full shadow-sm py-2 px-6 lg:px-12 sticky top-0 left-0 bg-background z-50 border-b border-border">
      <div className="mx-auto flex items-center justify-between">
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

        {/* Navigation */}
        <nav className="hidden lg:flex items-center">
          <MegaMenu modules={menuConfig.modules} basePath="/dashboard" />
        </nav>

        {/* User Menu */}
        <div className="flex items-center">
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
