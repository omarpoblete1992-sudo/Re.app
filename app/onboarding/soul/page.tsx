import { SoulForm } from "@/components/onboarding/soul-form"

export default function SoulPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="w-full max-w-lg mb-8">
                <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center mb-2">Paso 2 de 3</h1>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 transition-all duration-500 ease-out"></div>
                </div>
            </div>
            <SoulForm />
        </div>
    )
}
