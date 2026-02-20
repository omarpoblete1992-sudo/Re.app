"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RegisterSchema, RegisterSchemaType } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const { signUp, signInWithGoogle } = useAuth()
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterSchemaType>({
        resolver: zodResolver(RegisterSchema),
    })

    async function onSubmit(data: RegisterSchemaType) {
        setIsLoading(true)
        setError("")
        try {
            await signUp(data.email, data.password, data.nickname, {
                birthDate: data.birthDate,
                gender: data.gender,
                interestedIn: data.interestedIn,
            })
            router.push("/onboarding/soul")
        } catch (err: unknown) {
            const firebaseError = err as { code?: string }
            if (firebaseError.code === "auth/email-already-in-use") {
                setError("Este email ya está registrado. Intenta iniciar sesión.")
            } else if (firebaseError.code === "auth/weak-password") {
                setError("La contraseña es muy débil. Usa al menos 6 caracteres.")
            } else {
                setError("Error al crear tu cuenta. Intenta de nuevo.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogle() {
        setIsLoading(true)
        setError("")
        try {
            await signInWithGoogle()
            router.push("/onboarding/soul")
        } catch (err: unknown) {
            const firebaseError = err as { code?: string }
            if (firebaseError.code !== "auth/popup-closed-by-user") {
                setError("Error con Google Sign-In. Intenta de nuevo.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="font-serif text-2xl">Crea tu Alma</CardTitle>
                <CardDescription>
                    Únete a Reflexión y comienza a conectar de verdad.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input id="email" type="email" placeholder="tu@email.com" {...register("email")} />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="nickname" className="text-sm font-medium">Apodo (Alma)</label>
                        <Input id="nickname" placeholder="Cómo quieres ser conocido" {...register("nickname")} />
                        {errors.nickname && <p className="text-sm text-red-500">{errors.nickname.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
                        <Input id="password" type="password" {...register("password")} />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="birthDate" className="text-sm font-medium">Fecha de Nacimiento</label>
                        <Input id="birthDate" type="date" {...register("birthDate")} />
                        {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="gender" className="text-sm font-medium">Soy</label>
                            <select
                                id="gender"
                                {...register("gender")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Seleccionar</option>
                                <option value="male">Hombre</option>
                                <option value="female">Mujer</option>
                                <option value="non-binary">No binario</option>
                                <option value="other">Otro</option>
                            </select>
                            {errors.gender && <p className="text-sm text-red-500">{errors.gender.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="interestedIn" className="text-sm font-medium">Busco</label>
                            <select
                                id="interestedIn"
                                {...register("interestedIn")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">Seleccionar</option>
                                <option value="male">Hombres</option>
                                <option value="female">Mujeres</option>
                                <option value="everyone">Tod@s</option>
                            </select>
                            {errors.interestedIn && <p className="text-sm text-red-500">{errors.interestedIn.message}</p>}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creando..." : "Continuar"}
                    </Button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">o regístrate con</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogle}
                    disabled={isLoading}
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Registrarse con Google
                </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-xs text-muted-foreground">
                    ¿Ya tienes cuenta? <a href="/login" className="underline text-accent">Inicia sesión</a>.
                    Al registrarte aceptas nuestro <a href="/manifiesto" className="underline">Manifiesto</a>.
                </p>
            </CardFooter>
        </Card>
    )
}
