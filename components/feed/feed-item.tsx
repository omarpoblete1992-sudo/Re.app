"use client"

import * as React from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Check, Clock, Crown, HeartCrack, ChevronDown, ChevronUp } from "lucide-react"
import { getMaxChars, getRemainingForExpansion, BASE_CHAR_LIMIT } from "@/lib/post-limits"
import { likePost } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"

export interface FeedItemProps {
    user: {
        id: string
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
    const [status, setStatus] = React.useState<"idle" | "pending" | "connected">("idle")
    const [expanded, setExpanded] = React.useState(false)
    const [currentLikes, setCurrentLikes] = React.useState(user.likes ?? 0)
    const [hasLiked, setHasLiked] = React.useState(false)
    const { user: authUser } = useAuth()

    const maxChars = getMaxChars(currentLikes)
    const likesForNext = getRemainingForExpansion(currentLikes)
    const bioLength = user.bio.length
    const isLong = bioLength > BASE_CHAR_LIMIT

    // Truncate to base limit if not expanded and text is long
    const displayBio = !expanded && isLong
        ? user.bio.slice(0, BASE_CHAR_LIMIT) + "..."
        : user.bio

    const handleLike = async () => {
        if (hasLiked) return
        try {
            await likePost(user.id)
            setCurrentLikes((prev: number) => prev + 1)
            setHasLiked(true)
        } catch (err: any) {
            console.error("Error liking post:", err)
        }
    }

    const handleConnect = async () => {
        if (!authUser || status !== "idle") return
        try {
            setStatus("pending")
            // Future implementation:
            // await createConnection(authUser.uid, user.userId)
        } catch (err: any) {
            console.error("Error connecting:", err)
            setStatus("idle")
        }
    }

    // Visual badge based on feed type
    const getBadge = () => {
        if (user.isTop100) {
            return (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                    <Crown className="h-3 w-3" /> Top 100
                </span>
            )
        }
        if (currentLikes < 100) {
            return (
                <span className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full">
                    <HeartCrack className="h-3 w-3" /> Alma oculta
                </span>
            )
        }
        return (
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Alma Reciente
            </span>
        )
    }

    return (
        <Card className="mb-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/10">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <span className="font-serif text-lg font-bold tracking-tight">{user.nickname}</span>
                    {getBadge()}
                </div>
                {user.age ? (
                    <span className="text-xs text-muted-foreground">{user.age} años</span>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed font-serif text-foreground/90 whitespace-pre-line">
                    {displayBio}
                </p>

                {/* Expand/collapse for long posts */}
                {isLong && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                        {expanded ? (
                            <React.Fragment><ChevronUp className="h-3 w-3" /> Mostrar menos</React.Fragment>
                        ) : (
                            <React.Fragment><ChevronDown className="h-3 w-3" /> Leer más ({bioLength} caracteres)</React.Fragment>
                        )}
                    </button>
                )}

                {(user.authors || user.credo) && (
                    <div className="pt-4 border-t border-border/40 grid gap-2 text-sm text-muted-foreground">
                        {user.credo && (
                            <div className="italic">
                                &ldquo;{user.credo}&rdquo;
                            </div>
                        )}
                        {user.authors && (
                            <div className="text-xs">
                                <span className="font-semibold">Lee a:</span> {user.authors}
                            </div>
                        )}
                    </div>
                )}

                {/* Character limit info + likes */}
                <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                    <button
                        onClick={handleLike}
                        disabled={hasLiked}
                        className={`flex items-center gap-1 transition-colors ${hasLiked ? "text-pink-500" : "hover:text-pink-500 cursor-pointer"
                            }`}
                    >
                        <Heart className={`h-3 w-3 ${hasLiked ? "fill-current" : ""}`} />
                        <span>{currentLikes} conexiones</span>
                    </button>
                    <span title={`Máximo actual: ${maxChars} caracteres. Faltan ${likesForNext} likes para desbloquear +1000 más.`}>
                        {maxChars} chars máx · {likesForNext}❤️ para +1000
                    </span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center group">
                <Button
                    variant={status === "idle" ? "ghost" : "secondary"}
                    size="sm"
                    className={`transition-colors ${status === "idle" ? "text-muted-foreground group-hover:text-pink-600" : ""}`}
                    onClick={handleConnect}
                    disabled={status !== "idle"}
                >
                    {status === "idle" && <React.Fragment><Heart className="mr-2 h-4 w-4" /> Conectar</React.Fragment>}
                    {status === "pending" && <React.Fragment><Clock className="mr-2 h-4 w-4" /> Pendiente</React.Fragment>}
                    {status === "connected" && <React.Fragment><Check className="mr-2 h-4 w-4" /> Conectado</React.Fragment>}
                </Button>
                <span className="text-xs text-muted-foreground/50">
                    {user.timeAgo || "Hace poco"}
                </span>
            </CardFooter>
        </Card>
    )
}
