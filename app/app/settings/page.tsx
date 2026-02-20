"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-serif font-bold">Ajustes</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Suscripción</CardTitle>
                    <CardDescription>Gestiona tu membresía de Reflexión.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="font-medium">Estado: <span className="text-green-600">Periodo de Gracia</span></p>
                            <p className="text-sm text-muted-foreground">Termina en 5 días</p>
                        </div>
                        <Button variant="outline">Gestionar en Stripe</Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p>Tu próxima facturación será de $1.99 el 24 de Febrero.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="notifications">Notificaciones</Label>
                            <p className="text-sm text-muted-foreground">Recibir avisos de nuevas conexiones.</p>
                        </div>
                        <Switch id="notifications" />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="dark-mode">Modo Oscuro</Label>
                            <p className="text-sm text-muted-foreground">Para esas noches de insomnio.</p>
                        </div>
                        <Switch id="dark-mode" />
                    </div>
                </CardContent>
            </Card>

            <div className="pt-4">
                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
