"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { createPost, getUserProfile } from "@/lib/firestore"
import { BASE_CHAR_LIMIT } from "@/lib/post-limits"
import { Send, PenLine } from "lucide-react"

interface CreatePostFormProps {
    feedType: string
    onPostCreated: () => void
}

export function CreatePostForm({ feedType, onPostCreated }: CreatePostFormProps) {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = React.useState(false)
    const [bio, setBio] = React.useState("")
    const [authors, setAuthors] = React.useState("")
    const [credo, setCredo] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState("")

    const charCount = bio.length
    const isOverLimit = charCount > BASE_CHAR_LIMIT

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mb-6 p-4 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors text-sm flex items-center justify-center gap-2"
            >
                <PenLine className="h-4 w-4" />
                Compartir un pensamiento...
            </button>
        )
    }

    async function handleSubmit() {
        if (!user || !bio.trim()) return
        if (isOverLimit) {
            setError(`Tu texto excede los ${BASE_CHAR_LIMIT} caracteres permitidos.`)
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            // Get user profile for nickname, gender, etc.
            const profile = await getUserProfile(user.uid)
            const nickname = profile?.nickname || user.displayName || "Alma Anónima"
            const gender = profile?.gender || ""
            const interestedIn = profile?.interestedIn || ""
            const birthDate = profile?.birthDate || ""

            // Calculate age
            let age: number | undefined
            if (birthDate) {
                const birth = new Date(birthDate)
                const today = new Date()
                age = today.getFullYear() - birth.getFullYear()
                const m = today.getMonth() - birth.getMonth()
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--
                }
            }

            await createPost({
                userId: user.uid,
                nickname,
                bio: bio.trim(),
                authors: authors.trim(),
                credo: credo.trim(),
                feed: feedType,
                age: age || 0,
                gender,
                interestedIn,
            })

            setBio("")
            setAuthors("")
            setCredo("")
            setIsOpen(false)
            onPostCreated()
        } catch (err: any) {
            console.error("Error creating post:", err)
            // Specific check for index error which is common in Firestore
            if (err.message && err.message.includes("index")) {
                setError("Error de base de datos: Falta crear un índice compuesto. Revisa la consola del navegador.")
            } else {
                setError(`Error al publicar: ${err.message || "Intenta de nuevo."}`)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div>
                    <textarea
                        value={bio}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                        placeholder="Escribe lo que tu alma quiere decir..."
                        className="w-full min-h-[120px] p-3 bg-transparent border border-border rounded-md text-foreground placeholder-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring font-serif"
                    />
                    <div className={`text-xs text-right mt-1 ${isOverLimit ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                        {charCount}/{BASE_CHAR_LIMIT}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <input
                        value={authors}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthors(e.target.value)}
                        placeholder="Autores que te inspiran (opcional)"
                        className="w-full p-2 bg-transparent border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                        value={credo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredo(e.target.value)}
                        placeholder="Tu credo (opcional)"
                        className="w-full p-2 bg-transparent border border-border rounded-md text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsOpen(false)
                            setBio("")
                            setAuthors("")
                            setCredo("")
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !bio.trim() || isOverLimit}
                    >
                        {isSubmitting ? "Publicando..." : <React.Fragment><Send className="mr-2 h-4 w-4" /> Publicar</React.Fragment>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
