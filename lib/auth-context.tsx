"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
    User,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    updateProfile,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserRole } from "@/lib/firestore"

interface AuthContextType {
    user: User | null
    userRole: UserRole
    loading: boolean
    initializing: boolean
    trialActive: boolean
    trialEnd: Date | null
    subscriptionActive: boolean
    isLimitedMode: boolean
    signUp: (email: string, password: string, nickname: string, extra: Record<string, string>) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userRole: "user",
    loading: true,
    initializing: true,
    trialActive: false,
    trialEnd: null,
    subscriptionActive: false,
    isLimitedMode: false,
    signUp: async () => { },
    signIn: async () => { },
    signInWithGoogle: async () => { },
    logout: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userRole, setUserRole] = useState<UserRole>("user")
    const [loading, setLoading] = useState(true)
    const [initializing, setInitializing] = useState(true)
    const [isWaitingForProfile, setIsWaitingForProfile] = useState(false)
    const [hasProfileWaitFailed, setHasProfileWaitFailed] = useState(false)
    const [isLimitedMode, setIsLimitedMode] = useState(false)
    const [pendingUser, setPendingUser] = useState<User | null>(null)
    const [trialActive, setTrialActive] = useState(false)
    const [trialEnd, setTrialEnd] = useState<Date | null>(null)
    const [subscriptionActive, setSubscriptionActive] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setPendingUser(firebaseUser)
                try {
                    const userRef = doc(db, "users", firebaseUser.uid)
                    let userDoc = await getDoc(userRef)

                    if (!userDoc.exists()) {
                        setIsWaitingForProfile(true)
                        setHasProfileWaitFailed(false)
                        let attempts = 0
                        while (!userDoc.exists() && attempts < 5) {
                            await new Promise(resolve => setTimeout(resolve, 2000))
                            userDoc = await getDoc(userRef)
                            attempts++
                        }

                        if (!userDoc.exists()) {
                            setHasProfileWaitFailed(true)
                            return; // Wait for user interaction
                        }

                        setIsWaitingForProfile(false)
                    }

                    if (!userDoc.exists() || !userDoc.data()?.trialEnd) {
                        await setDoc(userRef, {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            nickname: firebaseUser.displayName || 'Alma Anónima',
                            photoUrl: firebaseUser.photoURL || '',
                            role: 'user',
                            birthDate: '',
                            gender: '',
                            interestedIn: '',
                            banned: false,
                            trialActive: true,
                            trialStart: new Date(), // using local timestamp logic as equivalent
                            trialEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                            subscriptionActive: false,
                            subscriptionEnd: null,
                            firstMutualConnection: false
                        }, { merge: true })
                        userDoc = await getDoc(userRef) // re-fetch to have the complete synchronized object
                    }

                    const data = userDoc.data()!
                    if (data.banned === true) {
                        await firebaseSignOut(auth)
                        setUser(null)
                        setUserRole("user")
                        setTrialActive(false)
                        setSubscriptionActive(false)
                        setLoading(false)
                        setInitializing(false)
                        return
                    }

                    setUserRole((data.role as UserRole) || "user")
                    setTrialActive(data.trialActive || false)
                    setSubscriptionActive(data.subscriptionActive || false)

                    if (data.trialEnd) {
                        setTrialEnd(data.trialEnd.toDate ? data.trialEnd.toDate() : new Date(data.trialEnd))
                    } else {
                        setTrialEnd(null)
                    }
                } catch (error) {
                    console.error("Error setting up user profile in AuthProvider", error);
                    setUserRole("user")
                }
                setUser(firebaseUser)
            } else {
                setUser(null)
                setUserRole("user")
            }

            setLoading(false) // Esto se ejecuta SOLO DESPUÉS de haber obtenido/escrito el userDoc
            setInitializing(false)
        })
        return () => unsubscribe()
    }, [])

    const signUp = async (
        email: string,
        password: string,
        nickname: string,
        extra: Record<string, string>
    ) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName: nickname })

        // La Cloud Function onUserCreated crea el doc base automáticamente.
        // Aquí solo mergeamos los campos extra del formulario de registro.
        await setDoc(doc(db, "users", credential.user.uid), {
            birthDate: extra.birthDate || "",
            gender: extra.gender || "",
            interestedIn: extra.interestedIn || "",
        }, { merge: true })
        setUserRole("user")
    }

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password)
    }

    const signInWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider)
        // El estado de AuthContext (loading/user) será manejado por onAuthStateChanged automáticamente después del signIn.
    }

    const logout = async () => {
        await firebaseSignOut(auth)
        setUserRole("user")
        setIsLimitedMode(false)
    }

    const handleRetry = () => {
        window.location.reload()
    }

    const handleLimitedMode = async () => {
        if (!pendingUser) return;

        setIsWaitingForProfile(false);
        setHasProfileWaitFailed(false);
        setIsLimitedMode(true);

        try {
            const userRef = doc(db, "users", pendingUser.uid)
            const trialLimit = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            await setDoc(userRef, {
                uid: pendingUser.uid,
                email: pendingUser.email || '',
                nickname: pendingUser.displayName || 'Alma Anónima',
                photoUrl: pendingUser.photoURL || '',
                role: 'user',
                birthDate: '',
                gender: '',
                interestedIn: '',
                banned: false,
                trialActive: true,
                trialStart: new Date(),
                trialEnd: trialLimit,
                subscriptionActive: false,
                subscriptionEnd: null,
                firstMutualConnection: false
            }, { merge: true })

            setUserRole("user")
            setTrialActive(true)
            setTrialEnd(trialLimit)
            setSubscriptionActive(false)
        } catch (error) {
            console.error("Error en modo limitado:", error);
            setUserRole("user")
        }

        setUser(pendingUser)
        setLoading(false)
        setInitializing(false)
    }

    if (isWaitingForProfile) {
        if (hasProfileWaitFailed) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                    <div className="space-y-6 text-center max-w-md">
                        <div className="w-12 h-12 mx-auto text-orange-500">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-serif">Demora en el servidor</h2>
                        <p className="text-muted-foreground text-sm">
                            Nuestros servicios de creación de perfil están tardando más de lo esperado en responder.
                        </p>
                        <div className="flex flex-col gap-3 pt-4">
                            <button onClick={handleRetry} className="bg-primary text-primary-foreground py-2 px-4 rounded-md text-sm font-medium">
                                Reintentar conexión
                            </button>
                            <button onClick={handleLimitedMode} className="bg-transparent border border-input py-2 px-4 rounded-md text-sm font-medium hover:bg-muted">
                                Continuar en modo limitado
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="space-y-6 text-center">
                    <div className="w-10 h-10 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-lg font-serif italic text-muted-foreground tracking-wide">
                        Preparando tu espacio...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, userRole, loading, initializing, trialActive, trialEnd, subscriptionActive, isLimitedMode, signUp, signIn, signInWithGoogle, logout }}>
            {isLimitedMode && (
                <div className="bg-orange-500/10 border-b border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs py-1.5 w-full text-center relative z-50">
                    Sincronizando con el servidor. Algunas funciones podrían estar limitadas.
                </div>
            )}
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
