"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, initializing } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!initializing && !user) {
            router.push("/login")
        }
    }, [initializing, user, router])

    if (initializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="space-y-6 text-center">
                    <div className="w-10 h-10 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-lg font-serif italic text-muted-foreground tracking-wide">
                        Conectando con tu alma...
                    </p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}
