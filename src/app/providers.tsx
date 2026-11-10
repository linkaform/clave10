"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'

export default function Providers({ children}: {children: React.ReactNode}) {
    // El cliente vive en estado: construirlo en el cuerpo del componente
    // recreaba el cache completo en cada re-render.
    const [queryClient] = useState(() => new QueryClient())

  return (
    // Tema claro/oscuro: clase .dark en <html>, guardado en este dispositivo
    // (localStorage "c10-theme"). Claro por defecto; no sigue al sistema.
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="c10-theme"
      disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}