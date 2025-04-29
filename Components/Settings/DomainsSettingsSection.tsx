// Components/Settings/DomainsSettingsSection.tsx

import { useState, useEffect } from 'react';
import { StoreInterface } from "../../Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
// Importer les mutations pour ajouter/supprimer les domaines
import { useAddStoreDomain, 
    // useRemoveStoreDomain 
} from "../../api/ReactSublymusApi";
import logger from '../../api/Logger';
import { IoGlobeOutline, IoTrash, IoLink, IoAddSharp, IoCopyOutline, IoCheckmarkDoneOutline } from "react-icons/io5";
import { ApiError } from '../../api/SublymusApi'; // Importer ApiError
import { copyToClipboard } from '../Utils/functions'; // Importer copyToClipboard

interface DomainsSettingsSectionProps {
    store: StoreInterface;
}

// Regex simple pour validation domaine (à affiner si besoin)
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

export function DomainsSettingsSection({ store }: DomainsSettingsSectionProps) {
    const { t } = useTranslation();
    const addDomainMutation = useAddStoreDomain();
    // const removeDomainMutation = useRemoveStoreDomain(); // Assumer que ce hook existe
    const removeDomainMutation = { isPending: false, variables: {} as StoreInterface | undefined , mutate: (data: any, options: any) => { console.log("Update settings mutation:", data); options.onSuccess?.(); } }; // Placeholder; // Assumer que ce hook existe

    // --- État Local ---
    const [newDomain, setNewDomain] = useState('');
    const [domainError, setDomainError] = useState<string | null>(null);
    const [copiedDomain, setCopiedDomain] = useState<string | null>(null); // Pour feedback copie

    // --- Handlers ---
    const handleAddDomain = () => {
        setDomainError(null); // Reset error
        const trimmedDomain = newDomain.trim().toLowerCase();

        if (!trimmedDomain) {
            setDomainError(t('domains.validation.nameRequired'));
            return;
        }
        if (!DOMAIN_REGEX.test(trimmedDomain)) {
             setDomainError(t('domains.validation.invalidFormat'));
            return;
        }
        // Vérifier si déjà dans la liste (côté client)
        if (store.domain_names?.includes(trimmedDomain)) {
             setDomainError(t('domains.validation.alreadyExists'));
             return;
        }


        store.id && addDomainMutation.mutate(
            { store_id: store.id, domainName: trimmedDomain },
            {
                onSuccess: () => {
                     logger.info(`Domain ${trimmedDomain} added to store ${store.id}`);
                     setNewDomain(''); // Vider l'input
                     // L'invalidation de 'storeDetails' par le hook mettra à jour la liste
                     // Afficher toast succès?
                 },
                 onError: (error: ApiError) => {
                      logger.error({ error }, `Failed to add domain ${trimmedDomain} to store ${store.id}`);
                      setDomainError(error.message); // Afficher l'erreur API
                      // Afficher toast erreur?
                 }
            }
        );
    };

    const handleDeleteDomain = (domainToDelete: string) => {
        // Ajouter une confirmation?
         if (!window.confirm(t('domains.confirmDelete', { domain: domainToDelete }))) return;

         removeDomainMutation.mutate(
             { store_id: store.id, domainName: domainToDelete },
             {
                 onSuccess: () => {
                      logger.info(`Domain ${domainToDelete} removed from store ${store.id}`);
                       // L'invalidation mettra à jour la liste
                       // Afficher toast succès?
                  },
                  onError: (error: ApiError) => {
                       logger.error({ error }, `Failed to remove domain ${domainToDelete} from store ${store.id}`);
                        // Afficher toast erreur? (Peut-être dans une zone dédiée)
                       alert(`${t('common.error')}: ${error.message}`); // Alert simple pour l'instant
                  }
             }
         );
    };

    const handleCopy = (textToCopy: string) => {
        copyToClipboard(textToCopy, () => {
            setCopiedDomain(textToCopy);
            setTimeout(() => setCopiedDomain(null), 1500);
        });
    };

    // --- Rendu ---
    const sublymusDomain = `${store.slug}.sublymus.app`; // Construire le sous-domaine

    return (
         // Conteneur Section
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
             {/* En-tête */}
             <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('settingsPage.sidebar.domains')}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('domains.description')}</p> 
            </div>

            {/* Contenu */}
            <div className="px-4 py-5 sm:p-6 space-y-6">

                {/* Domaine Sublymus */}
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{t('domains.sublymusDomainLabel')}</label> 
                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50">
                        <IoLink className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                        <a
                            href={`http://${sublymusDomain}`} // Assumer http pour l'instant
                            target="_blank"
                            rel="noopener noreferrer"
                             className="text-sm text-blue-600 hover:underline flex-grow truncate"
                             title={sublymusDomain}
                         >
                            {sublymusDomain}
                        </a>
                         <button
                             onClick={() => handleCopy(sublymusDomain)}
                             title={t('common.copy')}
                             className="p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-300 flex-shrink-0"
                         >
                              {copiedDomain === sublymusDomain ? <IoCheckmarkDoneOutline className="w-4 h-4 text-green-500"/> : <IoCopyOutline className="w-4 h-4"/>}
                          </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{t('domains.sublymusDomainHelp')}</p> 
                </div>

                 {/* Domaines Personnalisés */}
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">{t('domains.customDomainsLabel')}</label> 
                      {/* Liste des domaines ajoutés */}
                      <div className="space-y-2 mb-4">
                           {(store.domain_names ?? []).length === 0 && (
                                <p className="text-sm text-gray-500 italic">{t('domains.noCustomDomains')}</p> 
                           )}
                           {(store.domain_names ?? []).map(domain => (
                                <div key={domain} className="flex items-center justify-between gap-2 p-2 border border-gray-200 rounded-md">
                                     <div className="flex items-center gap-2 min-w-0">
                                        <IoGlobeOutline className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                         <span className="text-sm text-gray-800 truncate" title={domain}>{domain}</span>
                                     </div>
                                      <button
                                          onClick={() => handleDeleteDomain(domain)}
                                          disabled={removeDomainMutation.isPending && removeDomainMutation.variables && (removeDomainMutation.variables.domain_names?.[0] === domain)} // Désactiver si suppression en cours pour ce domaine
                                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                                          title={t('common.delete')}
                                      >
                                          <IoTrash className="w-4 h-4" />
                                      </button>
                                </div>
                           ))}
                      </div>

                      {/* Formulaire d'ajout */}
                       <div className="flex items-start gap-2">
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    value={newDomain}
                                    onChange={(e) => { setNewDomain(e.target.value); setDomainError(null); }}
                                    placeholder={t('domains.addPlaceholder')} 
                                    className={`block w-full rounded-md shadow-sm sm:text-sm h-10 ${domainError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    aria-label={t('domains.addPlaceholder')}
                                />
                                 {domainError && <p className="mt-1 text-xs text-red-600">{domainError}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddDomain}
                                disabled={addDomainMutation.isPending || !newDomain.trim()}
                                className="inline-flex items-center justify-center h-10 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {addDomainMutation.isPending ? t('common.saving') : t('common.add')} 
                            </button>
                       </div>
                      {/* Instructions DNS */}
                       <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 space-y-1">
                            <p><strong>{t('domains.dnsInstructionsTitle')}:</strong></p> 
                            <p>{t('domains.dnsInstructions1')}</p> 
                             <p>{t('domains.dnsInstructions2')} <code className="text-xs bg-gray-200 px-1 rounded">CNAME</code> {t('domains.dnsInstructions3')} <code className="text-xs bg-gray-200 px-1 rounded">shops.sublymus.app</code>.</p> 
                            <p>{t('domains.dnsInstructions4')}</p> 
                       </div>
                 </div>
            </div>
            {/* Pas de bouton Enregistrer global pour cette section, les actions sont directes */}
        </div>
    );
}
