"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children}: {children: React.ReactNode}) {
    // El cliente vive en estado: construirlo en el cuerpo del componente
    // recreaba el cache completo en cada re-render.
    const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}