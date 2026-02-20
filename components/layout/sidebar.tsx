"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, User, Settings, Moon, BookOpen, Users, Crown, HeartCrack } from "lucide-react"
import { Suspense } from "react"

function SidebarContent({ className }: { className?: string }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentType = searchParams.get("type")

    const feedRoutes = [
        {
            label: "Pareja",
            icon: Heart,
            href: "/app/feed?type=pareja",
            type: "pareja",
            color: "text-rose-500 hover:text-rose-600",
        },
        {
            label: "Amistad",
            icon: Users,
            href: "/app/feed?type=amistad",
            type: "amistad",
            color: "text-emerald-500 hover:text-emerald-600",
        },
        {
            label: "Maestrísimos",
            icon: Crown,
            href: "/app/feed?type=maestrisimos",
            type: "maestrisimos",
            color: "text-amber-500 hover:text-amber-600",
        },
        {
            label: "nadiemequiere",
            icon: HeartCrack,
            href: "/app/feed?type=nadiemequiere",
            type: "nadiemequiere",
            color: "text-violet-500 hover:text-violet-600",
        },
        {
            label: "Nocturno",
            icon: Moon,
            href: "/app/feed?type=nocturno",
            type: "nocturno",
            color: "text-indigo-500 hover:text-indigo-600",
        },
    ]

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-background", className)}>
            <div className="space-y-4 py-4">
                {/* App title */}
                <div className="px-3 py-2">
                    <Link href="/app/feed?type=pareja">
                        <h2 className="mb-2 px-4 text-xl font-semibold tracking-tight font-serif hover:text-accent transition-colors cursor-pointer">
                            Reflexión
                        </h2>
                    </Link>
                </div>

                {/* Feed sections */}
                <div className="px-3 py-2">
                    <h3 className="mb-2 px-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                        Feeds
                    </h3>
                    <div className="space-y-1">
                        {feedRoutes.map((route) => {
                            const isActive = pathname === "/app/feed" && currentType === route.type
                            return (
                                <Link key={route.href} href={route.href}>
                                    <Button
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={cn(
                                            "w-full justify-start",
                                            !isActive && route.color
                                        )}
                                    >
                                        <route.icon className="mr-2 h-4 w-4" />
                                        {route.label}
                                    </Button>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Personal section */}
                <div className="px-3 py-2">
                    <h3 className="mb-2 px-4 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                        Mi Alma
                    </h3>
                    <div className="space-y-1">
                        <Link href="/app/profile">
                            <Button variant="ghost" className="w-full justify-start">
                                <User className="mr-2 h-4 w-4" />
                                Perfil
                            </Button>
                        </Link>
                        <Link href="/app/chat">
                            <Button variant="ghost" className="w-full justify-start">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Mensajes
                            </Button>
                        </Link>
                        <Link href="/app/settings">
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Ajustes
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    return (
        <Suspense fallback={<div className="min-h-screen border-r bg-background" />}>
            <SidebarContent className={className} />
        </Suspense>
    )
}
