"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen">
                <div className="hidden md:block w-64 shrink-0">
                    <Sidebar />
                </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
