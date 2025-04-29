// Components/Settings/SettingsSidebar.tsx

import { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { IoStorefrontOutline, IoBrushOutline, IoTicketOutline, IoGlobeOutline, IoNewspaperOutline, IoLanguageOutline, IoWarningOutline, IoStorefront, IoBrush, IoTicket, IoGlobe, IoNewspaper, IoLanguage, IoWarning } from "react-icons/io5"; // Choisir icônes pertinentes

type SettingsSection = 'general' | 'appearance' | 'plan' | 'domains' | 'legal' | 'regional' | 'danger';

interface SettingsSidebarProps {
    activeSection: SettingsSection;
    onSectionChange: (section: SettingsSection) => void;
}

// Définir les items de la sidebar
const sidebarItems: { key: SettingsSection; labelKey: string; icon: JSX.Element }[] = [
    { key: 'general',    labelKey: 'settingsPage.sidebar.general',    icon: <IoStorefront className='w-5 h-5' /> },
    { key: 'appearance', labelKey: 'settingsPage.sidebar.appearance', icon: <IoBrush className='w-5 h-5' /> },
    { key: 'plan',       labelKey: 'settingsPage.sidebar.plan',       icon: <IoTicket className='w-5 h-5' /> },
    { key: 'domains',    labelKey: 'settingsPage.sidebar.domains',    icon: <IoGlobe className='w-5 h-5' /> },
    { key: 'legal',      labelKey: 'settingsPage.sidebar.legal',      icon: <IoNewspaper className='w-5 h-5' /> },
    { key: 'regional',   labelKey: 'settingsPage.sidebar.regional',   icon: <IoLanguage className='w-5 h-5' /> },
    { key: 'danger',     labelKey: 'settingsPage.sidebar.danger',     icon: <IoWarning className='w-5 h-5' /> },
];


export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
    const { t } = useTranslation();

    return (
        // Utiliser sticky top pour la sidebar sur desktop
        <nav className="flex flex-col space-y-1 md:sticky md:top-20" aria-label="Paramètres"> {/* top-20 pour laisser espace Topbar */}
            {sidebarItems.map((item) => {
                const isActive = activeSection === item.key;
                return (
                    <button // Utiliser des boutons pour le clic
                        key={item.key}
                        onClick={() => onSectionChange(item.key)}
                         // Styles Tailwind pour les liens de sidebar
                         className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out w-full text-left ${
                             isActive
                                 ? 'bg-blue-100 text-blue-700' // Style actif
                                 : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Style inactif
                         }`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {item.icon}
                        </span>
                         <span className="truncate">{t(item.labelKey)}</span> 
                    </button>
                );
            })}
        </nav>
    );
}