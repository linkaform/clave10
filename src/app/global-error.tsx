// app/global-error.tsx
'use client'

import '@/app/globals.css'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="relative flex h-[400px] w-[250px] items-center justify-center overflow-hidden rounded-xl">
            <Image 
              src="/errors-images/error-inesperado.jpg"
              alt="Error inesperado"
              fill
              className="object-cover"
              priority
            />
          </div>
          
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            ¡Oops! Algo salió mal
          </h1>
          
          <p className="mb-8 max-w-md text-lg text-muted-foreground">
            Lamentamos los inconvenientes. Ha ocurrido un error inesperado en la aplicación, si el problema persiste contacte a soporte.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button 
              onClick={() => reset()} 
              variant="default" 
              size="lg"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Reintentar
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              size="lg"
              className="gap-2"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Ir al inicio
              </Link>
            </Button>
          </div>

          {error.digest && (
            <p className="mt-12 text-xs text-muted-foreground font-mono">
              ID del error: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
