export default function ManifiestoPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-serif mb-8 tracking-wide">El Manifiesto de Reflexión</h1>
            <div className="space-y-6 text-lg font-light leading-relaxed text-muted-foreground/90">
                <p>
                    En un mundo ruidoso, donde la imagen prima sobre la esencia,
                    <strong> Reflexión</strong> es un santuario.
                </p>
                <p>
                    Aquí, el alma es lo único que importa.
                </p>
                <ul className="list-none space-y-2">
                    <li>Sin fotos (al principio).</li>
                    <li>Sin publicidad.</li>
                    <li>Sin algoritmos adictivos.</li>
                </ul>
                <p>
                    Solo palabras. Solo verdad.
                </p>
                <p className="pt-4 border-t w-1/3 mx-auto mt-8 border-border/40"></p>
                <p className="text-sm">
                    Al suscribirte por $1.99/mes, financias este refugio y garantizas que
                    tu atención nunca sea el producto.
                </p>
            </div>
            <div className="mt-12">
                <a
                    href="/"
                    className="text-primary hover:text-accent transition-colors underline-offset-4 hover:underline"
                >
                    Volver al inicio
                </a>
            </div>
        </div>
    )
}
