"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, userRole, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (userRole !== "admin" && userRole !== "moderator") {
                router.push("/app/feed")
            }
        }
    }, [user, userRole, loading, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="animate-pulse text-4xl font-serif">Reflexión</div>
                    <p className="text-sm text-muted-foreground">Verificando permisos...</p>
                </div>
            </div>
        )
    }

    if (!user || (userRole !== "admin" && userRole !== "moderator")) {
        return null
    }

    return <>{children}</>
}
