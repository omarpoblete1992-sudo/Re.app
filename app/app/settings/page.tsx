"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"

export default function SettingsPage() {
    const { user, logout } = useAuth()
    const [loadingPayment, setLoadingPayment] = useState(false)

    const handleSubscribe = async () => {
        if (!user) return
        setLoadingPayment(true)
        try {
            const res = await fetch("/api/mercadopago/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
            })
            const data = await res.json()
            if (data.init_point) {
                window.location.href = data.init_point
            }
        } catch (err) {
            console.error("Error iniciando suscripción:", err)
        } finally {
            setLoadingPayment(false)
        }
    }

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
                            <p className="font-medium">Estado: <span className="text-amber-600">Sin suscripción activa</span></p>
                            <p className="text-sm text-muted-foreground">$1.990 CLP / mes</p>
                        </div>
                        <Button
                            onClick={handleSubscribe}
                            disabled={loadingPayment}
                            className="bg-[#009ee3] hover:bg-[#0088c7] text-white font-semibold"
                        >
                            {loadingPayment ? "Redirigiendo..." : "Suscribirse con MercadoPago"}
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        <p>El pago se procesa de forma segura a través de MercadoPago. Podés cancelar cuando quieras.</p>
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
                <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={logout}
                >
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
