import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-12">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-serif tracking-tight font-medium text-foreground">
          Reflexión
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
          Donde el alma es lo único que importa.
        </p>
      </div>

      <div className="flex flex-col gap-4 items-center">
        <a href="/register">
          <Button size="lg" className="px-8 py-6 text-lg rounded-full">
            Únete a la conversación
          </Button>
        </a>
        <a
          href="/manifiesto"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-4 border-b border-transparent hover:border-foreground"
        >
          Lee nuestro Manifiesto
        </a>
      </div>

      <div className="absolute bottom-8 text-xs text-muted-foreground/50">
        <p>&copy; {new Date().getFullYear()} Reflexión. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
