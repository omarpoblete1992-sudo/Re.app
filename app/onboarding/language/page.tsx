"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile, updateUserProfile } from "@/lib/firestore"
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/i18n/config"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/hooks/use-translation"

export default function LanguageOnboardingPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { t } = useTranslation()
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        async function checkExistingPreference() {
            if (!user) return

            try {
                // 1. Check Firestore
                const profile = await getUserProfile(user.uid)
                if (profile?.language) {
                    // User already has a language set, skip this step
                    localStorage.setItem("reflexion-language", profile.language)
                    router.replace("/onboarding/soul")
                    return
                }

                // 2. Check LocalStorage
                const localLang = localStorage.getItem("reflexion-language") as LanguageCode | null
                if (localLang && SUPPORTED_LANGUAGES[localLang]) {
                    // Backfill firestore
                    await updateUserProfile(user.uid, { language: localLang })
                    router.replace("/onboarding/soul")
                    return
                }
            } catch (error) {
                console.error("Error checking language preference:", error)
            } finally {
                setIsChecking(false)
            }
        }

        checkExistingPreference()
    }, [user, router])

    const handleContinue = async () => {
        if (!selectedLanguage || !user) return

        setIsSaving(true)
        try {
            await updateUserProfile(user.uid, { language: selectedLanguage })
            localStorage.setItem("reflexion-language", selectedLanguage)
            router.push("/onboarding/soul")
        } catch (error) {
            console.error("Error saving language preference:", error)
            setIsSaving(false)
        }
    }

    if (isChecking) {
        return (
            <ProtectedRoute>
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="text-center animate-pulse">
                        <p className="font-serif text-xl mb-4">Escuchando tu idioma...</p>
                        <p className="font-serif text-xl opacity-50">Listening to your language...</p>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="flex flex-col items-center justify-center min-h-screen p-4 max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="font-serif text-3xl md:text-4xl text-primary font-bold tracking-tight">
                        {t("onboarding.language_title")}
                    </h1>

                    <p className="mt-8 text-md text-muted-foreground pt-4 max-w-xl mx-auto">
                        {t("onboarding.language_subtitle")}
                    </p>
                </div>

                <div className="w-full px-4">
                    <LanguageSelector
                        value={selectedLanguage}
                        onChange={setSelectedLanguage}
                        showLabels={true}
                    />
                </div>

                <div className="pt-8 w-full max-w-md">
                    <Button
                        size="lg"
                        className={cn(
                            "w-full text-lg transition-all duration-500",
                            selectedLanguage ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                        )}
                        disabled={!selectedLanguage || isSaving}
                        onClick={handleContinue}
                    >
                        {isSaving ? "..." : selectedLanguage ? `${t("onboarding.continue")} ${SUPPORTED_LANGUAGES[selectedLanguage].name}` : t("onboarding.continue")}
                    </Button>
                </div>
            </div>
        </ProtectedRoute>
    )
}
