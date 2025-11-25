import { useState, useEffect, useRef, useCallback } from 'react';
import { IoStatsChart, IoBook, IoMegaphone } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

// Types
type TabType = 'stat' | 'tuto' | 'pub';

interface TabConfig {
    id: TabType;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    duration: number; // Durée d'affichage en secondes
}

interface StatCarouselProps {
    statContent: React.ReactNode;
    tutoContent?: React.ReactNode;
    pubContent?: React.ReactNode;
}

const TABS: TabConfig[] = [
    { id: 'stat', icon: IoStatsChart, label: 'Statistiques', duration: 2 },
    { id: 'tuto', icon: IoBook, label: 'Tutoriels', duration: 2 },
    { id: 'pub', icon: IoMegaphone, label: 'Publicités', duration: 2 },
];

const PAUSE_DURATION = 2 * 60 * 1000; // 2 minutes en millisecondes
const SELECTED_TAB_STORAGE_KEY = 'stat-carousel-selected-tab';
const SELECTED_TAB_TIMESTAMP_KEY = 'stat-carousel-selected-timestamp';

export function StatCarousel({ statContent, tutoContent, pubContent }: StatCarouselProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('stat');
    const [progress, setProgress] = useState(0); // Progression de 0 à 100
    const [startTime, setStartTime] = useState(Date.now());
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedTab, setSelectedTab] = useState<TabType | null>(() => {
        // Charger la sélection depuis localStorage au montage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(SELECTED_TAB_STORAGE_KEY);
            const timestamp = localStorage.getItem(SELECTED_TAB_TIMESTAMP_KEY);
            if (saved && timestamp) {
                const elapsed = Date.now() - parseInt(timestamp, 10);
                // Si moins de 2 minutes se sont écoulées, restaurer la sélection
                if (elapsed < PAUSE_DURATION && (saved === 'stat' || saved === 'tuto' || saved === 'pub')) {
                    return saved as TabType;
                } else {
                    // Nettoyer si la pause est expirée
                    localStorage.removeItem(SELECTED_TAB_STORAGE_KEY);
                    localStorage.removeItem(SELECTED_TAB_TIMESTAMP_KEY);
                }
            }
        }
        return null;
    });
    const [isPaused, setIsPaused] = useState(false);
    const [pauseUntil, setPauseUntil] = useState<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Contenu par défaut pour tuto - Même structure que stat pour éviter les sursauts
    const defaultTutoContent = (
        <div className="w-full grid grid-cols-1 dark:text-gray-200 min-[420px]:grid-cols-2 gap-5 p-2 bg-gradient-to-br from-gray-50 to-slate-200/25 dark:from-slate-900/20 dark:to-slate-800/20 rounded-2xl h-full">
            {/* Card principale tutoriel - Même taille que Account Total */}
            <div className="relative bg-white/95 dark:bg-white/5 shadow-md rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg min-[420px]:col-span-2 border border-transparent dark:border-white/10 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <IoBook className="w-6 h-6" />
                    </div>
                    <h3 className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
                        Guide de démarrage rapide
                    </h3>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-gray-200">Créez votre premier produit</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Ajoutez des images, définissez le prix et publiez votre produit en quelques clics.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">2</span>
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-gray-200">Organisez vos catégories</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Structurez votre boutique pour faciliter la navigation de vos clients.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">3</span>
                        <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-gray-200">Personnalisez votre thème</p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Adaptez les couleurs et le style à votre marque.</p>
                        </div>
                    </div>
                </div>
                <a
                    href="#"
                    className="mt-auto pt-3 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline transition-colors duration-150"
                >
                    Voir tous les tutoriels →
                </a>
            </div>

            {/* Cards secondaires - Même hauteur que les StatCards */}
            <div className="bg-white/95 dark:bg-white/5 shadow-md dark:shadow-none rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-xl border border-transparent dark:border-white/10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-lg">💡</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Astuce du jour</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-400 flex-1">
                    Utilisez des images de qualité pour augmenter vos ventes de 30%.
                </p>
            </div>

            <div className="bg-white/95 dark:bg-white/5 shadow-md dark:shadow-none rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-xl border border-transparent dark:border-white/10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 text-lg">⚡</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Raccourci clavier</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-400 flex-1">
                    Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+K</kbd> pour rechercher rapidement.
                </p>
            </div>
        </div>
    );

    // Contenu par défaut pour pub - Même structure que stat pour éviter les sursauts
    const defaultPubContent = (
        <div className="w-full grid grid-cols-1 dark:text-gray-200 min-[420px]:grid-cols-2 gap-5 p-2 bg-gradient-to-br from-gray-50 to-slate-200/25 dark:from-slate-900/20 dark:to-slate-800/20 rounded-2xl h-full">
            {/* Card principale promotion - Même taille que Account Total */}
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 shadow-md rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg min-[420px]:col-span-2 border border-transparent dark:border-white/10 text-white flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                            <IoMegaphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-semibold">Pass Premium</h3>
                            <p className="text-white/80 text-xs">Débloquez toutes les fonctionnalités</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">-30%</span>
                </div>
                <div className="flex-1 space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/90">✓</span>
                        <span className="text-white/90">Domaine personnalisé inclus</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/90">✓</span>
                        <span className="text-white/90">Support prioritaire 24/7</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/90">✓</span>
                        <span className="text-white/90">Analytics avancés</span>
                    </div>
                </div>
                <button className="w-full py-2.5 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors duration-150">
                    Découvrir Premium
                </button>
            </div>

            {/* Cards secondaires - Même hauteur que les StatCards */}
            <div className="bg-white/95 dark:bg-white/5 shadow-md dark:shadow-none rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-xl border border-transparent dark:border-white/10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <span className="text-yellow-600 dark:text-yellow-400 text-lg">🎁</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Offre spéciale</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-400 flex-1 mb-2">
                    Invitez 3 amis et obtenez 1 mois gratuit.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-auto">
                    En savoir plus →
                </button>
            </div>

            <div className="bg-white/95 dark:bg-white/5 shadow-md dark:shadow-none rounded-xl p-5 transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-xl border border-transparent dark:border-white/10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 text-lg">🚀</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Nouveautés</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-400 flex-1 mb-2">
                    Découvrez les dernières fonctionnalités ajoutées cette semaine.
                </p>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-auto">
                    Voir les nouveautés →
                </button>
            </div>
        </div>
    );

    // Contenu par onglet
    const tabContent: Record<TabType, React.ReactNode> = {
        stat: statContent,
        tuto: tutoContent || defaultTutoContent,
        pub: pubContent || defaultPubContent,
    };

    // Fonction pour passer à l'onglet suivant
    const goToNextTab = useCallback(() => {
        setActiveTab((current) => {
            const currentIndex = TABS.findIndex(t => t.id === current);
            const nextIndex = (currentIndex + 1) % TABS.length;
            return TABS[nextIndex].id;
        });
    }, []);

    // Fonction pour démarrer le défilement automatique avec la durée spécifique de l'onglet actif
    const startAutoScroll = useCallback((tabId: TabType) => {
        // Nettoyer le timeout existant
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Nettoyer l'intervalle de progression existant
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        // Réinitialiser la progression
        const now = Date.now();
        setProgress(0);
        setStartTime(now);

        // Obtenir la durée de l'onglet spécifié
        const currentTabConfig = TABS.find(t => t.id === tabId);
        const duration = (currentTabConfig?.duration || 2) * 1000;

        // Mettre à jour la progression toutes les 50ms pour une animation fluide
        progressIntervalRef.current = setInterval(() => {
            if (!isPaused) {
                const elapsed = Date.now() - now;
                const newProgress = Math.min((elapsed / duration) * 100, 100);
                setProgress(newProgress);
            }
        }, 50);

        // Programmer le passage à l'onglet suivant
        timeoutRef.current = setTimeout(() => {
            if (!isPaused) {
                setProgress(100);
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                    progressIntervalRef.current = null;
                }
                goToNextTab();
            }
        }, duration);
    }, [isPaused, goToNextTab]);

    // Fonction pour arrêter le défilement pendant 2 minutes
    const pauseAutoScroll = useCallback((tabId: TabType) => {
        setIsPaused(true);
        const resumeTime = Date.now() + PAUSE_DURATION;
        setPauseUntil(resumeTime);

        // Sauvegarder dans localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(SELECTED_TAB_STORAGE_KEY, tabId);
            localStorage.setItem(SELECTED_TAB_TIMESTAMP_KEY, Date.now().toString());
        }

        // Nettoyer le timeout de défilement actif
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Nettoyer le timeout de pause existant
        if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
        }

        // Programmer la reprise après 2 minutes
        pauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
            setPauseUntil(null);
            setSelectedTab(null);
            // Nettoyer localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem(SELECTED_TAB_STORAGE_KEY);
                localStorage.removeItem(SELECTED_TAB_TIMESTAMP_KEY);
            }
            // Reprendre le défilement avec l'onglet actuel
            startAutoScroll(activeTab);
        }, PAUSE_DURATION);
    }, [activeTab, startAutoScroll]);

    // Fonction pour reprendre le défilement
    const resumeAutoScroll = useCallback(() => {
        setIsPaused(false);
        setPauseUntil(null);
        setSelectedTab(null);

        // Nettoyer localStorage
        if (typeof window !== 'undefined') {
            localStorage.removeItem(SELECTED_TAB_STORAGE_KEY);
            localStorage.removeItem(SELECTED_TAB_TIMESTAMP_KEY);
        }

        // Nettoyer le timeout de pause
        if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current);
            pauseTimeoutRef.current = null;
        }

        // Reprendre le défilement
        startAutoScroll(activeTab);
    }, [activeTab, startAutoScroll]);

    // Gestion du clic sur un onglet
    const handleTabClick = useCallback((tabId: TabType) => {
        // Nettoyer l'intervalle de progression
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }

        // Si l'onglet est déjà sélectionné, désélectionner
        if (selectedTab === tabId) {
            resumeAutoScroll();
            return;
        }

        // Sinon, sélectionner cet onglet et arrêter le défilement
        setActiveTab(tabId);
        setSelectedTab(tabId);
        setProgress(0); // Réinitialiser la progression
        pauseAutoScroll(tabId);
    }, [selectedTab, pauseAutoScroll, resumeAutoScroll]);

    // Initialiser le défilement automatique quand l'onglet change ou quand la pause se termine
    useEffect(() => {
        // Si un onglet est sélectionné, ne pas démarrer le défilement
        if (!isPaused && !selectedTab) {
            startAutoScroll(activeTab);
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (pauseTimeoutRef.current) {
                clearTimeout(pauseTimeoutRef.current);
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [activeTab, isPaused, selectedTab, startAutoScroll]);

    // Vérifier si une sélection existe au montage et restaurer l'état de pause
    useEffect(() => {
        if (selectedTab && typeof window !== 'undefined') {
            const timestamp = localStorage.getItem(SELECTED_TAB_TIMESTAMP_KEY);
            if (timestamp) {
                const elapsed = Date.now() - parseInt(timestamp, 10);
                const remaining = PAUSE_DURATION - elapsed;
                if (remaining > 0) {
                    setIsPaused(true);
                    setPauseUntil(Date.now() + remaining);
                    setActiveTab(selectedTab);
                    // Nettoyer le timeout existant
                    if (pauseTimeoutRef.current) {
                        clearTimeout(pauseTimeoutRef.current);
                    }
                    // Programmer la reprise après le temps restant
                    pauseTimeoutRef.current = setTimeout(() => {
                        setIsPaused(false);
                        setPauseUntil(null);
                        setSelectedTab(null);
                        localStorage.removeItem(SELECTED_TAB_STORAGE_KEY);
                        localStorage.removeItem(SELECTED_TAB_TIMESTAMP_KEY);
                        startAutoScroll(selectedTab);
                    }, remaining);
                } else {
                    // La pause est expirée, nettoyer
                    setSelectedTab(null);
                    setIsPaused(false);
                    localStorage.removeItem(SELECTED_TAB_STORAGE_KEY);
                    localStorage.removeItem(SELECTED_TAB_TIMESTAMP_KEY);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Seulement au montage

    // Reprendre le défilement si la pause est terminée
    useEffect(() => {
        if (pauseUntil && Date.now() >= pauseUntil) {
            setIsPaused(false);
            setPauseUntil(null);
        }
    }, [pauseUntil]);

    return (
        <div className="relative w-full flex gap-4">
            {/* Container de la card complète (à gauche) - Hauteur fixe pour éviter les sursauts */}
            <div className="flex-1 min-w-0">
                <div className="transition-all duration-300 ease-in-out min-h-[400px]">
                    {tabContent[activeTab]}
                </div>
            </div>

            {/* Container des onglets (à droite, w=40px) */}
            <div className="w-10 flex flex-col items-center justify-center gap-4">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isSelected = selectedTab === tab.id;
                    const currentProgress = isActive && !isPaused ? progress : 0;
                    
                    // Calculer le stroke-dasharray pour le cercle de progression
                    const radius = 18; // Rayon du cercle (légèrement plus grand que l'icône)
                    const circumference = 2 * Math.PI * radius;
                    const strokeDasharray = circumference;
                    const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

                    return (
                        <div key={tab.id} className="relative w-12 h-12 flex items-center justify-center">
                            {/* Cercle de progression */}
                            <svg
                                className="absolute inset-0 w-full h-full transform -rotate-90"
                                viewBox="0 0 44 44"
                            >
                                {/* Cercle de fond (gris clair) */}
                                <circle
                                    cx="22"
                                    cy="22"
                                    r={radius}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-gray-300 dark:text-gray-600"
                                />
                                {/* Cercle de progression (bleu) */}
                                {isActive && !isPaused && (
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r={radius}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="text-blue-600 dark:text-blue-400 transition-all duration-50 ease-linear"
                                    />
                                )}
                            </svg>
                            {/* Bouton avec icône */}
                            <button
                                onClick={() => handleTabClick(tab.id)}
                                className={`
                                    w-10 h-10 flex items-center justify-center rounded-lg
                                    transition-all duration-200 ease-in-out
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                    cursor-pointer relative z-10
                                    ${isSelected || isActive
                                        ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }
                                `}
                                aria-label={tab.label}
                                title={isSelected ? `${tab.label} (Sélectionné - Défilement arrêté)` : tab.label}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

