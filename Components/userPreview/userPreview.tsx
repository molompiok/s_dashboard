// components/UserPreview/UserPreview.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';
import { Mail, Phone } from 'lucide-react';
import { UserInterface } from '../../api/Interfaces/Interfaces';
import { getMedia } from '../Utils/StringFormater';
import { ClientStatusColor } from '../Utils/constants';

interface UserPreviewProps {
    user: Partial<UserInterface>;
}

export const UserPreview: React.FC<UserPreviewProps> = ({ user }) => {
    const { t, i18n } = useTranslation();

    // Couleur du statut client, avec un fallback
    const statusColor = (ClientStatusColor as any)[user.status || 'CLIENT'] ?? '#6B7280';

    return (
        // Carte principale avec effet verre dépoli et bordures douces
        <div className="user-card flex flex-col md:flex-row items-center md:items-start gap-6 p-4 sm:p-6 
                       bg-white/80 dark:bg-white/5 backdrop-blur-md 
                       rounded-xl shadow-sm border border-gray-200/80 dark:border-white/10">
            
            {/* Colonne Avatar */}
            <div className="relative flex-shrink-0">
                <div
                    className="w-24 h-24 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-4xl 
                               rounded-full object-cover border-4 border-white/80 dark:border-gray-800/50 
                               shadow-md bg-gray-200 dark:bg-gray-700"
                    style={{ background: getMedia({ isBackground: true, source: user.photo?.[0], from: 'api' }) }}
                >
                    {/* Affiche les initiales si pas de photo */}
                    {!user.photo?.[0] && (user.full_name?.substring(0, 2).toUpperCase() || '?')}
                </div>

                {/* Badge de statut */}
                <span
                    className="absolute bottom-1 right-1 block h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800/50"
                    style={{ backgroundColor: statusColor }}
                    title={t(`clientStatus.${user.status?.toLowerCase() || 'client'}`, user.status||'CLIENT')}
                ></span>
            </div>

            {/* Colonne Informations */}
            <div className="user-info flex flex-col gap-2 flex-grow min-w-0 text-center md:text-left">
                {/* Nom */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate" title={user.full_name}>
                    {user.full_name || t('common.anonymous')}
                </h2>

                {/* Email */}
                {user.email && (
                    <a 
                        href={`mailto:${user.email}`} 
                        className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400 
                                   hover:text-teal-600 dark:hover:text-teal-400 w-fit mx-auto md:mx-0 transition-colors"
                    >
                        <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="truncate">{user.email}</span>
                    </a>
                )}
                
                {/* Pied de carte avec Statut et date d'inscription */}
                <div className="user-card-foot flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <p>
                        <span>{t('clientDetail.statusLabel')}:</span> 
                        <strong 
                            className='ml-1 px-2 py-0.5 rounded-full text-xs font-medium' 
                            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                        >
                            {t(`clientStatus.${user.status?.toLowerCase() || 'client'}`, user.status||'CLIENT')}
                        </strong>
                    </p>
                    {user.created_at && (
                        <p>
                            <span>{t('clientDetail.memberSinceLabel')}:</span> 
                            <strong className="ml-1 text-gray-600 dark:text-gray-300">
                                {DateTime.fromISO(user.created_at as string || '').setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}
                            </strong>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPreview;