// components/Stats/StatsFilters.tsx
import React, { useState, useMemo, useRef } from 'react';
import { DateTime } from 'luxon'; // Pour manipuler les dates
import { StatsPeriod, VisitStatsIncludeOptions, OrderStatsIncludeOptions } from '../../Interfaces/Interfaces'; // Ajustez le chemin
// Types pour les modales, potentiellement importés d'un fichier centralisé ou ici si local
import { useChildViewer } from '../ChildViewer/useChildViewer'; // Importez si ChildViewer est ici
import { ChildViewer } from '../ChildViewer/ChildViewer'; // Importez si ChildViewer est ici
// Importez les composants qui seront affichés dans les modals
import UserSearchAndSelect from './StatsPopup/UserSearchAndSelect'; // Créer ce composant
import ProductSearchAndSelect from './StatsPopup/ProductSearchAndSelect'; // Créer ce composant
import { IoCloseSharp, IoChevronUp, IoChevronDown } from 'react-icons/io5'; // Icônes
import { useTranslation } from 'react-i18next'; // Pour i18n

// Valeurs par défaut pour count (répliquer de StatsUtils ou utiliser une source partagée si possible)
const defaultCounts: Record<StatsPeriod, number> = {
    day: 7,
    week: 4,
    month: 3,
};

const VALID_STATS_PERIODS: StatsPeriod[] = ['day', 'week', 'month'];

// Labels d'affichage pour les options d'inclusion (Visites)
const visitIncludeLabels: Record<keyof VisitStatsIncludeOptions, string> = {
    browser: 'Navigateur',
    os: 'OS',
    device: 'Appareil',
    landing_page: 'Page URL', // UI label, will map to 'landing_page' data key in Sections
    referrer: 'Referrer',
};

// Labels d'affichage pour les options d'inclusion (Commandes)
const orderIncludeLabels: Record<keyof OrderStatsIncludeOptions, string> = {
    status: 'Statut',
    payment_status: 'Statut paiement',
    payment_method: 'Méthode paiement',
    with_delivery: 'Livraison',
};


interface StatsFiltersProps {
    period: StatsPeriod;
    setPeriod: (period: StatsPeriod) => void;
    count: number;
    setCount: (count: number) => void;
    customEndDate: string | undefined; // ISO string or undefined
    setCustomEndDate: (date: string | undefined) => void;
    userId: string | undefined; // The ID
    setUserId: (userId: string | undefined) => void;
    selectedUserName?: string; // The Name (for display in filter UI)
    productId: string | undefined; // The ID
    setProductId: (productId: string | undefined) => void;
    selectedProductName?: string; // The Name (for display)
    visitIncludes: VisitStatsIncludeOptions;
    setVisitIncludes: (includes: VisitStatsIncludeOptions) => void;
    orderIncludes: OrderStatsIncludeOptions;
    setOrderIncludes: (includes: OrderStatsIncludeOptions) => void;
     // Props pour le hook useGetUsers si needed for UserSearchAndSelect logic (pass via parent?)
    // usersList: UserForFilter[] | undefined; // Liste des utilisateurs pour le sélecteur

    // Ajoutez une prop callback pour fermer le modal si nécessaire après sélection
     // closeModalTrigger?: () => void; // Géré par useChildViewer().openChild(null)
}


