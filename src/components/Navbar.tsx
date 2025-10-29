'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Trophy, Users, FileText, Search, Shield, UserPlus, Award, Clock, ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    name: string;
    href?: string;
    icon: LucideIcon;
    dropdown?: Array<{ name: string; href: string }>;
}

const navigation: NavItem[] = [
    { name: 'Accueil', href: '/', icon: Trophy },
    { 
        name: 'Règles', 
        icon: FileText,
        dropdown: [
            { name: 'Battle Royale', href: '/regles' },
            { name: 'Multijoueur', href: '/regles/mp' }
        ]
    },
    { 
        name: 'Équipes', 
        icon: Award,
        dropdown: [
            { name: 'Battle Royale', href: '/equipes-validees' },
            { name: 'Multijoueur', href: '/equipes-validees/mp' }
        ]
    },
    { name: 'Historique', href: '/historique', icon: Clock },
    { 
        name: 'Inscription', 
        icon: Users,
        dropdown: [
            { name: 'Battle Royale', href: '/inscription' },
            { name: 'Multijoueur', href: '/inscription/mp' }
        ]
    },
    { 
        name: 'Rejoindre', 
        icon: UserPlus,
        dropdown: [
            { name: 'Battle Royale', href: '/rejoindre' },
            { name: 'Multijoueur', href: '/rejoindre-mp' }
        ]
    },
    { 
        name: 'Classement', 
        icon: Trophy,
        dropdown: [
            { name: 'Battle Royale', href: '/classement-final' },
            { name: 'Multijoueur', href: '/classement-final/mp' }
        ]
    },
    { name: 'Suivi', href: '/suivi', icon: Search },
    { name: 'Admin', href: '/admin', icon: Shield },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    return (
        <nav className="bg-gray-800/90 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center flex-shrink-0">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-base md:text-lg lg:text-xl font-bold text-white whitespace-nowrap hidden sm:block">
                                Espace Gaming CODM
                            </span>
                            <span className="text-base font-bold text-white whitespace-nowrap sm:hidden">
                                EG CODM
                            </span>
                        </Link>
                    </div>

                    {/* Navigation desktop */}
                    <div className="hidden lg:flex items-center space-x-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href ? pathname === item.href : false;
                            const hasDropdown = item.dropdown && item.dropdown.length > 0;

                            if (hasDropdown) {
                                return (
                                    <div 
                                        key={item.name} 
                                        className="relative flex-shrink-0"
                                        onMouseEnter={() => setOpenDropdown(item.name)}
                                        onMouseLeave={() => setOpenDropdown(null)}
                                    >
                                        <button
                                            title={item.name}
                                            className={cn(
                                                "flex items-center space-x-1.5 px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                                "text-gray-300 hover:text-white hover:bg-gray-700"
                                            )}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="hidden xl:inline">{item.name}</span>
                                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </button>
                                        
                                        {openDropdown === item.name && item.dropdown && (
                                            <div className="absolute top-full right-0 xl:left-0 xl:right-auto mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
                                                {item.dropdown.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                                    >
                                                        {subItem.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href!}
                                    title={item.name}
                                    className={cn(
                                        "flex items-center space-x-1.5 px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    )}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    <span className="hidden xl:inline">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Navigation tablette (icônes seulement) */}
                    <div className="hidden md:flex lg:hidden items-center space-x-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href ? pathname === item.href : false;
                            const hasDropdown = item.dropdown && item.dropdown.length > 0;

                            if (hasDropdown) {
                                return (
                                    <div 
                                        key={item.name} 
                                        className="relative flex-shrink-0"
                                        onMouseEnter={() => setOpenDropdown(item.name)}
                                        onMouseLeave={() => setOpenDropdown(null)}
                                    >
                                        <button
                                            title={item.name}
                                            className="flex items-center justify-center p-2 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700"
                                        >
                                            <Icon className="w-5 h-5" />
                                        </button>
                                        
                                        {openDropdown === item.name && item.dropdown && (
                                            <div className="absolute top-full right-0 mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
                                                {item.dropdown.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                                    >
                                                        {subItem.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href!}
                                    title={item.name}
                                    className={cn(
                                        "flex items-center justify-center p-2 rounded-lg transition-all duration-200 flex-shrink-0",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Menu burger mobile */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
                            aria-label="Menu de navigation"
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
                                const isActive = item.href ? pathname === item.href : false;
                                const hasDropdown = item.dropdown && item.dropdown.length > 0;

                                if (hasDropdown) {
                                    return (
                                        <div key={item.name}>
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Icon className="w-5 h-5" />
                                                    <span>{item.name}</span>
                                                </div>
                                                <ChevronDown className={cn(
                                                    "w-4 h-4 transition-transform",
                                                    openDropdown === item.name && "rotate-180"
                                                )} />
                                            </button>
                                            {openDropdown === item.name && item.dropdown && (
                                                <div className="ml-8 mt-1 space-y-1">
                                                    {item.dropdown.map((subItem) => (
                                                        <Link
                                                            key={subItem.href}
                                                            href={subItem.href}
                                                            onClick={() => setIsOpen(false)}
                                                            className="block px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                                        >
                                                            {subItem.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href!}
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
