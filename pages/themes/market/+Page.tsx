// // pages/themes/market/+Page.tsx

// import { useState, useEffect, useMemo } from 'react';
// import { Topbar } from '../../../Components/TopBar/TopBar';
// import { ThemeInterface } from '../../../Interfaces/Interfaces';
// import { useGetThemes, useActivateThemeForStore } from '../../../api/ReactSublymusApi'; // Hooks API
// import { useTranslation } from 'react-i18next';
// import logger from '../../../api/Logger';
// import { ThemeCard } from '../../../Components/ThemeManager/ThemeManager'; // Réutiliser ThemeCard (ou créer une version liste?)
// import { ThemeCardSkeleton } from '../../../Components/ThemeManager/ThemeManager'; // Réutiliser Skeleton
// import { IoCheckmarkCircleOutline, IoColorFilterOutline, IoDesktopOutline, IoExpandOutline, IoPhonePortraitOutline, IoTabletPortraitOutline, IoSearch } from "react-icons/io5"; // Icônes
// import Select from 'react-select'; // Pour les filtres/tri
// import { usePageContext } from '../../../renderer/usePageContext'; // Pour récupérer storeId si passé en param
// import { debounce } from '../../../Components/Utils/functions';
// import { useGlobalStore } from '../../stores/StoreStore';
// import { NO_PICTURE } from '../../../Components/Utils/constants';
// import { getImg } from '../../../Components/Utils/StringFormater';

// // Définir les options de filtre/tri
// const filterTags = [ // Doit correspondre aux 'features' possibles des thèmes
//     { value: 'responsive', labelKey: 'themeFeatures.responsive' },
//     { value: '3d_viewer', labelKey: 'themeFeatures.3d_viewer' },
//     { value: 'ar_support', labelKey: 'themeFeatures.ar_support' },
//     { value: 'marketplace_layout', labelKey: 'themeFeatures.marketplace_layout' },
//     // ... ajouter d'autres tags pertinents
// ];
// const priceFilters = [
//     { value: 'all', labelKey: 'themesMarket.priceFilter.all' },
//     { value: 'free', labelKey: 'themesMarket.priceFilter.free' },
//     { value: 'premium', labelKey: 'themesMarket.priceFilter.premium' },
// ];
// const sortOptions = [
//     { value: 'name_asc', labelKey: 'themesMarket.sortOptions.name_asc' },
//     // { value: 'popularity_desc', labelKey: 'themesMarket.sortOptions.popularity_desc' }, // Si API supporte
//     { value: 'created_at_desc', labelKey: 'themesMarket.sortOptions.created_at_desc' },
// ];

// // Type pour l'état des filtres
// interface ThemeMarketFilter {
//     search?: string;
//     tags?: string[];
//     price?: 'all' | 'free' | 'premium';
//     sort?: string;
//     page?: number; // Pour pagination future si besoin
//     limit?: number;
// }

// export { Page };

// function Page() {
//     const { t } = useTranslation();
//     const { urlParsed } = usePageContext();
//     // Récupérer le storeId depuis les query params (?store=xxx) si on vient du bouton "Changer"
//     const storeIdForInstall = urlParsed.search?.store as string | undefined;

//     // --- États ---
//     const [filters, setFilters] = useState<ThemeMarketFilter>({ price: 'all', sort: 'name_asc' });
//     const [selectedTheme, setSelectedTheme] = useState<ThemeInterface | null>(null); // Thème affiché dans la preview
//     const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
//     const [isPreviewLoading, setIsPreviewLoading] = useState(false); // Chargement de l'iframe

//     // --- Hooks API ---
//     const { data: themesData, isLoading, isError, error } = useGetThemes({
//         // TODO: Adapter les params pour l'API getList de ThemeNamespace
//         // search: filters.search,
//         // features: filters.tags,
//         // is_premium: filters.price === 'premium' ? true : (filters.price === 'free' ? false : undefined),
//         // order_by: filters.sort,
//         // limit: 50 // Charger un bon nombre pour le scroll infini ou pagination simple
//         is_public: true, // Charger seulement les thèmes publics ici
//     });
//     const activateThemeMutation = useActivateThemeForStore();

//     const themesList = themesData?.list ?? [];

//     // Sélectionner le premier thème par défaut au chargement
//     useEffect(() => {
//         if (!selectedTheme && themesList.length > 0) {
//             setSelectedTheme(themesList[0]);
//         }
//         // Reset la sélection si la liste filtrée ne contient plus le thème sélectionné
//         if (selectedTheme && !themesList.some(t => t.id === selectedTheme.id)) {
//              setSelectedTheme(themesList[0] ?? null);
//         }
//     }, [themesList, selectedTheme]);

