"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/firestore"
import { Camera, Save, CheckCircle2 } from "lucide-react"

export default function ProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = React.useState<UserProfile | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [photoUrl, setPhotoUrl] = React.useState("")
    const [success, setSuccess] = React.useState(false)

    React.useEffect(() => {
        if (!user) return
        getUserProfile(user.uid).then((data) => {
            if (data) {
                setProfile(data)
                setPhotoUrl(data.photoUrl || "")
            }
            setLoading(false)
        })
    }, [user])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setSuccess(false)
        try {
            await updateUserProfile(user.uid, { photoUrl })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            console.error("Error updating profile:", err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground italic">Sintonizando con tu alma...</div>

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <h1 className="text-3xl font-serif font-bold tracking-tight">Mi Perfil</h1>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-4 w-4" /> Cambios guardados
                    </div>
                )}
            </div>

            <Card className="overflow-hidden border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg font-serif">Identidad Física</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                        Tu foto solo será visible para aquellos con quienes alcances 30 interacciones y decidas revelar tu identidad de forma mutua.
                    </p>

                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="h-32 w-32 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative group">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <Camera className="h-8 w-8 text-muted-foreground/50 group-hover:scale-110 transition-transform" />
                            )}
                        </div>
                        <div className="w-full max-w-sm space-y-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">URL de tu Foto</span>
                            <Input
                                placeholder="https://ejemplo.com/tu-foto.jpg"
                                value={photoUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhotoUrl(e.target.value)}
                                className="bg-muted/20 focus:bg-background transition-colors"
                            />
                            <p className="text-[10px] text-muted-foreground italic text-center">
                                * Por ahora, pega el link de una imagen. La subida directa estará disponible pronto.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg font-serif">Datos del Alma</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Apodo</span>
                            <Input value={profile?.nickname || ""} readOnly className="bg-muted/50 font-serif" />
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Email</span>
                            <Input value={profile?.email || ""} readOnly className="bg-muted/50" />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full px-8 shadow-md transition-all active:scale-95"
                        >
                            {saving ? "Guardando..." : <React.Fragment><Save className="mr-2 h-4 w-4" /> Guardar Cambios</React.Fragment>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="pt-8 border-t border-dashed">
                <h2 className="text-xl font-serif font-semibold mb-4 text-destructive opacity-80">Zona de Peligro</h2>
                <Button variant="outline" className="border-destructive/30 text-destructive/70 hover:bg-destructive/5 hover:text-destructive rounded-full transition-colors">
                    Desactivar mi Esencia
                </Button>
            </div>
        </div>
    )
}
