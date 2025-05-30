// Components/Settings/SubscriptionPlanSection.tsx

import { useState, useEffect } from 'react';
import { StoreInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import logger from '../../api/Logger';
import { DateTime } from 'luxon'; // Pour formater et comparer la date d'expiration
import { IoAlertCircleOutline, IoCheckmarkCircleOutline, IoInformationCircleOutline, IoRocketOutline, IoTimeOutline } from "react-icons/io5";

interface SubscriptionPlanSectionProps {
    store: StoreInterface;
}

// Structure possible pour les détails du plan (pourrait venir de l'API ou être définie statiquement)
interface PlanDetails {
    name: string;
    productLimit: number | 'unlimited';
    storageLimitGb: number | 'unlimited';
    collaboratorLimit: number | 'unlimited';
    // Ajouter d'autres caractéristiques du plan
}

// Exemple de plans (à remplacer par des données réelles ou un appel API)
const PLAN_DETAILS_MAP: Record<string, PlanDetails> = {
    'free': { name: 'Gratuit', productLimit: 50, storageLimitGb: 1, collaboratorLimit: 1 },
    'basic': { name: 'Basique', productLimit: 200, storageLimitGb: 5, collaboratorLimit: 3 },
    'pro': { name: 'Pro', productLimit: 'unlimited', storageLimitGb: 20, collaboratorLimit: 10 },
};

export function SubscriptionPlanSection({ store }: SubscriptionPlanSectionProps) {
    const { t } = useTranslation();

    // --- Déterminer les détails du plan ---
    // TODO: Obtenir le nom/type du plan actuel du store depuis l'API (ex: store.plan_type)
    const currentPlanType = 'basic'; // Placeholder
    const planDetails = PLAN_DETAILS_MAP[currentPlanType] ?? PLAN_DETAILS_MAP['free']; // Fallback sur free

    // --- Gérer la date d'expiration ---
    const expirationDate = store.expire_at ? DateTime.fromISO(store.expire_at) : null;
    const now = DateTime.now();
    const isExpired = expirationDate ? expirationDate < now : false;
    const daysRemaining = expirationDate ? Math.ceil(expirationDate.diff(now, 'days').days) : null;
    const isNearExpiration = daysRemaining !== null && daysRemaining <= 7; // Expire dans 7 jours ou moins

    // --- Handlers ---
    const handleChangePlan = () => {
        logger.info(`Change plan clicked for store ${store.id}`);
        // TODO: Rediriger vers la page de gestion des abonnements/paiements
        alert(t('subscriptionPlan.changePlanAction')); // Placeholder alert
    };

    return (
        // Conteneur Section
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* En-tête */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('settingsPage.sidebar.plan')}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('subscriptionPlan.description')}</p>
            </div>

            {/* Contenu */}
            <div className="px-4 py-5 sm:p-6 space-y-6">

                {/* Alertes Expiration / Statut */}
                {isExpired && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-3">
                        <IoAlertCircleOutline className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-red-800">{t('subscriptionPlan.statusExpired')}</h4>
                            <p className="text-xs text-red-700 mt-1">{t('subscriptionPlan.expiredMessage')}</p>
                        </div>
                    </div>
                )}
                {isNearExpiration && !isExpired && (
                    <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 flex items-start gap-3">
                        <IoTimeOutline className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-yellow-800">{t('subscriptionPlan.statusExpiresSoon', { days: daysRemaining })}</h4>
                            <p className="text-xs text-yellow-700 mt-1">{t('subscriptionPlan.expiresSoonMessage')}</p>
                        </div>
                    </div>
                )}

                {/* Nom du Plan Actuel */}
                <div className='flex items-center justify-between'>
                    <span className="text-base font-semibold text-gray-800">{t('subscriptionPlan.currentPlanLabel')}: <span className='text-blue-600'>{planDetails.name}</span></span>
                    <button
                        onClick={handleChangePlan}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {isExpired ? t('subscriptionPlan.renewButton') : t('subscriptionPlan.changeButton')}
                    </button>
                </div>

                {/* Date d'expiration */}
                {expirationDate && (
                    <div className='text-sm text-gray-600'>
                        {t('subscriptionPlan.expiresOnLabel')}: <span className={`font-medium ${isExpired ? 'text-red-600' : (isNearExpiration ? 'text-yellow-700' : 'text-gray-800')}`}>{expirationDate.setLocale(t('common.locale')).toLocaleString(DateTime.DATE_FULL)}</span>
                    </div>
                )}

                {/* Détails des Limites du Plan */}
                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{t('subscriptionPlan.planLimitsTitle')}</h4>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-gray-700">
                            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{t('subscriptionPlan.limitItem', { limit: planDetails.productLimit, item: t('dashboard.products') })}</span>
                        </li>
                        <li className="flex items-center gap-2 text-gray-700">
                            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{t('subscriptionPlan.limitItem', { limit: planDetails.storageLimitGb, item: t('storesPage.limits.disk') + ' (Gb)' })}</span>
                        </li>
                        <li className="flex items-center gap-2 text-gray-700">
                            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{t('subscriptionPlan.limitItem', { limit: planDetails.collaboratorLimit, item: t('storesPage.limits.collaborators') })}</span>
                        </li>
                        {/* Ajouter d'autres limites ici */}
                    </ul>
                </div>

            </div>
            {/* Pas de bouton Enregistrer ici, la gestion se fait ailleurs */}
        </div>
    );
}

// --- Note sur le formatage i18next pour "unlimited" ---
// Pour gérer l'affichage "Illimité", vous pouvez utiliser la fonctionnalité de contexte ou de pluriels d'i18next.
// Exemple simple avec contexte (nécessite adaptation dans t()):
// t('subscriptionPlan.limitItem', { context: limit === 'unlimited' ? 'unlimited' : '', limit: limit, item: ... })
// Et dans le JSON:
// "limitItem": "{{item}} : {{limit, number}}",
// "limitItem_unlimited": "{{item}} : Illimité",
// Ou utiliser une condition dans le JSX:
// {planDetails.productLimit === 'unlimited' ? t('subscriptionPlan.limitItem_unlimited', { item: ... }) : t('subscriptionPlan.limitItem', { limit: planDetails.productLimit, item: ... })}