//     // --- Handlers ---
//     const handleFilterChange = (newFilters: Partial<ThemeMarketFilter>) => {
//         setFilters(prev => ({ ...prev, ...newFilters, page: 1 })); // Reset page au changement de filtre
//     };

//     const handleThemeSelect = (theme: ThemeInterface) => {
//         if (theme.id !== selectedTheme?.id) {
//              setSelectedTheme(theme);
//              setIsPreviewLoading(true); // Afficher chargement pendant que l'iframe change
//         }
//     };

//     const handleInstallTheme = () => {
//         if (!selectedTheme || !storeIdForInstall || activateThemeMutation.isPending) return;

//         // Ajouter confirmation si thème payant? (Pour l'instant, on installe directement)
//         activateThemeMutation.mutate(
//             { store_id: storeIdForInstall, themeId: selectedTheme.id },
//             {
//                 onSuccess: () => {
//                      logger.info(`Theme ${selectedTheme.id} activated for store ${storeIdForInstall}`);
//                      // Afficher toast succès
//                      // Optionnel: Rediriger vers la page /stores ou /theme/editor?
//                      // window.location.href = `/stores/${storeIdForInstall}/settings`;
//                 },
//                  onError: (error) => {
//                       logger.error({ error }, `Failed to activate theme ${selectedTheme.id}`);
//                       // Afficher toast erreur
//                  }
//             }
//         );
//     };

//     // URL de la preview (à adapter selon la vraie URL fournie par l'API ou une convention)
//     const previewUrl = useMemo(() => {
//         // return selectedTheme?.preview_url ?? `http://localhost:3000/themes/preview?themeId=${selectedTheme?.id}`;
//         // Pour démo S0 :
//         return selectedTheme ? `http://localhost:5173/themes/preview?themeId=${selectedTheme?.id}&cacheBust=${Date.now()}` : undefined; // Ajouter cacheBust pour forcer rechargement iframe
//     }, [selectedTheme]);

//     return (
//         <div className="w-full min-h-screen flex flex-col bg-gray-100">
//             <Topbar back={true} title={t('themesMarket.pageTitle')} /> 

//             {/* Layout principal: Colonne filtres/liste fixe à gauche, preview à droite */}
//             <div className="flex-grow flex flex-col md:flex-row overflow-hidden"> {/* Empêcher double scroll */}

//                 {/* Colonne Gauche: Filtres et Liste */}
//                  {/* Utiliser w-full md:w-1/3 lg:w-1/4, flex flex-col, border-r, bg-white */}
//                 <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-gray-200 bg-white h-full overflow-y-auto"> {/* Scrollable */}
//                      {/* Barre de Filtres/Recherche */}
//                      <div className="p-4 border-b border-gray-200 space-y-3 sticky top-0 bg-white z-10">
//                          <h2 className="text-sm font-semibold text-gray-500 uppercase">{t('themesMarket.filtersTitle')}</h2> 
//                          {/* Recherche */}
//                          <div className="relative">
//                               <input
//                                   type="text"
//                                   placeholder={t('themesMarket.searchPlaceholder')} 
//                                   className="w-full pl-3 pr-9 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//                                   value={filters.search ?? ''}
//                                   onChange={(e) => debounce(() => handleFilterChange({ search: e.target.value || undefined }), 'theme-search', 400)}
//                               />
//                               <IoSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                          </div>
//                           {/* Autres filtres (Tags, Prix, Tri) - Utiliser react-select? */}
//                           {/* Exemple simple avec select */}
//                           <div className="grid grid-cols-1 gap-3 text-sm">
//                               {/* <Select placeholder={t('themesMarket.filterTags')} isMulti options={filterTags.map(t => ({value: t.value, label: t(t.labelKey)}))} ... /> */}
//                               <select value={filters.price} onChange={e => handleFilterChange({ price: e.target.value as any })} className="w-full border-gray-300 rounded-md shadow-sm text-sm h-9">
//                                    {priceFilters.map(p => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
//                               </select>
//                               <select value={filters.sort} onChange={e => handleFilterChange({ sort: e.target.value })} className="w-full border-gray-300 rounded-md shadow-sm text-sm h-9">
//                                    {sortOptions.map(s => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
//                               </select>
//                           </div>
//                      </div>

