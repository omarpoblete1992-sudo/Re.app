"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { Connection, getUserProfile, UserProfile } from "@/lib/firestore"
import Link from "next/link"

export default function ChatListPage() {
    const { user } = useAuth()
    const [connections, setConnections] = React.useState<(Connection & { otherUser?: UserProfile })[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (!user) return

        // Query connections where user is 'from' OR 'to'
        // Firestore doesn't support OR natively in a clean way for different fields without complex indexes sometimes,
        // but for now we can query one and filter or use multiple subscriptions.
        // Given we use deterministic IDs, we could query all connections and filter by prefix/suffix, but better to query by UID.

        const connRef = collection(db, "connections")
        const q1 = query(connRef, where("fromUserId", "==", user.uid))
        const q2 = query(connRef, where("toUserId", "==", user.uid))

        const updateConnections = async (snaps: any[]) => {
            const allConns = snaps.flatMap(snap => snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))) as Connection[]

            // Deduplicate (just in case)
            const uniqueConns = Array.from(new Map(allConns.map(c => [c.id, c])).values())

            // Enrich with other user profile
            const enriched = await Promise.all(uniqueConns.map(async (conn) => {
                const otherUid = conn.fromUserId === user.uid ? conn.toUserId : conn.fromUserId
                const otherUser = await getUserProfile(otherUid)
                return { ...conn, otherUser: otherUser || undefined }
            }))

            setConnections(enriched)
            setLoading(false)
        }

        const unsub1 = onSnapshot(q1, (snap) => {
            // This is a bit naive but works for small sets.
            // Ideally use a single combined state update logic.
        })

        // Better: use one onSnapshot for both if possible or just handle combined state.
        // For simplicity in this demo environment:
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
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50 group-hover:scale-105 transition-transform">
                                        {(conn.revealedUsers?.includes(user?.uid || "") && conn.revealedUsers?.find(id => id !== user?.uid)) && conn.otherUser?.photoUrl ? (
                                            <img src={conn.otherUser.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
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
