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
    signUp: (email: string, password: string, nickname: string, extra: Record<string, string>) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userRole: "user",
    loading: true,
    signUp: async () => { },
    signIn: async () => { },
    signInWithGoogle: async () => { },
    logout: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userRole, setUserRole] = useState<UserRole>("user")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch role and ban status from Firestore
                try {
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
                    if (userDoc.exists()) {
                        const data = userDoc.data()

                        // Check if user is banned
                        if (data.banned === true) {
                            await firebaseSignOut(auth)
                            setUser(null)
                            setUserRole("user")
                            setLoading(false)
                            return
                        }

                        setUserRole((data.role as UserRole) || "user")
                    } else {
                        // El doc podría no existir aún si la Cloud Function está en ejecución.
                        // Se asigna role "user" por defecto.
                        setUserRole("user")
                    }
                } catch {
                    setUserRole("user")
                }
                setUser(firebaseUser)
            } else {
                setUser(null)
                setUserRole("user")
            }

            setLoading(false)
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
        const result = await signInWithPopup(auth, googleProvider)
        const uid = result.user.uid;

        // Polling para esperar a que onUserCreated (Cloud Function) cree el perfil
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserRole((data.role as UserRole) || "user");
                return;
            }
            // Esperar 1 segundo antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        // Timeout si la Cloud Function falló o demoró demasiado
        throw new Error("Timeout: El perfil no se pudo crear a tiempo. Por favor, intenta iniciar sesión nuevamente.");
    }

    const logout = async () => {
        await firebaseSignOut(auth)
        setUserRole("user")
    }

    return (
        <AuthContext.Provider value={{ user, userRole, loading, signUp, signIn, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
