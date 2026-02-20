"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Moon } from "lucide-react"

export function NocturnoGate({ onEnter }: { onEnter: () => void }) {
    const [isOpen, setIsOpen] = useState(true)

    const handleEnter = () => {
        setIsOpen(false)
        onEnter()
    }

    return (
        <Modal isOpen={isOpen} onClose={() => window.history.back()} title="Modo Nocturno">
            <div className="space-y-4 text-center">
                <div className="flex justify-center my-4">
                    <Moon className="h-12 w-12 text-indigo-500" />
                </div>
                <p className="font-serif text-lg">
                    Entras en una zona de honestidad brutal.
                </p>
                <div className="text-sm text-muted-foreground space-y-2">
                    <p>Aquí se comparten los pensamientos que no se dicen a la luz del día.</p>
                    <p className="font-bold text-foreground">¿Estás dispuesto a leer sin juzgar?</p>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                        Mejor no
                    </Button>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleEnter}>
                        Entrar
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
