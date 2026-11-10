"use client";

import { useHasMenuKey } from "@/hooks/useMenuKeys";

interface IfMenuKeyProps {
  /** Key del catálogo de menús que da acceso a este componente. */
  menuKey: string;
  children: React.ReactNode;
  /** Qué mostrar mientras se revisa el permiso (por defecto nada). */
  loading?: React.ReactNode;
  /** Qué mostrar si no tiene la key (por defecto nada). */
  fallback?: React.ReactNode;
}

/**
 * Muestra `children` solo si el usuario tiene la key. Para componentes
 * atómicos: una pestaña, un botón, una sección dentro de una pantalla.
 */
export function IfMenuKey({ menuKey, children, loading = null, fallback = null }: IfMenuKeyProps) {
  const allowed = useHasMenuKey(menuKey);
  if (allowed === undefined) return <>{loading}</>;
  return <>{allowed ? children : fallback}</>;
}
