import '@/app/globals.css'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-6 flex h-[500px] w-[1000px] items-center justify-center overflow-hidden rounded-xl">
        <Image 
          src="/errors-images/404.jpg"
          alt="Página no encontrada"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Página no encontrada
      </h1>
      
      <p className="mb-8 max-w-md text-lg text-muted-foreground">
        La página que buscas no existe. Verifica la URL o regresa al inicio.
      </p>

      <Button asChild variant="default" size="lg" className="gap-2">
        <Link href="/">
          <Home className="h-4 w-4" />
          Ir al inicio
        </Link>
      </Button>
    </div>
  )
}