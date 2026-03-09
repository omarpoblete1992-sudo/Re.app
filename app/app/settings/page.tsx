"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/firestore"
import { LanguageSelector } from "@/components/language-selector"
import { LanguageCode } from "@/lib/i18n/config"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
    const { user, logout } = useAuth()
    const { toast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loadingPayment, setLoadingPayment] = useState(false)
    const [savingLang, setSavingLang] = useState(false)

    useEffect(() => {
        if (user) getUserProfile(user.uid).then(p => setProfile(p))
    }, [user])

    const handleLanguageChange = async (lang: LanguageCode) => {
        if (!user || !profile) return
        setSavingLang(true)
        try {
            await updateUserProfile(user.uid, { language: lang })
            setProfile({ ...profile, language: lang })
            localStorage.setItem("reflexion-language", lang)
            toast({
                title: "Idioma actualizado",
                description: "Tus esencias ahora se mostrarán con esta preferencia.",
                duration: 3000,
            })
        } catch (error) {
            console.error("Error updating language:", error)
        } finally {
            setSavingLang(false)
        }
    }

    const handleShowAllLanguagesChange = async (checked: boolean) => {
        if (!user || !profile) return
        try {
            await updateUserProfile(user.uid, { showPostsInAllLanguages: checked })
            setProfile({ ...profile, showPostsInAllLanguages: checked })
            toast({
                title: checked ? "Modo sin fronteras" : "Modo localizado",
                description: checked
                    ? "Verás todas las esencias sin importar su idioma."
                    : "Solo verás esencias compatibles con tu idioma seleccionado.",
                duration: 3000,
            })
        } catch (error) {
            console.error("Error updating language filter:", error)
        }
    }

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
                    <CardTitle>Dioma y Filtros</CardTitle>
                    <CardDescription>Configura cómo interactúas con almas de otras lenguas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Idioma de tu Alma</Label>
                        <div className={savingLang ? "opacity-50 pointer-events-none" : ""}>
                            <LanguageSelector
                                value={profile?.language || null}
                                onChange={handleLanguageChange}
                                showLabels={true}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="space-y-0.5 pr-4">
                            <Label htmlFor="all-languages">Mostrar posts de todos los idiomas</Label>
                            <p className="text-sm text-muted-foreground">Si está activo, verás esencias en francés o portugués incluso si hablas español.</p>
                        </div>
                        <Switch
                            id="all-languages"
                            checked={!!profile?.showPostsInAllLanguages}
                            onCheckedChange={handleShowAllLanguagesChange}
                        />
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
