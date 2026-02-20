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
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AuthContextType {
    user: User | null
    loading: boolean
    signUp: (email: string, password: string, nickname: string, extra: Record<string, string>) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signUp: async () => { },
    signIn: async () => { },
    signInWithGoogle: async () => { },
    logout: async () => { },
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser)
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

        // Create user document in Firestore
        await setDoc(doc(db, "users", credential.user.uid), {
            email,
            nickname,
            birthDate: extra.birthDate || "",
            gender: extra.gender || "",
            interestedIn: extra.interestedIn || "",
            createdAt: serverTimestamp(),
        })
    }

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password)
    }

    const signInWithGoogle = async () => {
        const credential = await signInWithPopup(auth, googleProvider)

        // Check if user doc exists, create if not
        const userDoc = await getDoc(doc(db, "users", credential.user.uid))
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", credential.user.uid), {
                email: credential.user.email,
                nickname: credential.user.displayName || "Alma Anónima",
                birthDate: "",
                gender: "",
                interestedIn: "",
                createdAt: serverTimestamp(),
            })
        }
    }

    const logout = async () => {
        await firebaseSignOut(auth)
    }

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
