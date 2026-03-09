export type LanguageCode = "es" | "en" | "pt" | "fr"

export interface LanguageInfo {
    name: string
    flag: string
    locale: string
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
    es: { name: "Español", flag: "🇪🇸", locale: "es-ES" },
    en: { name: "English", flag: "🇬🇧", locale: "en-US" },
    pt: { name: "Português", flag: "🇧🇷", locale: "pt-BR" },
    fr: { name: "Français", flag: "🇫🇷", locale: "fr-FR" },
}

export const DEFAULT_LANGUAGE: LanguageCode = "es"