//                      {/* Liste des Thèmes */}
//                      <div className="flex-grow overflow-y-auto p-2">
//                          {isLoading && Array.from({ length: 6 }).map((_, i) => <ThemeCardSkeleton key={`list-skel-${i}`} />)}
//                          {isError && <p className="p-4 text-center text-red-500 text-sm">{error?.message || t('error_occurred')}</p>}
//                           {!isLoading && !isError && themesList.length === 0 && <p className="p-4 text-center text-gray-500 text-sm">{t('themesMarket.noThemesMatch')}</p>} 
//                           {!isLoading && !isError && themesList.map(theme => (
//                               // Utiliser une version "Item" de la carte pour la liste
//                               <ThemeListItem
//                                   key={theme.id}
//                                   theme={theme}
//                                   isSelected={theme.id === selectedTheme?.id}
//                                   onClick={() => handleThemeSelect(theme)}
//                               />
//                           ))}
//                      </div>
//                 </aside>

//                 {/* Colonne Droite: Preview et Actions */}
//                  {/* Utiliser flex-grow, flex flex-col, bg-gray-200 */}
//                 <main className="flex-grow flex flex-col bg-gray-200 h-full overflow-hidden">
//                      {selectedTheme ? (
//                          <>
//                              {/* Barre d'outils Preview */}
//                              <div className="flex items-center justify-between p-2 px-4 bg-white border-b border-gray-300 flex-shrink-0">
//                                  <h3 className="text-base font-medium text-gray-800 truncate" title={selectedTheme.name}>
//                                      {t('themesMarket.previewTitle', { name: selectedTheme.name })} 
//                                  </h3>
//                                   {/* Contrôles Responsive + Plein écran */}
//                                  <div className="flex items-center gap-2">
//                                      <button onClick={() => setPreviewDevice('mobile')} title="Mobile" className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}><IoPhonePortraitOutline size={18} /></button>
//                                      <button onClick={() => setPreviewDevice('tablet')} title="Tablette" className={`p-1.5 rounded ${previewDevice === 'tablet' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}><IoTabletPortraitOutline size={18} /></button>
//                                      <button onClick={() => setPreviewDevice('desktop')} title="Desktop" className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}><IoDesktopOutline size={18} /></button>
//                                      {/* Bouton fullscreen modale? */}
//                                      {/* <button title="Agrandir" className="p-1.5 rounded text-gray-500 hover:bg-gray-100"><IoExpandOutline size={18} /></button> */}
//                                  </div>
//                                  {/* Bouton Installer */}
//                                   <button
//                                        onClick={handleInstallTheme}
//                                        disabled={!storeIdForInstall || activateThemeMutation.isPending}
//                                        className="ml-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                                    >
//                                        {activateThemeMutation.isPending ? t('common.installing') : t('themesMarket.installButton')} 
//                                    </button>
//                              </div>

//                             {/* Conteneur Iframe */}
//                              <div className="flex-grow flex justify-center items-center overflow-hidden p-4 relative">
//                                  {/* Indicateur de chargement pour l'iframe */}
//                                  {isPreviewLoading && (
//                                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
//                                          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
//                                      </div>
//                                  )}
//                                  {/* Iframe avec taille dynamique */}
//                                  <iframe
//                                      key={previewUrl} // Changer la clé force le re-render de l'iframe
//                                      src={previewUrl}
//                                      title={t('themesMarket.previewTitle', { name: selectedTheme.name })}
//                                      className={`bg-white shadow-lg rounded-md border border-gray-300 transition-all duration-300 ease-in-out ${
//                                          previewDevice === 'mobile' ? 'w-[375px] h-[667px]' : // iPhone SE/8 approx
//                                          previewDevice === 'tablet' ? 'w-[768px] h-[1024px]' : // iPad approx
//                                          'w-full h-full' // Desktop
//                                      }`}
//                                       // sandbox="allow-scripts allow-same-origin" // Sandbox pour sécurité? Peut casser des previews.
//                                       onLoad={() => setIsPreviewLoading(false)} // Cacher le loader quand l'iframe est chargée
//                                  ></iframe>
//                              </div>
//                          </>
//                      ) : (
//                           // Message si aucun thème sélectionné ou disponible
//                           <div className="flex-grow flex items-center justify-center text-gray-500 italic">
//                               {t('themesMarket.selectThemePrompt')} 
//                           </div>
//                      )}
//                  </main>
//             </div>
//         </div>
//     );
// }

