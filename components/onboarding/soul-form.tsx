"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { saveSoul } from "@/lib/firestore"
import { useRouter } from "next/navigation"

const SoulSchema = z.object({
    bioText: z.string().min(10, { message: "Tu esencia necesita al menos 10 caracteres." }).max(500, "Brevedad es el alma del ingenio."),
    authors: z.string().optional(),
    credo: z.string().max(100, "Un credo debe ser conciso.").optional(),
})

type SoulSchemaType = z.infer<typeof SoulSchema>

export function SoulForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const { user } = useAuth()
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SoulSchemaType>({
        resolver: zodResolver(SoulSchema),
    })

    async function onSubmit(data: SoulSchemaType) {
        if (!user) {
            setError("Debes iniciar sesión primero.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            await saveSoul(user.uid, {
                bio: data.bioText,
                authors: data.authors || "",
                credo: data.credo || "",
            })
            router.push("/onboarding/subscription")
        } catch (err) {
            console.error("Error saving soul:", err)
            setError("Error al guardar tu esencia. Intenta de nuevo.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-lg mx-auto border-none shadow-none md:border md:shadow-md">
            <CardHeader>
                <CardTitle className="font-serif text-3xl text-center">Define tu Alma</CardTitle>
                <CardDescription className="text-center italic">
                    &quot;No somos lo que tenemos, somos lo que amamos.&quot;
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="bioText" className="text-sm font-medium">Tu primer pensamiento (Bio)</label>
                        <textarea
                            id="bioText"
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-serif"
                            placeholder="Escribe algo verdadero sobre ti..."
                            {...register("bioText")}
                        />
                        {errors.bioText && <p className="text-sm text-red-500">{errors.bioText.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="authors" className="text-sm font-medium">Tus autores o influencias (separados por comas)</label>
                        <Input id="authors" placeholder="Borges, Woolf, Neruda..." {...register("authors")} />
                        {errors.authors && <p className="text-sm text-red-500">{errors.authors.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="credo" className="text-sm font-medium">Tu Credo (Una frase que te define)</label>
                        <Input id="credo" placeholder="La belleza salvará al mundo." {...register("credo")} />
                        {errors.credo && <p className="text-sm text-red-500">{errors.credo.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Guardando esencia..." : "Continuar"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
