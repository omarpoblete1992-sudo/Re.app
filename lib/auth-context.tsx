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
                try {
                    const userRef = doc(db, "users", firebaseUser.uid)
                    let userDoc = await getDoc(userRef)

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
                        setLoading(false)
                        return
                    }

                    setUserRole((data.role as UserRole) || "user")
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
    }

    return (
        <AuthContext.Provider value={{ user, userRole, loading, signUp, signIn, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
