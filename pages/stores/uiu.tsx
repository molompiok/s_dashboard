// Components/StoreCreateEditForm/StoreCreateEditForm.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoreInterface } from '../../Interfaces/Interfaces';
import { useTranslation } from 'react-i18next';
import { useCheckStoreNameAvailability, useCreateStore, useUpdateStore, queryClient } from '../../api/ReactSublymusApi'; // Importer les hooks nécessaires
import logger from '../../api/Logger';
import { ApiError } from '../../api/SublymusApi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper/types';
import 'swiper/css'; // CSS de base Swiper

// Importer les composants des étapes (on les créera ensuite)
// import { StepName } from './Steps/StepName';
// import { StepLogo } from './Steps/StepLogo';
// import { StepCover } from './Steps/StepCover';
// import { StepInfo } from './Steps/StepInfo';
// Importer les composants de statut
// import { LoadingScreen } from './Screens/LoadingScreen';
// import { SuccessScreen } from './Screens/SuccessScreen';
// import { ErrorScreen } from './Screens/ErrorScreen';
// Importer les composants UI
// import { ProgressStepper } from './UI/ProgressStepper';
// import { NavigationButtons } from './UI/NavigationButtons';

// --- Types ---
type FormStep = 'name' | 'logo' | 'cover' | 'info';
const steps: FormStep[] = ['name', 'logo', 'cover', 'info'];

export type StoreFormData = {
    name: string;
    title: string;
    description: string;
    logoFile?: File | null; // Nouveau fichier logo
    coverFile?: File | null; // Nouveau fichier cover
    // Champs existants (pour comparaison et affichage preview)
    existingLogoUrl?: string | null;
    existingCoverUrl?: string | null;
};

type LoadingStateType = 'idle' | 'checkingName' | 'saving' | 'success' | 'error';

interface StoreCreateEditFormProps {
    initialStoreData?: Partial<StoreInterface>;
    onSaveSuccess: (store: StoreInterface) => void;
    onCancel: () => void; // Pour annuler complètement le processus
}

