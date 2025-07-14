'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell, BellOff, X } from 'lucide-react'
import toast from 'react-hot-toast'

function NotificationPermissionComponent() {
    const { permission, supported, requestPermission, setupMessageListener } = useNotifications()
    const [showPrompt, setShowPrompt] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // Afficher le prompt si les notifications sont supportées et pas encore autorisées
        if (mounted && supported && permission === 'default' && !dismissed) {
            setShowPrompt(true)
        }
    }, [mounted, supported, permission, dismissed])

    useEffect(() => {
        // Configurer le listener pour les messages en premier plan
        if (mounted && permission === 'granted') {
            const unsubscribe = setupMessageListener((payload) => {
                // Afficher une notification toast pour les messages reçus
                if (payload.notification) {
                    toast.success(
                        `${payload.notification.title}: ${payload.notification.body}`,
                        { duration: 5000 }
                    )
                }
            })

            return unsubscribe
        }
    }, [mounted, permission, setupMessageListener])

    const handleRequestPermission = async () => {
        const granted = await requestPermission()
        if (granted) {
            toast.success('Notifications activées ! Vous recevrez les mises à jour du tournoi.')
            setShowPrompt(false)
        } else {
            toast.error('Permission refusée. Vous pouvez l\'activer dans les paramètres du navigateur.')
        }
    }

    const handleDismiss = () => {
        setDismissed(true)
        setShowPrompt(false)
    }

    if (!mounted || !supported || !showPrompt) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                        Notifications du tournoi
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Recevez les mises à jour importantes sur le statut de votre équipe et les annonces du tournoi.
                    </p>
                    <div className="mt-3 flex space-x-2">
                        <button
                            onClick={handleRequestPermission}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Bell className="h-3 w-3 mr-1" />
                            Activer
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            <BellOff className="h-3 w-3 mr-1" />
                            Plus tard
                        </button>
                    </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                    <button
                        onClick={handleDismiss}
                        className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Fermer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// Export avec dynamic import pour éviter les problèmes SSR
const NotificationPermission = dynamic(() => Promise.resolve(NotificationPermissionComponent), {
    ssr: false
})

export default NotificationPermission
