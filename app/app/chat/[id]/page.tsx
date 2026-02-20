"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, User, Lock, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/lib/firebase"
import { sendMessage, toggleIdentityReveal, Connection, Message, getUserProfile, UserProfile } from "@/lib/firestore"
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore"

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: connectionId } = React.use(params)
    const { user } = useAuth()
    const [messages, setMessages] = React.useState<Message[]>([])
    const [connection, setConnection] = React.useState<Connection | null>(null)
    const [otherUser, setOtherUser] = React.useState<UserProfile | null>(null)
    const [newMessage, setNewMessage] = React.useState("")
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (!user) return

        // Subscribe to connection data
        const connRef = doc(db, "connections", connectionId)
        const unsubConn = onSnapshot(connRef, (snap) => {
            if (snap.exists()) {
                const connData = { id: snap.id, ...snap.data() } as Connection
                setConnection(connData)

                // Fetch other user profile
                const otherUid = connData.fromUserId === user.uid ? connData.toUserId : connData.fromUserId
                getUserProfile(otherUid).then((profile) => {
                    if (profile) setOtherUser(profile)
                })
            }
        })

        // Subscribe to messages
        const messagesRef = collection(db, "connections", connectionId, "messages")
        const q = query(messagesRef, orderBy("createdAt", "asc"))
        const unsubMsgs = onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Message[]
            setMessages(msgs)
            setLoading(false)
        })

        return () => {
            unsubConn()
            unsubMsgs()
        }
    }, [user, connectionId])

    const handleSend = async () => {
        if (!user || !newMessage.trim()) return
        try {
            const text = newMessage
            setNewMessage("")
            await sendMessage(connectionId, user.uid, text)
        } catch (err) {
            console.error("Error sending message:", err)
        }
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Abriendo conexión...</div>
    if (!connection) return <div className="p-8 text-center text-red-500">No se encontró la conexión.</div>

    const interactionTarget = 30
    const count = connection.interactionCount || 0
    const progress = Math.min((count / interactionTarget) * 100, 100)
    const canReveal = count >= interactionTarget

    // Check if both users revealed
    const amRevealed = connection.revealedUsers?.includes(user?.uid || "")
    const otherRevealed = connection.revealedUsers?.find(id => id !== user?.uid)
    const mutualReveal = amRevealed && otherRevealed

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-2xl mx-auto bg-background">
            <div className="flex items-center justify-between py-4 border-b px-4">
                <div className="flex items-center gap-4">
                    <Link href="/app/chat">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/50 shadow-sm">
                            {mutualReveal && otherUser?.photoUrl ? (
                                <img src={otherUser.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm font-serif">{otherUser?.nickname || "Alma conectada"}</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                {mutualReveal ? "Identidad Revelada" : "Enlace Anónimo"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] text-muted-foreground font-medium">Interacción: {count}/{interactionTarget}</div>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Reveal Zone */}
            {canReveal && !mutualReveal && (
                <div className="bg-muted/30 p-4 border-b text-center space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                    <p className="text-xs text-muted-foreground font-medium">
                        ¡Han interactuado lo suficiente! ¿Quieres revelar tu identidad física?
                    </p>
                    <Button
                        size="sm"
                        variant={amRevealed ? "outline" : "default"}
                        className="rounded-full px-6 transition-all active:scale-95"
                        onClick={() => toggleIdentityReveal(connectionId, user?.uid || "")}
                        disabled={amRevealed}
                    >
                        {amRevealed ? (
                            <React.Fragment><Lock className="mr-2 h-3 w-3" /> Esperando al otro...</React.Fragment>
                        ) : (
                            <React.Fragment><Eye className="mr-2 h-3 w-3" /> Revelar mi Foto</React.Fragment>
                        )}
                    </Button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                        Di algo para comenzar a conocer su alma...
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${msg.senderId === user?.uid
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-card border border-border/50 rounded-tl-none text-card-foreground"
                            }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <span className="text-[10px] opacity-70 block text-right mt-1 font-medium">
                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Enviando..."}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t flex gap-2">
                <Input
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                    className="bg-muted/50 border-transparent focus-visible:bg-background transition-colors"
                />
                <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()} className="rounded-full shadow-md transition-transform active:scale-90">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
