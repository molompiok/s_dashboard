// pages/users/+Page.tsx (Ou le nom correspondant)

import React, { useMemo } from 'react';
import { FiUsers, FiBriefcase } from 'react-icons/fi'; // Importer les icônes spécifiques
import { Topbar } from '../../Components/TopBar/TopBar'; // Garder Topbar
// import { useApp } from '../../renderer/AppStore/UseApp'; // Remplacé par useGetStats
import { useGetCollaborators, useGetUserStats } from '../../api/ReactSublymusApi'; // ✅ Hook pour les stats
// import { useGlobalStore  } from '../stores/StoreStore'; // Gardé si besoin pour currentStore
import { useGetUsers } from '../../api/ReactSublymusApi'; // ✅ Hook pour les users
import { UserInterface } from '../../api/Interfaces/Interfaces';
import { getMedia } from '../../Components/Utils/StringFormater';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { useGlobalStore } from '../../api/stores/StoreStore';
import { ClientList } from '../../Components/ClientList/ClientList';
import { CurrentUserCard } from '../../Components/userPreview/CurrentUserCard';
import { GetCollaboratorsResponse } from '../../api/SublymusApi';

// Interface simplifiée pour les cartes de stats (pour la clarté)
interface StatCardInfo {
  id: string;
  titleKey: string; // Clé i18n pour le titre
  count?: number;
  gradient: string; // Classes Tailwind pour le dégradé
  icon: React.ReactElement;
  details: { labelKey: string; value?: string | number }[]; // Clés i18n pour les labels
  link: string; // Lien du bouton "Voir tout"
}

export default function Page() {
  const { t } = useTranslation(); // ✅ i18n

  const { currentStore } = useGlobalStore(); // Utilisé par les hooks API via useApi()

  const { data: userStatsData, isLoading: clientsStatLoading, isError, error } = useGetUserStats({
    with_active_users: true,
    with_total_clients: true,
    with_online_clients: true,
    with_satisfied_clients: true,
  }, {
    enabled: !!currentStore
  });

  // Extraire les données de stats nécessaires (exemple)
  const userStats = useMemo(() => {
    // TODO: Mapper statsApiData aux valeurs attendues par les cartes (totalClients, activeUsers, etc.)
    // Pour l'instant, on utilise des placeholders ou les données brutes si possible
    return {
      totalClients: userStatsData?.stats?.totalClients || 0, // Exemple très simplifié
      ratedUsersCount: userStatsData?.stats?.ratedUsersCount || 0, // Placeholder
      activeUsers: userStatsData?.stats?.activeUsers || 0, // Placeholder
      onlineClients: userStatsData?.stats?.onlineClients || 0, // Placeholder
      averageSatisfaction: userStatsData?.stats?.averageSatisfaction || 0 // Placeholder
    };
  }, [userStatsData]);


  // ✅ Récupérer la liste des clients (première page)
  const { data: clientsData, isLoading: isLoadingClients } = useGetUsers(
    // { role: 'client', limit: 5}, // Fetch 5 clients pour la preview
    // { enabled: !!currentStore }
  );
  const clientPrev = clientsData?.list ?? [];

  const { data: collaboratorsData, isLoading: isLoadingCollabs } = useGetCollaborators(
    { limit: 5 },
    // { enabled: true } // Activé par défaut
  ); // Remplacé par hook
  const collaboratorPrev = collaboratorsData?.list ?? [];


  // Définition des cartes de stats (avec clés i18n)
  const statsCards: StatCardInfo[] = [
    {
      id: 'client',
      titleKey: 'usersPage.stats.clientsTitle',
      count: userStats?.totalClients,
      // Utiliser les classes de dégradé Tailwind
      gradient: 'dark:from-pink-900 from-pink-200 to-rose-300 dark:to-fuchsia-700',
      icon: <FiUsers />,
      details: [
        { labelKey: 'usersPage.stats.rated', value: userStats?.ratedUsersCount ?? 'N/A' },
        { labelKey: 'usersPage.stats.active', value: userStats?.activeUsers ?? 'N/A' },
        { labelKey: 'usersPage.stats.online', value: userStats?.onlineClients ?? 'N/A' },
        { labelKey: 'usersPage.stats.satisfaction', value: `${userStats?.averageSatisfaction ? (userStats.averageSatisfaction / 5 * 100).toFixed(0) + '%' : '--'}` },
      ],
      link: '/users/clients'
    },
    {
      id: 'collab',
      titleKey: 'usersPage.stats.collaboratorsTitle',
      count: collaboratorsData?.meta?.total ?? undefined, // Utiliser le total de la pagination
      gradient: 'from-slate-300 dark:from-slate-700 dark:to-sky-700 to-sky-300',
      icon: <FiBriefcase />,
      details: [
        // Remplacer par des stats réelles si disponibles
        { labelKey: 'usersPage.stats.onMission', value: 'N/A' },
        { labelKey: 'usersPage.stats.available', value: 'N/A' },
        { labelKey: 'usersPage.stats.projectsDone', value: 'N/A' },
        { labelKey: 'usersPage.stats.hoursWorked', value: 'N/A' },
      ],
      link: '/users/collaborators' // Lien vers la page collaborateurs
    },
    // Ajouter d'autres cartes si nécessaire
  ];

  const isLoading = isLoadingClients || isLoadingCollabs || clientsStatLoading;

 
return (
  // Utiliser flex flex-col avec mode sombre
  <div className="users-pages  pb-48 w-full flex flex-col min-h-screen ">
    <Topbar title={t('usersPage.title')} search={false} /> {/* Titre pour la page */}
    <main className="flex-grow p-4 md:p-6 lg:p-8"> {/* Ajouter padding */}
      <CurrentUserCard />
      
      {/* Cartes de Stats */}
      {/* Utiliser grid, gap, mb avec support mode sombre */}
      <div className="grid mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {isLoading && Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)}
        {!isLoading && statsCards.map((stat) => (
          <StatCard key={stat.id} stat={stat} clientPreviews={clientPrev} collabPreviews={collaboratorPrev} />
        ))}
      </div>

      {/* Autres Sections (Liste complète des clients/collaborateurs?) */}
      {/* Cette section pourrait être remplacée par une navigation vers les pages dédiées */}
      {/* Ou afficher une table/liste ici */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* Section avec fond adaptatif pour le mode sombre */}
        <div className="bg-white pb-8 dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          {/* Afficher la liste des clients ici? */}
          <ClientList initialClients={clientPrev} />
        </div>
        {/* Afficher la liste des collaborateurs ici? */}
      </div>
      
      {/* Afficher le planning / tâches si pertinent */}
      {/* ... */}
    </main>
  </div>
);
}

