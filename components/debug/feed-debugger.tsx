"use client"

import * as React from "react"
import { UserProfile } from "@/lib/firestore"

interface FeedDebuggerProps {
    currentProfile: UserProfile | null
    onSimulateProfile: (profile: UserProfile | null) => void
    totalFetched: number
    totalFiltered: number
    onRefresh: () => void
}

export const FeedDebugger = ({ currentProfile, onSimulateProfile, totalFetched, totalFiltered, onRefresh }: FeedDebuggerProps) => {
    if (process.env.NODE_ENV !== "development") return null;

    const simulate = (gender: string, interestedIn: string) => {
        if (!currentProfile) return;
        onSimulateProfile({
            ...currentProfile,
            gender,
            interestedIn
        });
        onRefresh();
    }

    const clearSimulation = () => {
        onSimulateProfile(null);
        onRefresh();
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg border border-white/20 shadow-2xl max-w-sm text-xs backdrop-blur-md">
            <h3 className="font-bold mb-2 flex justify-between items-center text-orange-400">
                <span>🛠️ Simulador de Feed (Dev)</span>
                {currentProfile?.nickname && <span className="text-[10px] opacity-70 truncate max-w-[100px]">{currentProfile.nickname}</span>}
            </h3>

            <div className="space-y-2 mb-4">
                <div className="bg-white/10 p-2 rounded">
                    <div><span className="opacity-60">Tu Género:</span> {currentProfile?.gender || "No definido"}</div>
                    <div><span className="opacity-60">Tú Buscas:</span> {currentProfile?.interestedIn || "No definido"}</div>
                </div>

                <div className="flex gap-2 text-center text-[10px]">
                    <div className="flex-1 bg-white/5 p-1 rounded">
                        <div className="opacity-60">Total Fetch</div>
                        <div className="font-bold text-sm">{totalFetched}</div>
                    </div>
                    <div className="flex-1 bg-white/5 p-1 rounded">
                        <div className="opacity-60">Mostrando</div>
                        <div className="font-bold text-sm text-green-400">{totalFetched - totalFiltered}</div>
                    </div>
                    <div className="flex-1 bg-white/5 p-1 rounded">
                        <div className="opacity-60">Filtrados</div>
                        <div className="font-bold text-sm text-red-400">{totalFiltered}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <p className="opacity-60 mb-1">Casos de Prueba:</p>
                <button onClick={() => simulate("hombre", "mujeres")} className="w-full text-left px-2 py-1 hover:bg-white/10 rounded transition-colors text-blue-300">
                    👨 Hombre ➔ busca Mujeres
                </button>
                <button onClick={() => simulate("mujer", "hombres")} className="w-full text-left px-2 py-1 hover:bg-white/10 rounded transition-colors text-pink-300">
                    👩 Mujer ➔ busca Hombres
                </button>
                <button onClick={() => simulate("hombre", "hombres")} className="w-full text-left px-2 py-1 hover:bg-white/10 rounded transition-colors text-purple-300">
                    👨 Hombre ➔ busca Hombres
                </button>
                <button onClick={() => simulate("mujer", "todos")} className="w-full text-left px-2 py-1 hover:bg-white/10 rounded transition-colors text-yellow-300">
                    👩 Mujer ➔ busca Todos
                </button>
                <button onClick={() => simulate("no-binario", "todos")} className="w-full text-left px-2 py-1 hover:bg-white/10 rounded transition-colors text-emerald-300">
                    ⚧️ No-Binario ➔ busca Todos
                </button>
                <div className="pt-2 mt-2 border-t border-white/10">
                    <button onClick={clearSimulation} className="w-full bg-white/20 hover:bg-white/30 text-center px-2 py-1 rounded transition-colors">
                        🔄 Usar mi perfil real
                    </button>
                </div>
            </div>
        </div>
    )
}
