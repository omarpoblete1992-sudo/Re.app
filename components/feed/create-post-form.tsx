"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { createPost, getUserProfile, UserProfile, isUserSilenced } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"

const postSchema = z.object({
    bio: z.string().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
})

type PostFormValues = z.infer<typeof postSchema>

interface CreatePostFormProps {
    feedType: string
    onSuccess?: () => void
}

export function CreatePostForm({ feedType, onSuccess }: CreatePostFormProps) {
    const { user } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loadingProfile, setLoadingProfile] = useState(true)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            bio: "",
        },
    })

    // Fetch user profile on mount
    useEffect(() => {
        async function fetchProfile() {
            if (!user) {
                setLoadingProfile(false)
                return
            }
            try {
                const userProfile = await getUserProfile(user.uid)
                setProfile(userProfile)
            } catch (err) {
                console.error("Error fetching profile:", err)
            } finally {
                setLoadingProfile(false)
            }
        }
        fetchProfile()
    }, [user])

    const displayNickname = profile?.nickname || user?.displayName || "Alma Anónima"

    const onSubmit = async (data: PostFormValues) => {
        if (!user) return
        try {
            await createPost({
                userId: user.uid,
                nickname: displayNickname,
                bio: data.bio,
                authors: profile?.authors,
                credo: profile?.credo,
                feed: feedType,
                gender: profile?.gender,
                interestedIn: profile?.interestedIn,
            })
            reset()
            onSuccess?.()
        } catch (err: unknown) {
            const error = err as Error
            console.error("Error creating post:", error)
        }
    }

    if (loadingProfile) {
        return (
            <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center animate-pulse">
                        Cargando tu perfil...
                    </p>
                </CardContent>
            </Card>
        )
    }

    const silenced = isUserSilenced(profile)

    return (
        <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
                {silenced ? (
                    <div className="text-center py-4 space-y-2">
                        <p className="text-sm font-medium text-amber-600">🔇 Tu cuenta está silenciada temporalmente</p>
                        <p className="text-xs text-muted-foreground">
                            No puedes publicar hasta el {profile?.silencedUntil?.toDate().toLocaleString("es-CL")}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Publicando como <span className="font-semibold text-foreground">{displayNickname}</span>
                        </p>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tu Esencia</label>
                            <Textarea
                                {...register("bio")}
                                placeholder="Escribe lo que realmente importa. Sin filtros, sin imágenes."
                                className="min-h-[120px] bg-background/50 resize-none"
                            />
                            {errors.bio && (
                                <p className="text-xs text-destructive">{errors.bio.message}</p>
                            )}
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Publicando..." : "Publicar mi esencia"}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
