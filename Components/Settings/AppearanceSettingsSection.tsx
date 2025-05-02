// Components/Settings/AppearanceSettingsSection.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { StoreInterface } from "../../Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { useUpdateStore } from "../../api/ReactSublymusApi"; // Hook pour la mise à jour
import logger from '../../api/Logger';
import { IoCloudUploadOutline, IoImageOutline } from 'react-icons/io5';
import { getImg } from '../Utils/StringFormater'; // Pour preview
import { useGlobalStore } from '../../pages/stores/StoreStore'; // Pour URL base image
import { NO_PICTURE } from '../Utils/constants'; // Placeholder
import { ApiError } from '../../api/SublymusApi';
import { Server_Host } from '../../renderer/+config';

interface AppearanceSettingsSectionProps {
    store: StoreInterface;
}

// Type pour l'état local gérant les fichiers et previews
interface AppearanceFormState {
    logoFile: File | null;
    logoPreview: string | null;
    coverFile: File | null;
    coverPreview: string | null;
    faviconFile: File | null;
    faviconPreview: string | null;
}

export function AppearanceSettingsSection({ store }: AppearanceSettingsSectionProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore(); // Pour URL images existantes
    const updateStoreMutation = useUpdateStore();

    const isLoading = updateStoreMutation.isPending
    // Refs pour les inputs file cachés
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // --- État Local ---
    const [formState, setFormState] = useState<AppearanceFormState>({
        logoFile: null,
        logoPreview: null,
        coverFile: null,
        coverPreview: null,
        faviconFile: null,
        faviconPreview: null,
    });
    const [hasChanges, setHasChanges] = useState(false);
    // Erreurs spécifiques (ex: taille/type fichier) - pour l'instant, juste une erreur API générale
    const [apiError, setApiError] = useState<string | null>(null);

    // Détecter les changements (si un nouveau fichier est sélectionné)
    useEffect(() => {
        setHasChanges(!!formState.logoFile || !!formState.coverFile || !!formState.faviconFile);
    }, [formState.logoFile, formState.coverFile, formState.faviconFile]);

    // Nettoyer les ObjectURLs lors du démontage
    useEffect(() => {
        return () => {
            if (formState.logoPreview) URL.revokeObjectURL(formState.logoPreview);
            if (formState.coverPreview) URL.revokeObjectURL(formState.coverPreview);
            if (formState.faviconPreview) URL.revokeObjectURL(formState.faviconPreview);
        };
    }, [formState.logoPreview, formState.coverPreview, formState.faviconPreview]);


    // --- Handlers ---
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'logo' | 'cover' | 'favicon'
    ) => {
        const file = e.target.files?.[0];
        const previewStateKey = `${type}Preview` as keyof AppearanceFormState;
        const fileStateKey = `${type}File` as keyof AppearanceFormState;

        // Révoquer l'ancienne preview si elle existe
        const oldPreview = formState[previewStateKey];
        if (typeof oldPreview == 'string') URL.revokeObjectURL(oldPreview);

        if (file) {
            // TODO: Ajouter validation type/taille fichier ici
            setFormState(prev => ({
                ...prev,
                [fileStateKey]: file,
                [previewStateKey]: URL.createObjectURL(file)
            }));
            setApiError(null); // Reset erreur API
        } else {
            // Si l'utilisateur annule, reset le fichier et la preview
            setFormState(prev => ({
                ...prev,
                [fileStateKey]: null,
                [previewStateKey]: null
            }));
        }
         e.target.value = ''; // Reset input file
    };

    // --- Sauvegarde ---
    const handleSaveChanges = () => {
         if (!hasChanges || updateStoreMutation.isPending) return;
         if(!store.id) return
// Ajouter les fichiers seulement s'ils ont changé
        const local : StoreInterface = {
            logo : formState.logoFile ? [formState.logoFile]:undefined,
            cover_image : formState.coverFile?[formState.coverFile]:undefined,
            favicon : formState.faviconFile?[formState.faviconFile]:undefined,
        } 
         

 // Assumer nom 'favicon_0'

        updateStoreMutation.mutate(
            { store_id: store.id, data: local }, // Passer formData directement
            {
                onSuccess: (updatedStoreData) => {
                     logger.info(`Store ${store.id} appearance updated`);
                     setHasChanges(false);
                     setFormState({ // Reset form state après succès
                         logoFile: null, logoPreview: null,
                         coverFile: null, coverPreview: null,
                         faviconFile: null, faviconPreview: null,
                     });
                     setApiError(null);
                      // L'invalidation du cache storeDetails dans le hook mettra à jour l'affichage des images existantes
                     // Afficher toast succès?
                 },
                 onError: (error: ApiError) => {
                      logger.error({ error }, `Failed to update appearance for store ${store.id}`);
                      setApiError(error.message); // Afficher erreur API
                      // Ne pas reset formState pour permettre à l'user de réessayer
                      // Afficher toast erreur?
                 }
            }
        );
    };

    // --- URLs pour affichage ---
    let currentLogoUrl = formState.logoPreview ?? (store.logo?.[0] ? getImg(store.logo[0], undefined, Server_Host).match(/url\("?([^"]+)"?\)/)?.[1] : null);
    let currentCoverUrl = formState.coverPreview ?? (store.cover_image?.[0] ? getImg(store.cover_image[0], undefined, Server_Host).match(/url\("?([^"]+)"?\)/)?.[1] : null);
    const currentFaviconUrl = formState.faviconPreview ?? (store.favicon ? getImg(store.favicon[0], undefined, Server_Host).match(/url\("?([^"]+)"?\)/)?.[1] : null); // Assumer store.favicon est l'URL directe

    return (
         // Conteneur Section
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
             {/* En-tête */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('settingsPage.sidebar.appearance')}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('settingsAppearance.description')}</p> 
            </div>

            {/* Formulaire */}
             {/* Utiliser grid pour layout */}
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                 {/* Logo */}
                 <div className="md:col-span-1 flex flex-col gap-4 items-start">
                     <label className="block text-sm font-medium text-gray-700">{t('settingsAppearance.logoLabel')}</label> 
                     {/* Preview */}
                     <label htmlFor='store-setting-logo' className="w-24 h-24 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden">
                         {currentLogoUrl ? (
                             <img src={currentLogoUrl} alt="Logo preview" className="w-full h-full object-contain"/>
                         ) : (
                              <IoImageOutline className="w-12 h-12 text-gray-400" />
                         )}
                     </label>
                     {/* Bouton Upload */}
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          {currentLogoUrl ? t('settingsAppearance.changeLogo') : t('settingsAppearance.uploadLogo')} 
                      </button>
                     <input id='store-setting-logo' ref={logoInputRef} type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                     <p className="text-xs text-gray-500">{t('settingsAppearance.logoHelp')}</p> 
                 </div>

                {/* Favicon */}
                 <div className="md:col-span-1 flex flex-col gap-4 items-start">
                     <label className="block text-sm font-medium text-gray-700">{t('settingsAppearance.faviconLabel')}</label> 
                     {/* Preview */}
                      <label htmlFor='store-setting-favicon' className="w-10 h-10 rounded border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {currentFaviconUrl ? (
                              <img src={currentFaviconUrl} alt="Favicon preview" className="w-full h-full object-contain"/>
                          ) : (
                               <IoImageOutline className="w-5 h-5 text-gray-400" />
                          )}
                      </label>
                     {/* Bouton Upload */}
                      <button type="button" onClick={() => faviconInputRef.current?.click()} className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                           {currentFaviconUrl ? t('settingsAppearance.changeFavicon') : t('settingsAppearance.uploadFavicon')} 
                      </button>
                      <input id='store-setting-favicon' ref={faviconInputRef} type="file" accept="image/x-icon, image/png, image/svg+xml" className="hidden" onChange={(e) => handleFileChange(e, 'favicon')} />
                     <p className="text-xs text-gray-500">{t('settingsAppearance.faviconHelp')}</p> 
                 </div>

                 {/* Image de Couverture */}
                  {/* Prend toute la largeur */}
                  <div className="md:col-span-2 flex flex-col gap-4 items-start">
                      <label className="block text-sm font-medium text-gray-700">{t('settingsAppearance.coverLabel')}</label> 
                      {/* Preview */}
                      <label htmlFor='store-setting-cover-image' className="w-full aspect-video rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden">
                         {currentCoverUrl ? (
                             <img src={currentCoverUrl} alt="Cover preview" className="w-full h-full object-cover"/>
                         ) : (
                              <IoImageOutline className="w-16 h-16 text-gray-400" />
                         )}
                      </label>
                      {/* Bouton Upload */}
                       <button type="button" onClick={() => coverInputRef.current?.click()} className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            {currentCoverUrl ? t('settingsAppearance.changeCover') : t('settingsAppearance.uploadCover')} 
                       </button>
                       <input id='store-setting-cover-image' ref={coverInputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => handleFileChange(e, 'cover')} />
                      <p className="text-xs text-gray-500">{t('settingsAppearance.coverHelp')}</p> 
                  </div>

                   {/* Erreur API Générale */}
                   {apiError && <p className="md:col-span-2 text-sm text-red-600">{apiError}</p>}

            </div>

             {/* Pied de page avec Bouton Enregistrer */}
             <div className="px-4 py-3 sm:px-6 bg-gray-50 text-right rounded-b-lg">
                 <button
                     type="button"
                     onClick={handleSaveChanges}
                     disabled={!hasChanges || isLoading}
                     className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                      {isLoading ? t('common.saving') : t('common.saveChanges')} 
                 </button>
             </div>
        </div>
    );
}