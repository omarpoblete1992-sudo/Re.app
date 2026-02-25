"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { AdminRoute } from "@/components/auth/admin-route"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, User, Crown, Shield, VolumeX, Ban, Volume2, ShieldOff, Clock } from "lucide-react"
import type { UserRole, ModerationLog } from "@/lib/firestore"
import { silenceUser, unsilenceUser, banUser, unbanUser, getModerationLogs } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

interface UserEntry {
    uid: string
    nickname: string
    email: string
    role: UserRole
    likes: number
    banned: boolean
    silencedUntil?: Timestamp
}

function AdminPanel() {
    const { user: authUser, userRole } = useAuth()
    const [users, setUsers] = useState<UserEntry[]>([])
    const [logs, setLogs] = useState<ModerationLog[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingUid, setUpdatingUid] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"users" | "logs">("users")

    useEffect(() => {
        async function fetchData() {
            try {
                const [usersSnap, logsData] = await Promise.all([
                    getDocs(collection(db, "users")),
                    getModerationLogs(30)
                ])
                const entries: UserEntry[] = usersSnap.docs.map(d => ({
                    uid: d.id,
                    nickname: d.data().nickname || "Sin apodo",
                    email: d.data().email || "",
                    role: (d.data().role as UserRole) || "user",
                    likes: d.data().likes || 0,
                    banned: d.data().banned || false,
                    silencedUntil: d.data().silencedUntil || undefined,
                }))
                entries.sort((a, b) => {
                    const order: Record<string, number> = { admin: 0, moderator: 1, user: 2 }
                    return (order[a.role] ?? 2) - (order[b.role] ?? 2)
                })
                setUsers(entries)
                setLogs(logsData)
            } catch (err) {
                console.error("Error fetching data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const changeRole = async (uid: string, newRole: UserRole) => {
        setUpdatingUid(uid)
        try {
            await updateDoc(doc(db, "users", uid), { role: newRole })
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
        } catch (err) {
            console.error("Error changing role:", err)
        } finally {
            setUpdatingUid(null)
        }
    }

    const handleSilence = async (uid: string) => {
        if (!authUser) return
        setUpdatingUid(uid)
        try {
            await silenceUser(uid, authUser.uid, 24)
            const silencedUntil = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, silencedUntil } : u))
        } catch (err) {
            console.error("Error silencing:", err)
        } finally {
            setUpdatingUid(null)
        }
    }

    const handleUnsilence = async (uid: string) => {
        if (!authUser) return
        setUpdatingUid(uid)
        try {
            await unsilenceUser(uid, authUser.uid)
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, silencedUntil: undefined } : u))
        } catch (err) {
            console.error("Error unsilencing:", err)
        } finally {
            setUpdatingUid(null)
        }
    }

    const handleBan = async (uid: string) => {
        if (!authUser) return
        setUpdatingUid(uid)
        try {
            await banUser(uid, authUser.uid)
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: true } : u))
        } catch (err) {
            console.error("Error banning:", err)
        } finally {
            setUpdatingUid(null)
        }
    }

    const handleUnban = async (uid: string) => {
        if (!authUser) return
        setUpdatingUid(uid)
        try {
            await unbanUser(uid, authUser.uid)
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: false } : u))
        } catch (err) {
            console.error("Error unbanning:", err)
        } finally {
            setUpdatingUid(null)
        }
    }

    const roleIcon = (role: UserRole) => {
        if (role === "admin") return <Crown className="w-4 h-4 text-amber-500" />
        if (role === "moderator") return <Shield className="w-4 h-4 text-blue-500" />
        return <User className="w-4 h-4 text-muted-foreground" />
    }

    const roleBadgeClass = (role: UserRole) => {
        if (role === "admin") return "bg-amber-100 text-amber-700"
        if (role === "moderator") return "bg-blue-100 text-blue-700"
        return "bg-muted text-muted-foreground"
    }

    const isSilenced = (u: UserEntry) => {
        if (!u.silencedUntil) return false
        return u.silencedUntil.toDate() > new Date()
    }

    const actionLabel = (action: string) => {
        const map: Record<string, { label: string; color: string }> = {
            silence: { label: "Silenciado", color: "text-amber-600" },
            unsilence: { label: "Desilenciado", color: "text-green-600" },
            ban: { label: "Baneado", color: "text-red-600" },
            unban: { label: "Desbaneado", color: "text-green-600" },
            delete_post: { label: "Post eliminado", color: "text-red-500" },
        }
        return map[action] || { label: action, color: "text-muted-foreground" }
    }

    if (loading) return <div className="p-8 text-center italic">Cargando panel de administración...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight">Panel de Administración</h1>
                    <p className="text-sm text-muted-foreground">Gestión de usuarios, moderación y logs</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border/40 pb-1">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "users" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Usuarios ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "logs" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                    Logs ({logs.length})
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === "users" && (
                <Card className="border-border/40 overflow-hidden">
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {users.map(u => (
                                <div key={u.uid} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {roleIcon(u.role)}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium font-serif truncate">{u.nickname}</p>
                                                {u.banned && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase">Baneado</span>}
                                                {isSilenced(u) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold uppercase">Silenciado</span>}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleBadgeClass(u.role)}`}>
                                            {u.role}
                                        </span>

                                        {/* Role change buttons — admin only */}
                                        {userRole === "admin" && u.uid !== authUser?.uid && (
                                            <div className="flex gap-1 ml-1">
                                                {u.role !== "admin" && (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => changeRole(u.uid, "admin")} className="text-[10px] h-7 px-2 text-amber-600 hover:bg-amber-50">Admin</Button>
                                                )}
                                                {u.role !== "moderator" && (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => changeRole(u.uid, "moderator")} className="text-[10px] h-7 px-2 text-blue-600 hover:bg-blue-50">Mod</Button>
                                                )}
                                                {u.role !== "user" && (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => changeRole(u.uid, "user")} className="text-[10px] h-7 px-2 text-muted-foreground">User</Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Moderation actions */}
                                        {u.uid !== authUser?.uid && u.role === "user" && (
                                            <div className="flex gap-1 ml-1 border-l border-border/40 pl-2">
                                                {isSilenced(u) ? (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => handleUnsilence(u.uid)} className="h-7 w-7 p-0 text-green-600 hover:bg-green-50" title="Quitar silencio">
                                                        <Volume2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => handleSilence(u.uid)} className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50" title="Silenciar 24h">
                                                        <VolumeX className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                {u.banned ? (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => handleUnban(u.uid)} className="h-7 w-7 p-0 text-green-600 hover:bg-green-50" title="Quitar ban">
                                                        <ShieldOff className="w-3.5 h-3.5" />
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" disabled={updatingUid === u.uid} onClick={() => handleBan(u.uid)} className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" title="Banear">
                                                        <Ban className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Logs Tab */}
            {activeTab === "logs" && (
                <Card className="border-border/40 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle className="text-lg font-serif">Registro de Moderación</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No hay acciones de moderación registradas.</div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {logs.map(log => {
                                    const { label, color } = actionLabel(log.action)
                                    return (
                                        <div key={log.id} className="p-3 flex items-center gap-3 text-sm">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <span className={`font-bold ${color}`}>{label}</span>
                                                {log.details && <span className="text-muted-foreground"> — {log.details}</span>}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                {log.createdAt?.toDate?.().toLocaleString("es-CL") || ""}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function AdminPage() {
    return (
        <AdminRoute>
            <AdminPanel />
        </AdminRoute>
    )
}
