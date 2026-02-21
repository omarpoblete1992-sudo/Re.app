"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, updateUserProfile, UserProfile } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Crown } from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const data = await getUserProfile(user.uid)
                setProfile(data)
                setLoading(false)
            }
        }
        fetchProfile()
    }, [user])

    const handleSave = async () => {
        if (!user || !profile) return
        setSaving(true)
        setSuccessMsg("")
        try {
            await updateUserProfile(user.uid, profile)
            setSuccessMsg("Tu esencia ha sido actualizada.")
            setTimeout(() => setSuccessMsg(""), 3000)
        } catch (error) {
            console.error("Error updating profile:", error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center italic">Cargando tu esencia...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-card/30 p-8 rounded-3xl border border-border/40 backdrop-blur-sm">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20 transition-all group-hover:border-primary/50 relative">
                        {profile?.photoUrl ? (
                            <Image
                                src={profile.photoUrl}
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <User className="w-12 h-12 text-muted-foreground" />
                        )}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <h1 className="text-4xl font-serif font-bold tracking-tight">{profile?.nickname || "Sin apodo"}</h1>
                        {profile?.likes && profile.likes > 100 && (
                            <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
                        )}
                    </div>
                    <p className="text-muted-foreground font-light text-lg italic">
                        &quot;{profile?.credo || "Aún no has definido tu credo."}&quot;
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-border/40 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/40">
                            <CardTitle className="text-xl font-serif">Tu Verdad</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Biografía / Esencia</label>
                                <Textarea
                                    value={profile?.bio || ""}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                                    className="min-h-[150px] font-serif text-lg leading-relaxed bg-background/50 border-border/40 focus:border-primary/40 transition-colors"
                                    placeholder="¿Quién eres realmente cuando nadie mira?"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Influencias</label>
                                    <Input
                                        value={profile?.authors || ""}
                                        onChange={(e) => setProfile(prev => prev ? { ...prev, authors: e.target.value } : null)}
                                        placeholder="Ej: Nietzsche, Woolf..."
                                        className="bg-background/50 border-border/40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Email (No visible)</label>
                                    <Input value={profile?.email || ""} readOnly className="bg-muted/50 cursor-not-allowed border-none text-muted-foreground/60" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-border/40 bg-accent/5 overflow-hidden">
                        <CardHeader className="border-b border-border/40">
                            <CardTitle className="text-lg font-serif">Estado</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-border/20">
                                    <span className="text-sm font-medium text-muted-foreground">Reconocimientos</span>
                                    <span className="font-serif font-bold text-primary">{profile?.likes || 0}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full mt-8 rounded-xl shadow-lg transition-all active:scale-95 py-6 font-bold uppercase tracking-widest text-xs"
                            >
                                {saving ? "Guardando..." : "Actualizar Esencia"}
                            </Button>
                            {successMsg && (
                                <p className="text-center text-xs text-green-500 mt-4 font-bold animate-pulse">{successMsg}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
