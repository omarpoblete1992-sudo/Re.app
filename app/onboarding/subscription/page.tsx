"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function SubscriptionPage() {
    const benefits = [
        "Sin publicidad, nunca.",
        "Sin algoritmos que secuestren tu atención.",
        "Acceso a comunidades exclusivas (Nocturno, Maestrísimos).",
        "Apoyas un espacio digital más humano.",
        "Privacidad total de tus datos."
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <Card className="w-full max-w-lg border-2 border-primary/10 shadow-xl">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="font-serif text-3xl">El valor de lo real</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Reflexión es sostenible gracias a personas como tú, no a anunciantes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 py-6">
                    <div className="flex flex-col items-center justify-center space-y-2 bg-muted/50 p-6 rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Suscripción Mensual</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold">$1.99</span>
                            <span className="text-muted-foreground">/mes</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                            Menos de lo que cuesta un café, por un mes de conexiones reales.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="text-sm">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-accent/10 p-4 rounded-md border border-accent/20">
                        <h4 className="font-semibold text-accent mb-1 text-sm flex items-center gap-2">
                            🎁 Periodo de Gracia
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            No pagas nada hoy. Tienes <strong>7 días</strong> o hasta que hagas tu primera <strong>Conexión Mutua</strong> para decidir si Reflexión es para ti.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button size="lg" className="w-full text-lg" onClick={() => window.location.href = "/app/feed"}>
                        Comenzar mi Periodo de Gracia
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Puedes cancelar en cualquier momento desde los ajustes.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
