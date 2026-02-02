import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const ThemeSwitcher: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'system';
        }
        return 'system';
    });

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (targetTheme: Theme) => {
            if (targetTheme === 'dark') {
                root.classList.add('dark');
            } else if (targetTheme === 'light') {
                root.classList.remove('dark');
            } else {
                // System
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme(theme);

        const handleSystemChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        systemTheme.addEventListener('change', handleSystemChange);
        localStorage.setItem('theme', theme);

        return () => systemTheme.removeEventListener('change', handleSystemChange);
    }, [theme]);

    const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
        {
            value: 'light',
            label: 'Light',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            value: 'dark',
            label: 'Dark',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )
        },
        {
            value: 'system',
            label: 'System',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
    ];

    const currentTheme = themes.find(t => t.value === theme) || themes[2];

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <div className="relative">
                {isOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-32 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden transform origin-bottom-left transition-all">
                        {themes.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    setTheme(t.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${theme === t.value ? 'text-brand-blue-light bg-gray-700/50' : 'text-gray-300'}`}
                            >
                                <span className="mr-2">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-center w-10 h-10 bg-gray-800 rounded-full border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-light/50"
                    title="Change Theme"
                >
                    {currentTheme.icon}
                </button>
            </div>
        </div>
    );
};
