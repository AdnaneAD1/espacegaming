'use client'

import { useEffect, useState } from 'react'
import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from 'firebase/messaging'
import app from '@/lib/firebase'

export function useNotifications() {
    const [token, setToken] = useState<string | null>(null)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [supported, setSupported] = useState(false)

    useEffect(() => {
        // Vérifier si les notifications sont supportées
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
            setSupported(true)
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = async (): Promise<boolean> => {
        if (!supported) {
            console.log('Les notifications ne sont pas supportées')
            return false
        }

        try {
            const permission = await Notification.requestPermission()
            setPermission(permission)

            if (permission === 'granted') {
                await generateToken()
                return true
            }

            return false
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error)
            return false
        }
    }

    const generateToken = async (): Promise<string | null> => {
        if (!supported || permission !== 'granted') {
            return null
        }

        try {
            // Vérifier si les messaging sont supportés avant de continuer
            if (!(await isSupported())) {
                console.log('Firebase Messaging n\'est pas supporté')
                return null
            }

            const messaging = getMessaging(app)
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
            })

            if (currentToken) {
                setToken(currentToken)
                console.log('Token FCM généré:', currentToken)
                return currentToken
            } else {
                console.log('Aucun token de notification disponible')
                return null
            }
        } catch (error) {
            console.error('Erreur lors de la génération du token:', error)
            return null
        }
    }

    

const setupMessageListener = (callback: (payload: MessagePayload) => void) => {
        if (!supported) return () => { }

        try {
            const messaging = getMessaging(app)

            return onMessage(messaging, (payload) => {
                console.log('Message reçu en premier plan:', payload)
                callback(payload)
            })
        } catch (error) {
            console.error('Erreur lors de la configuration du listener:', error)
            return () => { }
        }
    }

    return {
        token,
        permission,
        supported,
        requestPermission,
        generateToken,
        setupMessageListener
    }
}
