import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="relative w-full max-w-lg p-4">
                <Card className={cn("w-full shadow-lg", className)}>
                    {title && (
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{title}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                                <span className="sr-only">Close</span>
                                {/* Close icon (X) */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </Button>
                        </CardHeader>
                    )}
                    <CardContent>{children}</CardContent>
                </Card>
            </div>
        </div>
    )
}
