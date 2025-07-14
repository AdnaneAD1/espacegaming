'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
    const { user, loading, isAdmin } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/admin/login')
        }
    }, [user, loading, isAdmin, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="mt-2 text-gray-600">Vérification des permissions...</p>
                </div>
            </div>
        )
    }

    if (!user || !isAdmin) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h2>
                    <p className="text-gray-600">Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
