"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { createPost } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"

const postSchema = z.object({
    nickname: z.string().min(2, "Mínimo 2 caracteres").max(20, "Máximo 20 caracteres"),
    bio: z.string().min(10, "Mínimo 10 caracteres").max(1000, "Máximo 1000 caracteres"),
    authors: z.string().optional(),
    credo: z.string().optional(),
})

type PostFormValues = z.infer<typeof postSchema>

interface CreatePostFormProps {
    feedType: string
    onSuccess?: () => void
}

export function CreatePostForm({ feedType, onSuccess }: CreatePostFormProps) {
    const { user } = useAuth()
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            nickname: "",
            bio: "",
            authors: "",
            credo: "",
        },
    })

    const onSubmit = async (data: PostFormValues) => {
        if (!user) return
        try {
            await createPost({
                userId: user.uid,
                nickname: data.nickname,
                bio: data.bio,
                authors: data.authors,
                credo: data.credo,
                feed: feedType,
            })
            reset()
            onSuccess?.()
        } catch (err: unknown) {
            const error = err as Error
            console.error("Error creating post:", error)
        }
    }

    return (
        <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre / Pseudónimo</label>
                            <Input
                                {...register("nickname")}
                                placeholder="¿Cómo quieres ser recordado?"
                                className="bg-background/50"
                            />
                            {errors.nickname && (
                                <p className="text-xs text-destructive">{errors.nickname.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tu Credo (opcional)</label>
                            <Input
                                {...register("credo")}
                                placeholder="Una frase que defina tu alma"
                                className="bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tu Esencia (Bio / Pensamiento)</label>
                        <Textarea
                            {...register("bio")}
                            placeholder="Escribe lo que realmente importa. Sin filtros, sin imágenes."
                            className="min-h-[120px] bg-background/50 resize-none"
                        />
                        {errors.bio && (
                            <p className="text-xs text-destructive">{errors.bio.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Influencias / Autores (opcional)</label>
                        <Input
                            {...register("authors")}
                            placeholder="Ej: Nietzsche, Cortázar, Tu abuela..."
                            className="bg-background/50"
                        />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Publicando..." : "Publicar mi esencia"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