// --- Composant Principal ---
export function StoreCreateEditForm({ initialStoreData, onSaveSuccess, onCancel }: StoreCreateEditFormProps) {
    const { t } = useTranslation();
    const isEditing = !!initialStoreData?.id;

    // --- États ---
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingStateType>('idle');
    const [apiError, setApiError] = useState<string | null>(null);
    const [savedStore, setSavedStore] = useState<StoreInterface | null>(null); // Pour l'écran de succès

    // État du formulaire combiné
    const [formState, setFormState] = useState<Partial<StoreInterface>>(() => ({
        name: initialStoreData?.name ?? initialStoreData?.slug ?? '',
        title: initialStoreData?.title ?? '',
        description: initialStoreData?.description ?? '',
        logoFile: null,
        coverFile: null,
        existingLogoUrl: initialStoreData?.logo?.[0] ?? null,
        existingCoverUrl: initialStoreData?.cover_image?.[0] ?? null,
    }));

    // État spécifique à la validation du nom
    const [debouncedName, setDebouncedName] = useState(formState.name);
    const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null); // null = pas encore vérifié/changé
    const [nameValidationError, setNameValidationError] = useState<string | null>(null); // Erreur locale nom

    // --- Hooks API ---
    // Vérification nom (Query, car on récupère une info)
    const { isLoading: isCheckingName, isError: isNameCheckError, error: nameCheckError, data: nameAvailabilityData } = useCheckStoreNameAvailability(
        debouncedName, // Utiliser le nom débauncé
        {
            enabled: !!debouncedName && debouncedName.length >= 3 && // Activer si nom > 3 chars
                     loadingState === 'idle' && // Ne pas vérifier pendant sauvegarde
                     (!initialStoreData?.name || debouncedName !== initialStoreData.name), // Ne pas vérifier si c'est le nom initial en mode édition
            // retry: false, // Ne pas retenter automatiquement en cas d'erreur réseau?
            // staleTime: Infinity, // Le résultat ne change que si le nom change
        }
    );

    // Mutations Création/Update
    const createStoreMutation = useCreateStore();
    const updateStoreMutation = useUpdateStore();
    const isSaving = createStoreMutation.isPending || updateStoreMutation.isPending;

    // --- Effets ---

    // Debounce pour la vérification du nom
    useEffect(() => {
        // Ne pas débauncer si c'est le nom initial en mode édition
        if (isEditing && formState.name === initialStoreData?.name) {
            setIsNameAvailable(true); // Considérer comme valide s'il n'a pas changé
            setNameValidationError(null);
             setDebouncedName(formState.name); // S'assurer que debounced est à jour
            return;
        }
        // Reset validation si nom trop court ou vide
        if (!formState.name || formState.name.trim().length < 3) {
             setIsNameAvailable(null);
             setNameValidationError(formState.name ? t('storeCreateEdit.validation.nameMinLength') : null);
              setDebouncedName(formState.name); // Mettre à jour debounced même si invalide
             return;
        }
        // Appliquer debounce
        const handler = setTimeout(() => {
             setNameValidationError(null); // Clear erreur locale avant check API
             setDebouncedName(formState.name);
        }, 500); // Délai de 500ms
        return () => clearTimeout(handler);
    }, [formState.name, isEditing, initialStoreData?.name, t]);

    // Mettre à jour isNameAvailable quand les données API arrivent
    useEffect(() => {
        if (isCheckingName) {
             setLoadingState('checkingName');
             setIsNameAvailable(null); // En cours de vérification
        } else if(loadingState === 'checkingName') { // S'assurer qu'on sort bien de cet état
            setLoadingState('idle');
        }

        if (isNameCheckError) {
            logger.error({ error: nameCheckError }, "Name availability check failed");
             setNameValidationError(nameCheckError.message || t('api.networkError'));
             setIsNameAvailable(false); // Considérer invalide en cas d'erreur API
        } else if (nameAvailabilityData) {
             setIsNameAvailable(nameAvailabilityData.is_available_name);
             setNameValidationError(nameAvailabilityData.is_available_name ? null : t('storeCreateEdit.validation.nameTaken'));
        }
         // Ne pas remettre à null si debouncedName n'a pas changé et qu'on a déjà un résultat valide
         // (géré par la dépendance `nameAvailabilityData`)

    }, [isCheckingName, isNameCheckError, nameCheckError, nameAvailabilityData, t, loadingState]); // Ajouter loadingState


    // --- Handlers Formulaire ---
    const handleFormChange = useCallback((field: keyof StoreFormData, value: string | File | null) => {
         setFormState(prev => ({ ...prev, [field]: value }));
          // Reset l'erreur API générale si on modifie le formulaire
          if (loadingState === 'error') {
              setLoadingState('idle');
              setApiError(null);
          }
    }, [loadingState]);

     // --- Validation Globale (appelée avant sauvegarde) ---
     const validateAllSteps = (): boolean => {
         // Vérifier chaque étape (on pourrait avoir des fonctions de validation par étape)
         let isValid = true;
         const errors: { [key: string]: string } = {};

          // Étape Nom
          if (!formState.name || formState.name.trim().length < 3) {
              errors.name = t('storeCreateEdit.validation.nameRequired'); isValid = false;
          } else if (isNameAvailable === false) { // Vérifier aussi dispo API
               errors.name = t('storeCreateEdit.validation.nameTaken'); isValid = false;
          }
           // Étape Logo (requis si création?)
           if (!formState.logo?.[0]) {
               errors.logo = t('storeCreateEdit.validation.logoRequired'); isValid = false;
           }
            // Étape Cover (requis si création?)
           if (!formState.cover_image) {
                errors.cover = t('storeCreateEdit.validation.coverRequired'); isValid = false;
           }
           // Étape Info
           if (!formState.title || formState.title.trim().length < 3) {
               errors.title = t('storeCreateEdit.validation.titleRequired'); isValid = false;
           }
           if (!formState.description || formState.description.trim().length < 10) {
               errors.description = t('storeCreateEdit.validation.descriptionRequired'); isValid = false;
           }
            // TODO: Afficher ces erreurs spécifiques aux étapes
            logger.warn("Form validation errors:", errors);
            return isValid;
     };

    // --- Handlers Navigation & Sauvegarde ---
    const handleNext = () => {
        // TODO: Ajouter validation de l'étape courante avant de passer à la suivante
        swiperRef?.slideNext();
    };
    const handlePrev = () => swiperRef?.slidePrev();

    const handleSubmit = () => {
        if (!validateAllSteps()) {
            logger.warn("Submit prevented by form validation errors.");
            // TODO: Afficher une notification globale? Ou scroller vers la première erreur?
            return;
        }
        setLoadingState('saving');
        setApiError(null);

        if (isEditing && initialStoreData?.id) {
            // --- Mise à jour ---
             updateStoreMutation.mutate(
                 { store_id: initialStoreData.id, data:formState}, // Passer comme objet, l'API interne fera le FormData
                 // Ou si l'API attend vraiment FormData:
                 // { store_id: initialStoreData.id, formData: apiFormData },
                 {
                     onSuccess: (data) => {
                         setLoadingState('success');
                         setSavedStore(data.store); // Sauver pour écran succès
                         onSaveSuccess(data.store); // Appeler callback parent
                     },
                     onError: (error: ApiError) => {
                         setLoadingState('error');
                         setApiError(error.message || t('api.unknownError'));
                     }
                 }
             );
        } else {
            // --- Création ---
            if(!formState.name || !formState.title) return
            createStoreMutation.mutate(formState as any, {
                     onSuccess: (data) => {
                         setLoadingState('success');
                         setSavedStore(data.store);
                         onSaveSuccess(data.store);
                     },
                     onError: (error: ApiError) => {
                         setLoadingState('error');
                         setApiError(error.message || t('api.unknownError'));
                     }
                 }
             );
        }
    };

    // --- Rendu ---

    // Afficher écrans de statut si nécessaire
     if (loadingState === 'saving') return <div className="p-6 text-center text-gray-500">{t('common.saving')}...</div>; // Placeholder LoadingScreen
     if (loadingState === 'success' && savedStore) return <div className="p-6 text-center text-green-500">Succès! Store: {savedStore.name}</div>; // Placeholder SuccessScreen
     if (loadingState === 'error') return <div className="p-6 text-center text-red-500">Erreur: {apiError}</div>; // Placeholder ErrorScreen


    // Afficher le formulaire multi-étapes
    return (
        <div className="store-create-edit-form w-full max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-lg">
             <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 text-center">
                 {isEditing ? t('storeCreateEdit.editTitle') : t('storeCreateEdit.createTitle')}
             </h1>

            {/* Indicateur de Progression */}
             {/* <ProgressStepper currentStep={currentPageIndex} totalSteps={steps.length} onStepClick={(i) => swiperRef?.slideTo(i)} /> */}
              <div className="mb-6 text-center text-sm font-medium text-gray-500">
                  {t('storeCreateEdit.stepInfo', { current: currentPageIndex + 1, total: steps.length })} 
                  - {t(`storeCreateEdit.stepLabels.${steps[currentPageIndex]}`)} 
              </div>

            {/* Swiper pour les étapes */}
            <Swiper
                onSwiper={setSwiperRef}
                 onSlideChange={(s) => setCurrentPageIndex(s.activeIndex)}
                 allowTouchMove={false} // Empêcher swipe manuel
                 className="mb-6" // Marge basse avant boutons
                 autoHeight={true} // Ajuster hauteur à la slide
            >
                <SwiperSlide>
                    {/* Placeholder pour StepName */}
                    <div className="p-4 border rounded-md min-h-[200px]">Contenu Étape Nom</div>
                     {/* Passer formState, handleFormChange, isNameAvailable, nameValidationError etc. */}
                     {/* <StepName
                         formData={formState}
                         onChange={handleFormChange}
                         isAvailable={isNameAvailable}
                         validationError={nameValidationError}
                         isLoading={loadingState === 'checkingName'}
                     /> */}
                </SwiperSlide>
                <SwiperSlide>
                     {/* Placeholder pour StepLogo */}
                     <div className="p-4 border rounded-md min-h-[200px]">Contenu Étape Logo</div>
                     {/* Passer formState, handleFormChange (pour File) */}
                      {/* <StepLogo formData={formState} onChange={handleFormChange} /> */}
                 </SwiperSlide>
                 <SwiperSlide>
                      {/* Placeholder pour StepCover */}
                      <div className="p-4 border rounded-md min-h-[200px]">Contenu Étape Cover</div>
                       {/* Passer formState, handleFormChange (pour File) */}
                       {/* <StepCover formData={formState} onChange={handleFormChange} /> */}
                  </SwiperSlide>
                  <SwiperSlide>
                       {/* Placeholder pour StepInfo */}
                       <div className="p-4 border rounded-md min-h-[200px]">Contenu Étape Info</div>
                       {/* Passer formState, handleFormChange */}
                        {/* <StepInfo formData={formState} onChange={handleFormChange} /> */}
                  </SwiperSlide>
            </Swiper>

            {/* Boutons de Navigation */}
             {/* <NavigationButtons
                 onNext={handleNext}
                 onPrev={handlePrev}
                 // Déterminer si l'étape actuelle est valide pour activer "Suivant"
                 canNext={ isStepValid(currentPageIndex, formState, isNameAvailable) }
                 isFirstStep={currentPageIndex === 0}
                 isLastStep={currentPageIndex === steps.length - 1}
                 onSubmit={handleSubmit}
                 isLoading={isSaving}
                 onCancel={onCancel}
             /> */}
              <div className="flex justify-between mt-6">
                  <button type="button" onClick={currentPageIndex === 0 ? onCancel : handlePrev} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{currentPageIndex === 0 ? t('common.cancel') : t('pagination.previous')}</button>
                   <button type="button" onClick={currentPageIndex === steps.length - 1 ? handleSubmit : handleNext} disabled={isSaving /* || !isStepValid */} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? t('common.saving') : (currentPageIndex === steps.length - 1 ? (isEditing ? t('common.saveChanges') : t('common.create')) : t('pagination.next'))}</button>
              </div>
        </div>
    );
}

// --- Ajouter les composants Step..., LoadingScreen, SuccessScreen, ErrorScreen, ProgressStepper, NavigationButtons ---
// --- et les clés i18n ---
/*
{
 "storeCreateEdit": {
    "createTitle": "Créer votre Boutique",
    "editTitle": "Modifier la Boutique",
    "stepInfo": "Étape {{current}} sur {{total}}",
    "stepLabels": {
        "name": "Nom de la Boutique",
        "logo": "Logo",
        "cover": "Image de Couverture",
        "info": "Informations Générales"
    },
    "validation": {
        "nameMinLength": "Le nom doit faire au moins 3 caractères.",
        "nameTaken": "Ce nom de boutique est déjà pris.",
        "nameRequired": "Le nom de la boutique est requis.",
        "logoRequired": "Le logo est requis.",
        "coverRequired": "L'image de couverture est requise.",
        "titleRequired": "Le titre est requis (3 caractères min).",
        "descriptionRequired": "La description est requise (10 caractères min)."
    }
  }
 // ... garder les autres clés existantes
}
*/
