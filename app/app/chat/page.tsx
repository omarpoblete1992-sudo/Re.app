"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { Connection, getUserProfile, UserProfile } from "@/lib/firestore"
import Link from "next/link"
import Image from "next/image"

export default function ChatListPage() {
    const { user } = useAuth()
    const [connections, setConnections] = React.useState<(Connection & { otherUser?: UserProfile })[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (!user) return

        const connRef = collection(db, "connections")

        // Single onSnapshot for all connections where the user is involved
        const unsub = onSnapshot(connRef, async (snap) => {
            const docs = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Connection))
                .filter(c => c.fromUserId === user.uid || c.toUserId === user.uid)

            const enriched = await Promise.all(docs.map(async (conn) => {
                const otherUid = conn.fromUserId === user.uid ? conn.toUserId : conn.fromUserId
                const profile = await getUserProfile(otherUid)
                return { ...conn, otherUser: profile || undefined }
            }))
            setConnections(enriched)
            setLoading(false)
        })

        return () => unsub()
    }, [user])

    if (loading) return <div className="p-8 text-center text-muted-foreground italic">Cargando tus conexiones...</div>

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-700">
            <h1 className="text-3xl font-serif font-bold mb-8 tracking-tight">Mis Conexiones</h1>

            <div className="space-y-4">
                {connections.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground font-serif">Aún no tienes conexiones del alma.</p>
                        <p className="text-xs text-muted-foreground mt-2">Ve al feed y expande tu esencia.</p>
                    </div>
                )}
                {connections.map((conn) => (
                    <Link key={conn.id} href={`/app/chat/${conn.id}`}>
                        <Card className="hover:bg-accent/5 transition-all cursor-pointer border-border/50 hover:shadow-md mb-4 group overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50 group-hover:scale-105 transition-transform relative">
                                        {(conn.revealedUsers?.includes(user?.uid || "") && conn.revealedUsers?.find(id => id !== user?.uid)) && conn.otherUser?.photoUrl ? (
                                            <Image
                                                src={conn.otherUser.photoUrl}
                                                alt="Avatar"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <User className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold font-serif">{conn.otherUser?.nickname || "Alma misteriosa"}</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                                            {conn.interactionCount || 0} mensajes · {conn.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <MessageCircle className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                                    {conn.interactionCount >= 30 && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">REVELACIÓN DISPONIBLE</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