// --- Composant StatCard ---
interface StatCardProps {
  stat: StatCardInfo;
  clientPreviews: Partial<UserInterface>[];
  collabPreviews: Partial<UserInterface>[];
}function StatCard({ stat, clientPreviews, collabPreviews }: StatCardProps) {
  const { t } = useTranslation();
  // Choisir les bons avatars à afficher
  const usersToDisplay = stat.id === 'client' ? clientPreviews : (collabPreviews as GetCollaboratorsResponse['list']).map(u => u.user);

  return (
    // Utiliser p-5, rounded-2xl, shadow, text-gray-800, transition avec mode sombre
    <div className={`stat-card p-5 rounded-2xl shadow-md dark:shadow-gray-900/30 text-gray-800 dark:text-gray-100 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-gray-900/40 bg-gradient-to-br ${stat.gradient} dark:brightness-90 dark:bg-opacity-50`}>
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-4">
        {/* Icône */}
        {/* Utiliser text-3xl ou 4xl avec support mode sombre */}
        <div className="stat-icon text-4xl opacity-80 dark:opacity-90">{stat.icon}</div>
        {/* Titre et Compte */}
        <div className="stat-title-count flex-1 min-w-0">
          <h2 className="text-lg font-medium truncate text-gray-800 dark:text-gray-100">{t(stat.titleKey)}</h2>
          {stat.count !== undefined && (
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{stat.count}</p>
          )}
        </div>
      </div>
      
      {/* Avatars */}
      <div className="flex gap-1 mb-4 -space-x-2"> {/* Chevauchement des avatars */}
        {usersToDisplay.slice(0, 4).map((user, idx) => ( // Limiter à 4 avatars
          <div 
            key={idx} 
            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 bg-cover bg-center bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/20 dark:ring-gray-800/50"
            style={{ background: getMedia({ isBackground: true, source: user.photo?.[0], from: 'api' }) }}
            title={user.full_name}
          >
            {!user.photo?.[0] && user.full_name?.substring(0, 2).toUpperCase()}
          </div>
        ))}
        {usersToDisplay.length > 4 && (
          <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs font-bold ring-1 ring-white/20 dark:ring-gray-800/50">
            +{usersToDisplay.length - 4}
          </div>
        )}
      </div>
      
      {/* Détails */}
      {/* Utiliser grid grid-cols-2 gap-x-4 gap-y-2 mb-4 avec mode sombre */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
        {stat.details.map((detail, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-300">{t(detail.labelKey)}:</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">{detail.value ?? '-'}</span>
          </div>
        ))}
      </div>
      
      {/* Bouton Voir Tout */}
      <a 
        href={stat.link} 
        className="block w-full bg-white/40 hover:bg-white/60 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 text-center text-gray-700 dark:text-gray-200 font-medium py-1.5 px-3 rounded-full text-xs transition-all duration-200 backdrop-blur-sm border border-white/20 dark:border-gray-600/30"
      >
        {t('common.seeAll')}
      </a>
    </div>
  );
}
// --- Composant StatCardSkeleton ---
function StatCardSkeleton() {
  return (
    <div className="stat-card p-5 rounded-2xl shadow-md dark:shadow-gray-900/30 bg-gray-200 dark:bg-gray-800 animate-pulse transition-colors duration-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-300 dark:bg-gray-700"></div>
        <div className="flex-1">
          <div className="h-5 w-3/5 bg-gray-300 dark:bg-gray-700 rounded mb-1.5"></div>
          <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      
      <div className="flex gap-1 mb-4 -space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"></div>
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"></div>
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
        <div className="flex justify-between text-xs">
          <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between text-xs">
          <div className="h-3 w-14 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between text-xs">
          <div className="h-3 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between text-xs">
          <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-7 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      
      <div className="w-full h-7 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    </div>
  );
}