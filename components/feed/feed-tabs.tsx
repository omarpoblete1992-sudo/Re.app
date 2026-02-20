"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Heart, Users, Crown, HeartCrack, Moon } from "lucide-react"

interface FeedTabsProps {
    activeTab: string | null
}

const tabs = [
    {
        id: "pareja",
        label: "Pareja",
        icon: Heart,
        description: "Almas del sexo complementario",
        color: "text-rose-500",
        activeColor: "bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-600 dark:text-rose-400",
    },
    {
        id: "amistad",
        label: "Amistad",
        icon: Users,
        description: "Quien sabe... sin género",
        color: "text-emerald-500",
        activeColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400",
    },
    {
        id: "maestrisimos",
        label: "Maestrísimos",
        icon: Crown,
        description: "Top 100 más influyentes",
        color: "text-amber-500",
        activeColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-600 dark:text-amber-400",
    },
    {
        id: "nadiemequiere",
        label: "nadiemequiere",
        icon: HeartCrack,
        description: "Menos de 100 likes",
        color: "text-violet-500",
        activeColor: "bg-violet-50 dark:bg-violet-950/30 border-violet-500 text-violet-600 dark:text-violet-400",
    },
    {
        id: "nocturno",
        label: "Nocturno",
        icon: Moon,
        description: "Honestidad brutal",
        color: "text-indigo-500",
        activeColor: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-600 dark:text-indigo-400",
    },
]

export function FeedTabs({ activeTab }: FeedTabsProps) {
    return (
        <div className="mb-8">
            {/* Desktop tabs */}
            <div className="hidden md:flex gap-2 flex-wrap">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.id}
                            href={`/app/feed?type=${tab.id}`}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200",
                                isActive
                                    ? tab.activeColor
                                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/50"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", isActive ? "" : tab.color)} />
                            {tab.label}
                        </Link>
                    )
                })}
            </div>

            {/* Mobile tabs (scrollable) */}
            <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4">
                <div className="flex gap-2 w-max">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id
                        const Icon = tab.icon
                        return (
                            <Link
                                key={tab.id}
                                href={`/app/feed?type=${tab.id}`}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-all duration-200 whitespace-nowrap",
                                    isActive
                                        ? tab.activeColor
                                        : "border-border text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-3.5 w-3.5", isActive ? "" : tab.color)} />
                                {tab.label}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Active tab description */}
            {activeTab && (
                <p className="text-xs text-muted-foreground mt-3 pl-1">
                    {tabs.find(t => t.id === activeTab)?.description}
                </p>
            )}
        </div>
    )
}
