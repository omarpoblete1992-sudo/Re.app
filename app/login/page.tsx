import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-serif tracking-tight">Reflexión</h1>
                    <p className="text-muted-foreground text-sm">Donde el alma es lo único que importa.</p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
