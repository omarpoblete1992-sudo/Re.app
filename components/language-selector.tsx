"use client"

import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/i18n/config"
import { cn } from "@/lib/utils"
import { useTranslation, emitLanguageChange } from "@/hooks/use-translation"

interface LanguageSelectorProps {
    value: LanguageCode | null
    onChange: (lang: LanguageCode) => void
    showLabels?: boolean
}

export function LanguageSelector({ value, onChange, showLabels = true }: LanguageSelectorProps) {
    const { t } = useTranslation()
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {(Object.entries(SUPPORTED_LANGUAGES) as [LanguageCode, typeof SUPPORTED_LANGUAGES[LanguageCode]][]).map(([code, config]) => {
                // Traducción estática per-flag para mantener congruencia (el saludo siempre es en ese idioma específico)
                const precalculatedPreviews: Record<LanguageCode, string> = {
                    es: "Hola", en: "Hello", pt: "Olá", fr: "Bonjour"
                }

                return (
                    <button
                        key={code}
                        onClick={() => {
                            onChange(code)
                            emitLanguageChange(code)
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 relative group overflow-hidden bg-card/50 backdrop-blur-sm",
                            showLabels ? "p-8" : "p-4",
                            value === code
                                ? "border-primary shadow-[0_0_30px_-5px_hsl(var(--primary))]"
                                : "border-border/50 hover:border-primary/50 hover:bg-card/80"
                        )}
                    >
                        {/* Checkmark indicator */}
                        {value === code && (
                            <div className={cn(
                                "absolute bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg animate-in zoom-in",
                                showLabels ? "top-3 right-3 w-6 h-6" : "top-2 right-2 w-4 h-4"
                            )}>
                                <svg className={showLabels ? "w-4 h-4" : "w-3 h-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}

                        <span className={cn(
                            "bg-background/50 rounded-full shadow-inner",
                            showLabels ? "text-5xl mb-4 p-4" : "text-3xl mb-2 p-2"
                        )}>
                            {config.flag}
                        </span>

                        <span className={cn(
                            "font-bold",
                            showLabels ? "text-lg mb-1" : "text-sm"
                        )}>
                            {config.name}
                        </span>

                        {showLabels && (
                            <span className="text-muted-foreground font-serif italic text-sm">
                                "{precalculatedPreviews[code]}"
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
