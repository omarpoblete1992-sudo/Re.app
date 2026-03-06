"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Check, Clock, Crown, Trash2, VolumeX, Plus } from "lucide-react"
import { getRemainingForExpansion, canAddContinuation } from "@/lib/post-limits"
import { likePost, createConnection, deleteEssence, silenceUser, getContinuations, addContinuation, Continuation } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export interface FeedItemProps {
    key?: React.Key
    user: {
        id: string // post id
        userId: string // actual author uid
        nickname: string
        bio: string
        authors?: string
        credo?: string
        likes?: number
        isTop100?: boolean
        age?: number
        timeAgo?: string
        feed: string
    }
    onDeleted?: (postId: string) => void
}

export const FeedItem = ({ user, onDeleted }: FeedItemProps) => {
    const [status, setStatus] = useState<"idle" | "pending" | "connected">("idle")
    const [expanded, setExpanded] = useState(false)
    const [currentLikes, setCurrentLikes] = useState(user.likes ?? 0)
    const [hasLiked, setHasLiked] = useState(false)
    const [modAction, setModAction] = useState<string | null>(null)
    const [continuations, setContinuations] = useState<Continuation[]>([])
    const [loadingContinuations, setLoadingContinuations] = useState(true)
    const [isWritingContinuation, setIsWritingContinuation] = useState(false)
    const [newContinuationText, setNewContinuationText] = useState("")
    const [isSubmittingContinuation, setIsSubmittingContinuation] = useState(false)
    const { user: authUser, userRole } = useAuth()

    const isMod = userRole === "admin" || userRole === "moderator"
    const isOwner = authUser?.uid === user.userId
    const isCadaver = user.feed === "cadaver_exquisito"

    React.useEffect(() => {
        async function fetchContinuations() {
            try {
                const data = await getContinuations(user.id)
                setContinuations(data)
            } catch (err) {
                console.error("Error fetching continuations:", err)
            } finally {
                setLoadingContinuations(false)
            }
        }
        fetchContinuations()
    }, [user.id])

    const canAdd = isCadaver ? true : canAddContinuation(currentLikes, continuations.length)
    const remainingForNext = getRemainingForExpansion(currentLikes)

    const handleAddContinuation = async () => {
        if (!authUser || !newContinuationText.trim()) return
        if (!isCadaver && !isOwner) return

        setIsSubmittingContinuation(true)
        try {
            await addContinuation(user.id, authUser.uid, authUser.displayName || "Alma Anónima", newContinuationText)
            setNewContinuationText("")
            setIsWritingContinuation(false)

            // Refetch continuations
            const data = await getContinuations(user.id)
            setContinuations(data)
        } catch (err) {
            console.error("Error adding continuation:", err)
        } finally {
            setIsSubmittingContinuation(false)
        }
    }

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (hasLiked) return
        try {
            setHasLiked(true)
            setCurrentLikes(prev => prev + 1)
            await likePost(user.id)
        } catch (err) {
            console.error("Error liking post:", err)
        }
    }

    const handleConnect = async () => {
        if (!authUser || status !== "idle" || !user.userId) return
        try {
            setStatus("pending")
            await createConnection(authUser.uid, user.userId)
        } catch (err) {
            console.error("Error connecting:", err)
            setStatus("idle")
        }
    }

    const handleDeletePost = async () => {
        if (!authUser || !isMod) return
        setModAction("deleting")
        try {
            await deleteEssence(user.id, authUser.uid)
            onDeleted?.(user.id)
        } catch (err) {
            console.error("Error deleting post:", err)
        } finally {
            setModAction(null)
        }
    }

    const handleSilenceUser = async () => {
        if (!authUser || !isMod) return
        setModAction("silencing")
        try {
            await silenceUser(user.userId, authUser.uid, 24)
            setModAction("silenced")
        } catch (err) {
            console.error("Error silencing user:", err)
            setModAction(null)
        }
    }

    return (
        <Card className="overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <span className="font-serif text-lg tracking-tight group-hover:text-primary transition-colors">
                        {user.nickname}
                    </span>
                    {user.isTop100 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            <Crown className="w-2.5 h-2.5" />
                            Top 100
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Moderation buttons */}
                    {isMod && authUser?.uid !== user.userId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSilenceUser}
                                disabled={modAction !== null}
                                className="h-6 w-6 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                title="Silenciar usuario (24h)"
                            >
                                <VolumeX className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeletePost}
                                disabled={modAction !== null}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Eliminar esencia"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                    {modAction === "silenced" && (
                        <span className="text-[9px] text-amber-600 font-bold uppercase">Silenciado</span>
                    )}
                    {(user.age || true) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-light">
                            <Clock className="w-3 h-3" />
                            {user.timeAgo || "Ahora"}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pb-4">
                <div className="relative">
                    <p className="text-base font-light leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {user.bio}
                    </p>

                    {continuations.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {continuations.map((cont, idx) => (
                                <div key={cont.id} className="pt-3 border-t border-border/10">
                                    <p className="text-[15px] font-light leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                        {cont.text}
                                    </p>
                                    {(isCadaver || cont.authorNickname) && (
                                        <p className="text-[10px] text-muted-foreground mt-1 text-right italic">
                                            — {cont.authorNickname || "Alma Anónima"}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {authUser && (isCadaver || (isOwner && canAdd)) && !isWritingContinuation && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsWritingContinuation(true)}
                        className="h-auto p-0 mt-4 text-xs text-primary hover:text-accent font-medium flex items-center gap-1"
                    >
                        Añadir continuación <Plus className="w-3 h-3" />
                    </Button>
                )}

                {authUser && (isCadaver || (isOwner && canAdd)) && isWritingContinuation && (
                    <div className="mt-4 p-3 bg-secondary/20 rounded-lg space-y-2">
                        <Textarea
                            placeholder="Añade tu siguiente pensamiento..."
                            value={newContinuationText}
                            onChange={(e) => setNewContinuationText(e.target.value.slice(0, 1000))}
                            className="text-sm bg-background/50 resize-none min-h-[80px]"
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground">{newContinuationText.length}/1000</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsWritingContinuation(false)}>Cancelar</Button>
                                <Button size="sm" className="h-7 text-xs" disabled={isSubmittingContinuation || !newContinuationText.trim()} onClick={handleAddContinuation}>
                                    {isSubmittingContinuation ? "Añadiendo..." : "Añadir"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                    {user.authors && (
                        <div className="px-2.5 py-1 rounded-lg bg-accent/30 text-[11px] font-medium text-muted-foreground border border-border/20">
                            Influencias: {user.authors}
                        </div>
                    )}
                    {user.credo && (
                        <div className="px-2.5 py-1 rounded-lg bg-primary/5 text-[11px] font-medium text-primary/80 border border-primary/10 italic">
                            &quot;{user.credo}&quot;
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-2 border-t border-border/20 bg-accent/10">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn(
                            "h-8 px-2 gap-1.5 text-xs transition-all",
                            hasLiked ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                        {currentLikes}
                    </Button>
                </div>

                {status === "idle" ? (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnect}
                        className="h-8 text-xs font-medium px-4 bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95"
                    >
                        Conectar
                    </Button>
                ) : (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium animate-in fade-in zoom-in duration-300",
                        status === "pending" ? "bg-secondary text-secondary-foreground" : "bg-green-500/10 text-green-500"
                    )}>
                        {status === "pending" ? (
                            <><Clock className="w-3 h-3 animate-pulse" /> Solicitud enviada</>
                        ) : (
                            <><Check className="w-3 h-3" /> Conectados</>
                        )}
                    </div>
                )}
            </CardFooter>

            {isOwner && !isCadaver && !canAdd && (
                <div className="px-6 py-1 bg-primary/5 border-t border-primary/10 text-[9px] text-center text-primary/60 font-medium tracking-wide uppercase">
                    Consigue {remainingForNext} likes más para desbloquear un fragmento
                </div>
            )}
        </Card>
    )
}
