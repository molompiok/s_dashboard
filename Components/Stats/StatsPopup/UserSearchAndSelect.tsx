// components/Stats/Modals/UserSearchAndSelect.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useGetUsers } from '../../../api/ReactSublymusApi'; // Ajustez le chemin selon votre structure
import { UserInterface, UserFilterType } from '../../../Interfaces/Interfaces'; // Ajustez le chemin
import { ClientItem } from '../../ClientList/ClientList'; // Ajustez le chemin vers votre composant ClientItem
import { ClientItemSkeleton } from './ClientItemSkeleton'; // Utilise le squelette créé ci-dessus
import { debounce } from '../../Utils/functions'; // Ajustez le chemin vers votre utilitaire debounce
import { useTranslation } from 'react-i18next'; // i18n

interface UserSearchAndSelectProps {
    // Callback appelé quand un client est sélectionné
    onClientSelected: (client: UserInterface | undefined) => void;
    // Callback appelé quand le modal doit être fermé (par le composant lui-même ou le parent)
    onClose: () => void;
    // ID du client actuellement sélectionné (pour éventuellement le surligner dans la liste)
    currentSelectedUserId?: string;
}

const UserSearchAndSelect: React.FC<UserSearchAndSelectProps> = ({
    onClientSelected,
    onClose,
    currentSelectedUserId,
}) => {
    const { t } = useTranslation();

    // État local pour le texte entré par l'utilisateur
    const [searchTerm, setSearchTerm] = useState('');
    // État pour le terme de recherche après debounce, utilisé dans l'API
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Appliquer le debounce au terme de recherche
    useEffect(() => {
        searchTerm && debounce(()=>{
            setDebouncedSearchTerm(searchTerm)
        }, 'user-search', 400); // 400ms debounce
    }, [searchTerm]); // Only re-run if searchTerm changes

    // Construire le filtre pour l'API useGetUsers
    // Ne pas lancer la requête si le terme est vide au début?
    // Lançons-la pour pouvoir afficher tous les clients initiaux ou un message d'invitation
    // ou mieux : conditionner enabled au fait que debouncedSearchTerm > 0
     const filter: UserFilterType = useMemo(() => ({
         search: debouncedSearchTerm,
         with_client_role: true, // IMPORTANT : Ne chercher que les utilisateurs ayant le rôle client
         limit: 15, // Limiter les résultats pour ne pas afficher une liste immense dans le modal
          // Ajoutez d'autres filtres si nécessaire (ex: only_active=true)
     }), [debouncedSearchTerm]); // Re-create filter object when debouncedSearchTerm changes

    // Appel API via React Query
    // La requête est lancée si `enabled` est vrai ET que `debouncedSearchTerm` a une valeur (si conditionné)
     const { data: usersData, isLoading, isError, error: apiError } = useGetUsers(
         filter,
         { enabled: true } // Enable always, API will handle empty search or limited results
     );

     const users = usersData?.list ?? []; // Liste des utilisateurs trouvés

    // Handler quand un utilisateur est cliqué dans la liste
     const handleUserClick = (user: UserInterface) => {
         onClientSelected(user); // Appeler la callback du parent avec l'utilisateur sélectionné
         // onClose(); // Appeler la callback pour fermer le modal (déjà fait dans onClientSelected handler logic)
     };

     // Indicateur d'absence de résultats (quand la recherche n'est pas en cours)
     const noResults = !isLoading && !isError && users.length === 0 && debouncedSearchTerm.length > 0;
      // Indicateur pour afficher une invitation à rechercher
     const inviteToSearch = !isLoading && !isError && users.length === 0 && debouncedSearchTerm.length === 0;

    return (
        <div className="user-search-select flex flex-col h-full"> {/* Conteneur principal du modal */}
            {/* Champ de recherche */}
            <div className="relative w-full mb-4 flex-shrink-0"> {/* flex-shrink-0 pour que la liste en dessous puisse scroller */}
                 <input
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t('stats.searchClientPlaceholder')} // 🌍 i18n
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Liste des résultats / États */}
             <div className="flex-grow overflow-y-auto border-t border-gray-200 pt-4"> {/* flex-grow pour prendre l'espace restant, overflow-y-auto pour le scroll, border-t/pt pour le style */}
                 {isLoading ? (
                     // Squelettes de chargement
                     <div className="flex flex-col gap-2"> {/* Espacement entre les squelettes */}
                        {Array.from({ length: filter.limit || 5 }).map((_, i) => <ClientItemSkeleton key={i} />)}
                    </div>
                 ) : isError ? (
                     // Message d'erreur
                     <div className="p-4 text-center text-red-500">
                        {t('error_occurred')} <span className='text-xs'>{apiError?.message}</span>
                    </div>
                 ) : noResults ? (
                     // Message "Aucun résultat" pour la recherche
                      <div className="p-10 text-center text-gray-500">
                           {t('stats.noClientFound')}
                       </div>
                  ) : inviteToSearch ? (
                       // Message "Inviter à rechercher" si champ vide et pas de résultats
                        <div className="p-10 text-center text-gray-500">
                           {t('stats.typeToSearchClient')} {/* "Commencez à taper pour chercher des clients" */}
                       </div>
                 ) : (
                     // Liste des utilisateurs trouvés
                      <div className="flex flex-col gap-2"> {/* Espacement entre les items client */}
                          {users.map(user => (
                              // L'item client doit être cliquable et potentiellement indiquer la sélection courante
                              <div
                                  key={user.id}
                                  onClick={() => handleUserClick(user)}
                                   className={`cursor-pointer rounded-lg transition duration-100
                                      ${currentSelectedUserId === user.id ? 'bg-blue-100/60 border-blue-200 shadow-sm border' : 'hover:bg-gray-50'}`} // Indique l'item sélectionné si applicable
                              >
                                  <ClientItem client={user} /> {/* Utilisez le composant ClientItem existant */}
                              </div>
                          ))}
                     </div>
                 )}
             </div>
             {/* Potentiellement pagination si la limite de résultats est basse */}
             {/* {usersData?.meta && usersData.meta.total > usersData.meta.per_page && (
                // Add pagination logic here, maybe simple "Load More" or full pagination
                <Pagination ... />
             )} */}
        </div>
    );
};

export default UserSearchAndSelect;