const StatsFilters: React.FC<StatsFiltersProps> = ({
    period, setPeriod,
    count, setCount,
    customEndDate, setCustomEndDate,
    userId, setUserId, selectedUserName,
    productId, setProductId, selectedProductName,
    visitIncludes, setVisitIncludes,
    orderIncludes, setOrderIncludes,
    // usersList, // Géré par le composant Modal lui-même
}) => {
    const { t } = useTranslation();
     const { openChild } = useChildViewer();

     // État pour la valeur animée du count
     // Initialisé avec la prop count. Lorsque prop count change, met à jour cet état interne
     const [animatedCount, setAnimatedCount] = useState(count);
     const prevCount = useRef(count);
     // Détection du changement de count prop et déclenchement de l'animation
     React.useEffect(() => {
         if (count !== prevCount.current) {
              // Ici, vous mettriez la logique d'animation plus complexe (framer-motion)
              // Pour une animation CSS simple, le changement d'état suffit si CSS est lié
             setAnimatedCount(count);
              prevCount.current = count;
          }
     }, [count]);


    // Handler pour ouvrir le modal de sélection client
     const handleOpenUserSelect = () => {
         openChild(
             <ChildViewer title={t('stats.selectClientTitle')}>
                 <UserSearchAndSelect
                     // Callbacks to update parent state and close modal
                     onClientSelected={(client) => {
                         setUserId(client?.id);
                         // Pass the selected client object back to update display name in parent?
                         // Or parent re-fetches/looks up name based on ID?
                         // Simpler: close modal, parent hook re-runs and update its own user object and passes name back down
                         openChild(null); // Close modal
                     }}
                     // Pass userId={userId} if UserSearchAndSelect needs to show current selection
                      currentSelectedUserId={userId}
                      onClose={() => openChild(null)} // Allow modal to close itself
                  />
              </ChildViewer>,
              { background: 'rgba(51, 51, 68, 0.8)', blur: 3 } // Modal background style
         );
     };

     // Handler pour ouvrir le modal de sélection produit
      const handleOpenProductSelect = () => {
          openChild(
              <ChildViewer title={t('stats.selectProductTitle')}>
                  <ProductSearchAndSelect
                      onProductSelected={(product) => {
                          setProductId(product?.id);
                          openChild(null); // Close modal
                      }}
                      currentSelectedProductId={productId}
                      onClose={() => openChild(null)} // Allow modal to close itself
                  />
              </ChildViewer>,
              { background: 'rgba(51, 51, 68, 0.8)', blur: 3 }
          );
      };

    // Handlers pour l'incrémentation/décrémentation du count
     const incrementCount = () => setCount(count + 1);
    const decrementCount = () => setCount(Math.max(1, count - 1)); // Count min = 1

    // Handler pour le changement de période (réinitialise le count par défaut pour cette période)
    const handlePeriodChange = (newPeriod: StatsPeriod) => {
         setPeriod(newPeriod);
         // Reset count to default for the new period
         setCount(defaultCounts[newPeriod]); // Call setCount from parent
    };


    // Gestion du changement des options include
     const handleVisitIncludeChange = (key: keyof VisitStatsIncludeOptions, checked: boolean) => {
        //@ts-ignore
        setVisitIncludes(prev => ({ ...prev, [key]: checked }));
    };
    const handleOrderIncludeChange = (key: keyof OrderStatsIncludeOptions, checked: boolean) => {
         //@ts-ignore
        setOrderIncludes(prev => ({ ...prev, [key]: checked }));
     };

    // Handler pour réinitialiser le client sélectionné
     const clearClient = () => {
        setUserId(undefined);
     };

    // Handler pour réinitialiser le produit sélectionné
     const clearProduct = () => {
        setProductId(undefined);
     };


    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('stats.filtersTitle')}</h2>
            <div className="flex flex-col gap-6"> {/* Utiliser flex-col gap pour les groupes de filtres */}

                {/* Groupe Période et Nombre */}
                <div className="flex flex-wrap gap-4 items-center">
                     {/* Filtre Période (Bento buttons) */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">{t('stats.periodLabel')}</label>
                         <div className="flex flex-wrap gap-2 rounded-lg p-1">
                            {VALID_STATS_PERIODS.map(p => (
                                <button
                                     type="button" // Important dans un formulaire
                                    key={p}
                                    onClick={() => handlePeriodChange(p)} // Use custom handler
                                     className={`px-3 py-1  border border-gray-300 shadow-sm cursor-pointer rounded-md text-sm font-medium transition
                                         ${p === period ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {t(`stats.periods.${p}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtre Nombre de Périodes (Custom control) */}
                     <div>
                        <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">{t('stats.countLabel')}</label>
                         <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit"> {/* Border pour le groupe */}
                              {/* Bouton Décrémenter */}
                              <button
                                   type="button"
                                  onClick={decrementCount}
                                  disabled={count <= 1} // Disable at 1
                                  className="px-3 py-1 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                              >
                                 <IoChevronDown className="w-4 h-4" />
                              </button>
                              {/* Label/Display Count */}
                               {/* Simple animation attempt: animate opacity and transform Y */}
                              <div className="px-4 py-1 text-sm font-semibold text-gray-800 transition-all duration-300 ease-in-out"> {/* Container for animation */}
                                   <span
                                       // Add key to force re-render and potentially trigger CSS animation? Still limited
                                       key={animatedCount}
                                        // Simple CSS classes that change on state update, relies on transition class
                                        // Could add classes based on prevCount > count or < count for slide direction
                                        // ex: `${animatedCount > prevCount.current ? 'animate-slide-up' : 'animate-slide-down'}` needs key + animation defined in CSS/Tailwind config
                                        // Keeping it very simple for now
                                   >
                                      {animatedCount}
                                   </span>
                              </div>
                              {/* Bouton Incrémenter */}
                              <button
                                   type="button"
                                  onClick={incrementCount}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-200 transition"
                              >
                                 <IoChevronUp className="w-4 h-4" />
                              </button>
                         </div>
                    </div>

                </div>

                {/* Groupe Sélection Client et Produit */}
                <div className="flex flex-wrap gap-4 items-center">
                     {/* Filtre Sélection Client (Trigger modal) */}
                     <div className="relative">
                         <label htmlFor="select-client-filter" className="block text-sm font-medium text-gray-700 mb-2">{t('stats.clientLabel')}</label>
                         <div
                             id="select-client-filter"
                            className="flex items-center justify-between w-full  px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-800"
                             onClick={handleOpenUserSelect}
                         >
                            <span className="truncate">
                                 {userId && selectedUserName ? selectedUserName : t('stats.selectClientPlaceholder')}
                            </span>
                             {userId && ( // Show clear button if client is selected
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); clearClient(); }} // Stop propagation to prevent modal opening
                                     className="flex items-center justify-center w-5 h-5 ml-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                                >
                                    <IoCloseSharp className="w-3 h-3 text-gray-600" />
                                </button>
                             )}
                         </div>
                     </div>

                     {/* Filtre Sélection Produit (Trigger modal) */}
                      <div className="relative">
                          <label htmlFor="select-product-filter" className="block text-sm font-medium text-gray-700 mb-2">{t('stats.productLabel')}</label>
                          <div
                             id="select-product-filter"
                             className="flex items-center justify-between w-full  px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-800"
                              onClick={handleOpenProductSelect}
                          >
                             <span className="truncate">
                                  {productId && selectedProductName ? selectedProductName : t('stats.selectProductPlaceholder')}
                             </span>
                              {productId && ( // Show clear button if product is selected
                                 <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); clearProduct(); }} // Stop propagation
                                      className="flex items-center justify-center w-5 h-5 ml-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                                 >
                                     <IoCloseSharp className="w-3 h-3 text-gray-600" />
                                 </button>
                              )}
                          </div>
                      </div>
                 </div>


                 {/* Groupe Date de Fin Personnalisée */}
                 <div>
                    <label htmlFor="customEndDate" className="block text-sm font-medium text-gray-700 mb-2">{t('stats.endDateLabel')}</label>
                     {/* Utiliser px-3 py-2 pour l'input date */}
                      <input
                         type="date"
                         id="customEndDate"
                         value={customEndDate ? DateTime.fromISO(customEndDate).toFormat('yyyy-MM-dd') : ''}
                         onChange={(e) => setCustomEndDate(e.target.value ? DateTime.fromFormat(e.target.value, 'yyyy-MM-dd').toISO()??undefined : undefined)}
                          className="px-3 py-2 block w-fit rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm text-gray-800"
                     />
                 </div>

                {/* Groupe Options d'inclusion */}
                 <div className="flex flex-wrap gap-6"> {/* Utiliser flex-wrap gap pour les groupes d'inclusion */}
                    {/* Visites Include Toggles */}
                     <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('stats.visitDetailsLabel')}</label>
                          <div className="flex flex-wrap gap-2"> {/* style Bento pour les tags d'inclusion */}
                               {Object.keys(visitIncludeLabels).map(key => {
                                    const dimKey = key as keyof VisitStatsIncludeOptions;
                                    const isIncluded = visitIncludes[dimKey];
                                    return (
                                        <button
                                             type="button"
                                             key={dimKey}
                                             onClick={() => handleVisitIncludeChange(dimKey, !isIncluded)}
                                              className={`px-3 py-1 text-sm rounded-md transition border
                                                  ${isIncluded
                                                      ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                                                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                  }`}
                                        >
                                            {visitIncludeLabels[dimKey]}
                                        </button>
                                    );
                                })}
                          </div>
                     </div>

                     {/* Commandes Include Toggles */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t('stats.orderDetailsLabel')}</label>
                          <div className="flex flex-wrap gap-2"> {/* style Bento pour les tags d'inclusion */}
                               {Object.keys(orderIncludeLabels).map(key => {
                                    const dimKey = key as keyof OrderStatsIncludeOptions;
                                     const isIncluded = orderIncludes[dimKey];
                                     return (
                                         <button
                                              type="button"
                                              key={dimKey}
                                             onClick={() => handleOrderIncludeChange(dimKey, !isIncluded)}
                                              className={`px-3 py-1 text-sm rounded-md transition border
                                                  ${isIncluded
                                                      ? 'bg-green-500 text-white border-green-600 shadow-sm' // Different color for Orders includes?
                                                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                  }`}
                                         >
                                             {orderIncludeLabels[dimKey]}
                                         </button>
                                     );
                                 })}
                          </div>
                     </div>

                </div>


            </div>

             {/* ChildViewer modals are managed by the parent using useChildViewer,
                 we just trigger them here */}

        </div>
    );
};

export default StatsFilters;