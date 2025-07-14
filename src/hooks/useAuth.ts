'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AuthUser extends User {
    isAdmin?: boolean
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Vérifier si l'utilisateur est admin
                try {
                    const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid))
                    const isAdmin = adminDoc.exists()

                    setUser({
                        ...firebaseUser,
                        isAdmin
                    })
                } catch (error) {
                    console.error('Erreur lors de la vérification admin:', error)
                    setUser(firebaseUser)
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password)
            return { success: true, user: result.user }
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur de connexion'
            }
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
            return { success: true }
        } catch (error: unknown) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur de déconnexion'
            }
        }
    }

    return {
        user,
        loading,
        login,
        logout,
        isAdmin: user?.isAdmin || false,
        isAuthenticated: !!user
    }
}