// // --- Composant ThemeListItem (pour la liste de gauche) ---
// interface ThemeListItemProps {
//     theme: ThemeInterface;
//     isSelected: boolean;
//     onClick: () => void;
// }
// function ThemeListItem({ theme, isSelected, onClick }: ThemeListItemProps) {
//      const { t } = useTranslation();
//      const { currentStore: globalCurrentStore } = useGlobalStore();
//      const [imgError, setImgError] = useState(false);
//      const imageUrl = theme.preview_images?.[0] ?? NO_PICTURE;
//      const imageSrc = getImg(imageUrl, undefined, globalCurrentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1];
//      const isFree = theme.price === 0 || theme.is_premium === false;

//     return (
//         <button // Rendre cliquable
//             type="button"
//             onClick={onClick}
//              // Appliquer styles Tailwind pour la ligne
//              className={`flex items-center gap-3 p-2 rounded-lg w-full text-left transition duration-150 ${
//                  isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
//              }`}
//         >
//             {/* Miniature */}
//             <div className="w-16 h-10 rounded bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
//                  {!imgError ? (
//                       <img src={imageSrc || NO_PICTURE} alt={theme.name} className="w-full h-full object-cover" onError={() => setImgError(true)}/>
//                   ) : (
//                       <img src={NO_PICTURE} alt={t('common.imageError')} className="w-full h-full object-contain p-1 opacity-50" />
//                   )}
//             </div>
//             {/* Nom & Prix/Gratuit */}
//             <div className="flex-grow min-w-0">
//                  <p className={`font-medium text-sm truncate ${isSelected ? 'text-blue-800' : 'text-gray-800'}`} title={theme.name}>
//                      {theme.name}
//                  </p>
//                  <p className={`text-xs mt-0.5 ${isFree ? 'text-green-600' : 'text-blue-600'}`}>
//                       {isFree ? t('themeCard.free') : `${Number(theme.price || 0).toLocaleString()} FCFA`}
//                  </p>
//             </div>
//         </button>
//     );
// }

// pages/themes/market/+Page.tsx

import { useState, useMemo, useEffect } from 'react';
import { Topbar } from '../../../Components/TopBar/TopBar';
import {  ThemeInterface } from '../../../Interfaces/Interfaces'; // Ajouter ThemeFilterType
import { useGetThemes, useActivateThemeForStore } from '../../../api/ReactSublymusApi'; // Hook pour lister et activer
import { useTranslation } from 'react-i18next';
import { ThemeListItem, ThemeListItemSkeleton } from '../../../Components/ThemeList/ThemeListItem'; // Nouveau
import { LiveThemePreview ,LiveThemePreviewSkeleton } from '../../../Components/ThemeEditor/LiveThemePreview'; // Nouveau
import { ThemeFilters } from '../../../Components/ThemeList/ThemeFilters'; // Nouveau
import logger from '../../../api/Logger';
// import { useStore } from '../stores/'; // Pour obtenir le storeId lors de l'installation
import { usePageContext } from '../../../renderer/usePageContext'; // Pour lire le storeId initial des params?
import { useGlobalStore } from '../../stores/StoreStore';

export { Page };

// Type pour les filtres de thème
export interface ThemeFilterType {
    search?: string;
    tags?: string[]; // Filtrer par features/tags
    price?: 'all' | 'free' | 'premium';
    sort?: 'name_asc' | 'name_desc' | 'date_desc'; // Options de tri
    page:number,
    limit:number
    // Ajouter page/limit si pagination nécessaire pour la liste
}

