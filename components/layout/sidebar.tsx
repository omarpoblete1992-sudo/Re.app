"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, User, Settings, Moon, Users, Crown, HeartCrack, LogOut, ShieldCheck } from "lucide-react"
import { Suspense } from "react"
import { useAuth } from "@/lib/auth-context"

interface SidebarContentProps {
    className?: string
    onNavigate?: () => void
}

function SidebarContent({ className, onNavigate }: SidebarContentProps) {
    const pathname = usePathname()
    const { userRole } = useAuth()

    const navItems = [
        {
            title: "Feed",
            href: "/app/feed",
            icon: Heart,
        },
        {
            title: "Mensajes",
            href: "/app/chat",
            icon: MessageCircle,
        },
        {
            title: "Comunidad",
            href: "/app/community",
            icon: Users,
        },
        {
            title: "Top 100",
            href: "/app/top100",
            icon: Crown,
        },
        {
            title: "Perfil",
            href: "/app/profile",
            icon: User,
        },
        {
            title: "Ajustes",
            href: "/app/settings",
            icon: Settings,
        },
        // Admin link — only visible to admins and moderators
        ...((userRole === "admin" || userRole === "moderator") ? [{
            title: "Admin",
            href: "/app/admin",
            icon: ShieldCheck,
        }] : []),
    ]

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="p-6">
                <Link href="/app/feed" className="flex items-center gap-2 font-serif text-2xl tracking-tighter" onClick={onNavigate}>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Moon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span>Reflexión</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href} onClick={onNavigate}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3 font-light text-base h-11",
                                    isActive ? "bg-secondary/50 font-medium" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.title}
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="p-4 rounded-2xl bg-accent/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        <HeartCrack className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Modo Nocturno</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Explora la esencia de otros sin distracciones visuales.
                    </p>
                </div>

                <Button variant="ghost" className="w-full justify-start gap-3 mt-4 text-muted-foreground hover:text-destructive transition-colors">
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                </Button>
            </div>
        </div>
    )
}

interface SidebarProps {
    className?: string
    isOpen?: boolean
    onClose?: () => void
}

export function Sidebar({ className, isOpen = false, onClose }: SidebarProps) {
    return (
        <>
            {/* Desktop sidebar — always visible on lg+ */}
            <div className={cn("hidden lg:flex flex-col w-64 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
                <Suspense fallback={<div className="p-6">Cargando...</div>}>
                    <SidebarContent />
                </Suspense>
            </div>

            {/* Mobile drawer — only on < lg */}
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sliding panel */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border/40 transform transition-transform duration-300 ease-in-out lg:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <Suspense fallback={<div className="p-6">Cargando...</div>}>
                    <SidebarContent onNavigate={onClose} />
                </Suspense>
            </div>
        </>
    )
}
