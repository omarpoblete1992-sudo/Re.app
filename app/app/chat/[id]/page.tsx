"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { sendMessage, toggleIdentityReveal, Connection, Message, getUserProfile, UserProfile } from "@/lib/firestore"
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore"
import Image from "next/image"
import { User, Send, Shield, Info, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"

export default function ChatDetailPage() {
    const params = useParams()
    const router = useRouter()
    const connectionId = params.id as string

    const { user } = useAuth()
    const [messages, setMessages] = React.useState<Message[]>([])
    const [inputText, setInputText] = React.useState("")
    const [connection, setConnection] = React.useState<Connection | null>(null)
    const [otherUser, setOtherUser] = React.useState<UserProfile | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (!user || !connectionId) return

        const connRef = doc(db, "connections", connectionId)
        const unsubConn = onSnapshot(connRef, async (snap) => {
            if (!snap.exists()) {
                router.push("/app/chat")
                return
            }
            const data = { id: snap.id, ...snap.data() } as Connection
            setConnection(data)

            const otherUid = data.fromUserId === user.uid ? data.toUserId : data.fromUserId
            const profile = await getUserProfile(otherUid)
            setOtherUser(profile)
            setLoading(false)
        })

        const msgsRef = collection(db, "connections", connectionId, "messages")
        const q = query(msgsRef, orderBy("createdAt", "asc"))
        const unsubMsgs = onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
            setMessages(msgs)
        })

        return () => {
            unsubConn()
            unsubMsgs()
        }
    }, [user, connectionId, router])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim() || !user || !connectionId) return

        const text = inputText.trim()
        setInputText("")
        await sendMessage(connectionId, user.uid, text)
    }

    const handleToggleReveal = async () => {
        if (!user || !connectionId) return
        await toggleIdentityReveal(connectionId, user.uid)
    }

    if (loading) return <div className="p-8 text-center italic">Cargando conversación...</div>

    const isRevealed = (connection?.revealedUsers?.includes(user?.uid || "") && connection?.revealedUsers?.length === 2) || false

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto border-x border-border/40 bg-background shadow-2xl overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border/40 relative">
                        {isRevealed && otherUser?.photoUrl ? (
                            <Image
                                src={otherUser.photoUrl}
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-serif font-bold tracking-tight">{otherUser?.nickname || "Alma misteriosa"}</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            {connection?.status === "accepted" ? "En sintonía" : "Conectando"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Info className="h-5 w-5" />
                    </Button>
                    <Button
                        variant={connection?.revealedUsers?.includes(user?.uid || "") ? "secondary" : "outline"}
                        size="sm"
                        onClick={handleToggleReveal}
                        className="gap-2 text-xs font-bold uppercase tracking-tighter"
                    >
                        <Shield className="h-3.5 w-3.5" />
                        {connection?.revealedUsers?.includes(user?.uid || "") ? "Identidad Ofrecida" : "Revelar Identidad"}
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-accent/5">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 opacity-40">
                        <Heart className="h-12 w-12 text-primary/20 animate-pulse" />
                        <p className="text-sm font-serif italic">El silencio es el lienzo donde se pinta el alma.</p>
                        <p className="text-[10px] uppercase tracking-widest font-bold">Inicia la conversación</p>
                    </div>
                )}
                {messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.uid
                    return (
                        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-card border border-border/40 rounded-tl-none"
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-background/80 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Escribe tu verdad..."
                        className="bg-muted/50 border-none focus-visible:ring-primary/20 h-12 text-base font-light rounded-xl px-6"
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg transition-all active:scale-90 bg-primary hover:bg-primary/90">
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
