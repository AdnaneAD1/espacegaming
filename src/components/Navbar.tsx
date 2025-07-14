'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Trophy, Users, FileText, Search, Shield, UserPlus, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Accueil', href: '/', icon: Trophy },
    { name: 'Règles', href: '/regles', icon: FileText },
    { name: 'Équipes', href: '/equipes-validees', icon: Award },
    { name: 'Inscription', href: '/inscription', icon: Users },
    { name: 'Rejoindre', href: '/rejoindre', icon: UserPlus },
    { name: 'Suivi', href: '/suivi', icon: Search },
    { name: 'Admin', href: '/admin', icon: Shield },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Espace Gaming CODM
                            </span>
                        </Link>
                    </div>

                    {/* Navigation desktop */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Menu burger mobile */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-white p-2"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Navigation mobile */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-800 rounded-lg mt-2 border border-gray-700">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-all duration-200",
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-300 hover:text-white hover:bg-gray-700"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
