"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Check, Clock, Crown, ChevronDown, ChevronUp } from "lucide-react"
import { getMaxChars, getRemainingForExpansion } from "@/lib/post-limits"
import { likePost, createConnection } from "@/lib/firestore"
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
}

export const FeedItem = ({ user }: FeedItemProps) => {
    const [status, setStatus] = useState<"idle" | "pending" | "connected">("idle")
    const [expanded, setExpanded] = useState(false)
    const [currentLikes, setCurrentLikes] = useState(user.likes ?? 0)
    const [hasLiked, setHasLiked] = useState(false)
    const { user: authUser } = useAuth()

    const maxChars = getMaxChars(currentLikes)
    const needsExpansion = user.bio.length > maxChars
    const displayBio = expanded ? user.bio : user.bio.slice(0, maxChars)
    const remainingForNext = getRemainingForExpansion(currentLikes)

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
                {(user.age || true) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-light">
                        <Clock className="w-3 h-3" />
                        {user.timeAgo || "Ahora"}
                    </div>
                )}
            </CardHeader>

            <CardContent className="pb-4">
                <div className="relative">
                    <p className="text-base font-light leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {displayBio}
                        {!expanded && needsExpansion && "..."}
                    </p>

                    {needsExpansion && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                            className="h-auto p-0 mt-2 text-xs text-primary hover:text-accent font-medium flex items-center gap-1"
                        >
                            {expanded ? (
                                <>Ver menos <ChevronUp className="w-3 h-3" /></>
                            ) : (
                                <>Continuar leyendo <ChevronDown className="w-3 h-3" /></>
                            )}
                        </Button>
                    )}
                </div>

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

            {!expanded && needsExpansion && (
                <div className="px-6 py-1 bg-primary/5 border-t border-primary/10 text-[9px] text-center text-primary/60 font-medium tracking-wide uppercase">
                    Consigue {remainingForNext} likes más para desbloquear todo el perfil
                </div>
            )}
        </Card>
    )
}
