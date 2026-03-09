"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { LanguageCode } from "@/lib/i18n/config"
import es from "@/locales/es.json"
import en from "@/locales/en.json"
import pt from "@/locales/pt.json"
import fr from "@/locales/fr.json"

// Type to extract all valid paths from the primary dictionary
type NestedKeyOf<ObjectType extends object> =
    { [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
        ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
        : `${Key}`
    }[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof es>;

const dictionaries: Record<LanguageCode, typeof es> = {
    es,
    en: en as typeof es,
    pt: pt as typeof es,
    fr: fr as typeof es,
}

export function useTranslation() {
    const { user } = useAuth()
    const [currentLang, setCurrentLang] = useState<LanguageCode>("es")
    const [mounted, setMounted] = useState(false)

    // Listen to profile/localStorage changes
    useEffect(() => {
        setMounted(true)

        // Check if there is an explicit user preference in profile (handled via context/firestore directly in real app)
        // For this simple implementation we rely heavily on localStorage as the fast sync
        const stored = localStorage.getItem("reflexion-language") as LanguageCode | null
        if (stored && dictionaries[stored]) {
            setCurrentLang(stored)
        }

        // Add a listener to watch for cross-tab or programmatic local storage changes 
        // when the user changes it from Settings
        const handleStorageChange = () => {
            const newlyStored = localStorage.getItem("reflexion-language") as LanguageCode | null
            if (newlyStored && dictionaries[newlyStored]) {
                setCurrentLang(newlyStored)
            }
        }

        window.addEventListener("storage", handleStorageChange)

        // Custom event to trigger re-renders instantly without reloading
        window.addEventListener("reflexion-language-changed", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
            window.removeEventListener("reflexion-language-changed", handleStorageChange)
        }
    }, [user])

    const t = useCallback((keyString: TranslationKey | string): string => {
        if (!mounted) {
            // Prevent hydration mismatch by optionally returning empty or hardcoded spanish during SSR
            // but here we allow it to process synchronously using the default
        }

        const dict = dictionaries[currentLang] || dictionaries["es"]
        const fallbackDict = dictionaries["es"]

        const keys = keyString.split(".")

        // 1. Try to find in current language
        let result: any = dict
        for (const key of keys) {
            if (result === undefined || result === null) break
            result = result[key as keyof typeof result]
        }

        if (typeof result === "string") return result

        // 2. Fallback to Spanish
        let fallbackResult: any = fallbackDict
        for (const key of keys) {
            if (fallbackResult === undefined || fallbackResult === null) break
            fallbackResult = fallbackResult[key as keyof typeof fallbackResult]
        }

        if (typeof fallbackResult === "string") return fallbackResult

        // 3. Worst case scenario, return the key itself so developers notice
        return keyString
    }, [currentLang, mounted])

    return { t, currentLang }
}

// Emisor de evento utilitario para forzar actualizaciones instantáneas
export const emitLanguageChange = (lang: LanguageCode) => {
    localStorage.setItem("reflexion-language", lang)
    window.dispatchEvent(new Event("reflexion-language-changed"))
}