function Page() {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore(); // Store actuel pour l'installation
     const { urlParsed } = usePageContext();
     // Récupérer un storeId potentiel depuis l'URL pour pré-sélectionner l'installation
     const targetStoreId = urlParsed.search?.store;


    // --- État ---
    const [filter, setFilter] = useState<any>({ price: 'all', sort: 'name_asc' });
    const [selectedTheme, setSelectedTheme] = useState<ThemeInterface | null>(null);
    const [isPreviewMaximized, setIsPreviewMaximized] = useState(false); // Pour gérer l'état fullscreen de la preview

    // --- Récupération des données ---
    // Fetcher tous les thèmes publics
    const { data: themesData, isLoading, isError, error } = useGetThemes(
        { ...filter, is_public: true }, // Ajouter filtre is_public=true et potentiellement pagination/sort
        // { enabled: true } // Toujours activé
    );
    const themes = themesData?.list ?? [];

     // Sélectionner le premier thème par défaut si aucun n'est sélectionné
     useEffect(() => {
         if (!selectedTheme && themes.length > 0) {
             setSelectedTheme(themes[0]);
         }
         // Si le thème sélectionné n'est plus dans la liste (à cause des filtres), désélectionner?
         if (selectedTheme && themes.length > 0 && !themes.some(t => t.id === selectedTheme.id)) {
              setSelectedTheme(themes[0]); // Revenir au premier
         }
          // Si la liste devient vide, désélectionner
          if(themes.length === 0) {
               setSelectedTheme(null);
          }
     }, [themes, selectedTheme]);

    // --- Mutation pour installer ---
    const activateThemeMutation = useActivateThemeForStore();

    // --- Handlers ---
    const handleSelectTheme = (theme: ThemeInterface) => {
        setSelectedTheme(theme);
         // Sur mobile, on pourrait naviguer vers une page détail/preview au lieu de juste mettre à jour l'état
         // if (window.innerWidth < 768) { navigate(`/themes/preview/${theme.id}?store=${targetStoreId || currentStore?.id}`); }
    };

    const handleInstallTheme = (themeToInstall: ThemeInterface) => {
         const storeIdForInstall = targetStoreId || currentStore?.id; // Utiliser storeId de l'URL ou le store courant
         if (!storeIdForInstall) {
             logger.error("Cannot install theme: no target store ID available.");
              // Afficher un message/toast demandant de sélectionner un store?
              alert(t('themeMarket.selectStoreFirst')); 
             return;
         }
         if (!themeToInstall.id) return;

         logger.info(`Requesting install for theme ${themeToInstall.id} on store ${storeIdForInstall}`);
         activateThemeMutation.mutate(
             { store_id: storeIdForInstall, themeId: themeToInstall.id },
             {
                 onSuccess: () => {
                      logger.info(`Theme ${themeToInstall.name} successfully activated for store ${storeIdForInstall}`);
                      // Afficher toast succès
                      // Optionnel: rediriger vers la page /stores ou les paramètres du store?
                 },
                 onError: (err) => {
                      logger.error({ err }, `Failed to activate theme ${themeToInstall.id} for store ${storeIdForInstall}`);
                      // Afficher toast erreur
                 }
             }
         );
    };

    return (
        <div className="w-full min-h-screen flex flex-col bg-gray-100">
            <Topbar back={true} title={t('themeMarket.pageTitle')} /> 

            {/* Layout principal - Deux colonnes sur Desktop (md+) */}
            <main className="flex-grow w-full max-w-full flex flex-col md:flex-row">

                {/* Colonne Gauche: Filtres et Liste (scrollable) */}
                <aside className="w-full md:w-72 lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
                    {/* Barre de Filtres */}
                     <div className="p-4 border-b border-gray-200 sticky top-16 bg-white z-10"> {/* Sticky pour rester visible */}
                        <ThemeFilters filter={filter} onFilterChange={setFilter} />
                    </div>
                    {/* Liste des Thèmes */}
                    <div className="flex-grow overflow-y-auto p-2">
                        {isLoading && (
                             Array.from({ length: 8 }).map((_, i) => <ThemeListItemSkeleton key={`skel-list-${i}`} />)
                        )}
                        {isError && (
                             <p className="p-4 text-sm text-red-500">{error?.message || t('error_occurred')}</p>
                        )}
                        {!isLoading && !isError && themes.length === 0 && (
                             <p className="p-4 text-sm text-gray-500">{t('themeMarket.noThemesMatch')}</p> 
                        )}
                        {!isLoading && !isError && themes.map(theme => (
                            <ThemeListItem
                                key={theme.id}
                                theme={theme}
                                isSelected={selectedTheme?.id === theme.id}
                                onClick={() => handleSelectTheme(theme)}
                            />
                        ))}
                    </div>
                </aside>

                {/* Colonne Droite: Preview (prend l'espace restant) */}
                {/* Utiliser flex-grow pour qu'elle prenne la place */}
                <section className="flex-grow flex flex-col bg-gray-50 relative">
                    {isLoading ? (
                         <LiveThemePreviewSkeleton />
                    ) : selectedTheme ? (
                        <LiveThemePreview
                          store={{id:currentStore?.id||''} as any}
                          theme={selectedTheme}
                          settings={{}} // Passer les settings en cours d'édition
                      />
                    ) : (
                         // Message si aucun thème n'est sélectionné (ne devrait pas arriver si sélection par défaut)
                         <div className="flex-grow flex items-center justify-center">
                              <p className="text-gray-500">{t('themeMarket.selectThemePrompt')}</p> 
                         </div>
                    )}
                </section>
            </main>
        </div>
    );
}
