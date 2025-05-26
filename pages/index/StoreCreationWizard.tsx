// pages/stores/StoreCreationWizard.tsx
// import './CreateStore.css'; // ❌ Supprimer

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper/types';
import { Navigation } from 'swiper/modules'; // Utiliser Navigation standard
import { IoCheckmarkCircle, IoChevronBack, IoChevronForward, IoCloseCircle, IoPencil, IoWarning } from 'react-icons/io5';
import { useCheckStoreNameAvailability, useCreateStore, useUpdateStore } from '../../api/ReactSublymusApi'; // ✅ Hooks API
import { ApiError } from '../../api/SublymusApi'; // Pour typer erreur
import { StoreInterface } from '../../api/Interfaces/Interfaces'; // Types locaux
import { getImg } from '../../Components/Utils/StringFormater';
import { ClientCall, debounce, toNameString } from '../../Components/Utils/functions';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../api/Logger';

// Importer Swiper CSS (une fois dans l'app)
import 'swiper/css';
import 'swiper/css/navigation'; // Ajouter CSS Navigation
import { Server_Host } from '../../renderer/+config';

// --- Types locaux ---
type StepStatus = 'pending' | 'valid' | 'invalid' | 'checking';
type NameCheckResult = { type: StepStatus, message: string };
type LoadingStateType = 'idle' | 'checkingName' | 'saving' | 'success' | 'error';

// --- Composant Wizard ---
export function StoreCreationEditionWizard({
    initialStoreData = {}, // Pour pré-remplir si édition future?
    onSaveSuccess, // Callback succès
    onCancel,       // Callback annulation
    canCancel = true
}: {
    initialStoreData?: Partial<StoreInterface>
    onSaveSuccess: (store: Partial<StoreInterface>, mode: 'created' | 'updated') => void;
    onCancel?: () => void;
    canCancel?: boolean;
}) {
    const { t } = useTranslation(); // ✅ i18n
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [maxReachedIndex, setMaxReachedIndex] = useState(initialStoreData ? 3 : 0); // Index max atteint valablement

    const isEditing = !!initialStoreData?.id;


    const [loadingState, setLoadingState] = useState<LoadingStateType>('idle');
    const [apiError, setApiError] = useState<string | null>(null);
    const [savedStore, setSavedStore] = useState<StoreInterface | null>(null);

    const [s] = useState({
        collected: {} as StoreInterface
    })
    // --- État du Formulaire ---
    const [collected, setCollected] = useState({
        name: initialStoreData.name ?? '',
        logo: initialStoreData.logo ?? [] as (string | Blob)[],
        cover_image: initialStoreData.cover_image ?? [] as (string | Blob)[],
        description: initialStoreData.description ?? '',
        title: initialStoreData.title ?? '',
    });

    // --- États de Validation ---
    const [nameCheck, setNameCheck] = useState<NameCheckResult>({ type: 'pending', message: '' });
    const [isNameValid, setIsNameValid] = useState(false); // Pour bouton Suivant
    const [logoError, setLogoError] = useState('');
    const [coverError, setCoverError] = useState('');
    const [titleError, setTitleError] = useState('');
    const [descriptionError, setDescriptionError] = useState('');

    // --- Hooks API ---
    const [debouncedName, setDebouncedName] = useState(collected.name || '');
    let { data: availabilityData, isLoading: isCheckingName } = useCheckStoreNameAvailability(
        debouncedName.length >= 3 ? debouncedName : undefined, // Vérifier seulement si >= 3 chars
        { enabled: debouncedName.length >= 3 } // Activer seulement si nom assez long
    );

    if (!availabilityData) availabilityData = { is_available_name: false };
    availabilityData.is_available_name = isEditing && debouncedName == initialStoreData.name ? true : availabilityData.is_available_name

    const createStoreMutation = useCreateStore();
    const updateStoreMutation = useUpdateStore();

    // --- Refs pour focus ---
    const nameInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLInputElement>(null);

    // --- Debounce pour la vérification du nom ---
    useEffect(() => {
        if (isEditing && collected.name === initialStoreData?.name) {
            setIsNameValid(true);
            console.log('@@@@@@@@@@', collected.name);

            setNameCheck({ type: 'checking', message: t('storeCreate.validation.currentStoreName') });
            // setDebouncedName('');
            return;
        }
        if (collected.name.length < 3) {
            setNameCheck({ type: 'invalid', message: t('storeCreate.validation.nameMinLength') });
            setIsNameValid(false);
            setDebouncedName(''); // Ne pas vérifier si trop court
            return;
        }
        setNameCheck({ type: 'checking', message: t('storeCreate.validation.nameChecking') });
        setIsNameValid(false); // Invalide pendant la vérification
        const handler = debounce(() => {
            setDebouncedName(collected.name)
        }, 'store-name-check', 600);
        // return () => handler.cancel(); // Si debounce retourne cancel
    }, [collected.name, t, isEditing]);

    // --- Mettre à jour le message de disponibilité du nom ---
    useEffect(() => {
        if (isCheckingName || collected.name.length < 3) return; // Attendre fin du check ou nom valide

        if (availabilityData) {
            const isValid = availabilityData.is_available_name;
            setIsNameValid(isValid);
            setNameCheck({
                type: isValid ? 'valid' : 'invalid',
                message: t(isValid ? (collected.name == initialStoreData.name ? 'storeCreate.validation.currentStoreName' : 'storeCreate.validation.nameAvailable') : 'storeCreate.validation.nameUnavailable')
            });
            // Mettre à jour l'index max si le nom est valide à l'étape 0
            if (isValid && activeIndex === 0) {
                setMaxReachedIndex(prev => Math.max(prev, 1));
            } else if (!isValid && activeIndex === 0) {
                // Si devient invalide, bloquer la progression
                setMaxReachedIndex(prev => Math.min(prev, 0));
            }
        } else if (!isCheckingName && collected.name.length >= 3) {
            // Gérer l'erreur de fetch de disponibilité
            setNameCheck({ type: 'invalid', message: t('storeCreate.validation.nameCheckError') });
            setIsNameValid(false);
        }
    }, [availabilityData, isCheckingName, collected.name, activeIndex, t]);

    // --- Focus automatique sur les inputs ---
    useEffect(() => {
        // Ne pas focus si mutation en cours
        if (createStoreMutation.isPending) return;

        let elementToFocus: HTMLInputElement | null = null;
        if (activeIndex === 0) elementToFocus = nameInputRef.current;
        if (activeIndex === 3) elementToFocus = titleInputRef.current;
        // Ajouter focus sur description si besoin (mais c'est un input)

        // Utiliser setTimeout pour laisser le temps au slide de s'afficher
        if (elementToFocus) {
            const timer = setTimeout(() => elementToFocus?.focus(), 300);
            return () => clearTimeout(timer);
        }
    }, [activeIndex, createStoreMutation.isPending]);

    // --- Validation locale des étapes ---
    const validateStep = (indexToValidate: number): boolean => {
        switch (indexToValidate) {
            case 0: return isNameValid;
            case 1:
                const logoOk = collected.logo.length > 0;
                !logoOk && !logoError && setLogoError(logoOk ? '' : t('storeCreate.validation.logoRequired'));
                return logoOk;
            case 2:
                const coverOk = collected.cover_image.length > 0;
                !coverOk && !coverError && setCoverError(coverOk ? '' : t('storeCreate.validation.coverRequired'));
                return coverOk;
            case 3:
                const titleOk = collected.title.trim().length > 0;
                const descOk = collected.description.trim().length > 0;
                !titleOk && !titleError && setTitleError(titleOk ? '' : t('storeCreate.validation.titleRequired'));
                !descOk && !descriptionError && setDescriptionError(descOk ? '' : t('storeCreate.validation.descriptionRequired'));
                return titleOk && descOk;
            default: return false;
        }
    };

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue = value;
        // Appliquer toNameString seulement pour le champ 'name'
        if (name === 'name') {
            processedValue = toNameString(value).substring(0, 32);
        } else if (name === 'title') {
            processedValue = value.substring(0, 52); // Limiter titre
        } else if (name === 'description') {
            processedValue = value.substring(0, 128); // Limiter description
        }

        s.collected = { ...s.collected, [name]: processedValue }
        setCollected(prev => ({ ...prev, [name]: processedValue }));

        // Reset erreurs spécifiques au champ
        if (name === 'name') setNameCheck({ type: 'pending', message: '' }); // Reset check name
        if (name === 'title') setTitleError('');
        if (name === 'description') setDescriptionError('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'cover_image') => {
        const file = e.target.files?.[0];
        if (!file) return;
        s.collected = { ...s.collected, [field]: [file] }
        setCollected(prev => ({ ...prev, [field]: [file] })); // Remplacer par le nouveau fichier
        // Reset erreurs
        if (field === 'logo') setLogoError('');
        if (field === 'cover_image') setCoverError('');
        // Mettre à jour l'index max atteint si étape validée
        if (field === 'logo' && activeIndex === 1) setMaxReachedIndex(prev => Math.max(prev, 2));
        if (field === 'cover_image' && activeIndex === 2) setMaxReachedIndex(prev => Math.max(prev, 3));

        e.target.value = ''; // Permet de re-sélectionner le même fichier
    };

    const handleNext = (e: any) => {
        e.preventDefault()
        e.stopPropagation()
        if (activeIndex < 3) {
            if (validateStep(activeIndex)) {
                swiper?.slideNext();
            }
            return
        }

        const endTime = Date.now() + 4 * 1000
        if (isEditing && initialStoreData?.id) {

            console.log('Update', collected);
            setLoadingState('saving');
            // --- Mise à jour ---
            updateStoreMutation.mutate(
                { store_id: initialStoreData.id, data: s.collected },
                {
                    onSuccess: (data) => {
                        const time = endTime - Date.now();
                        setTimeout(() => {
                            setLoadingState('success');
                            setSavedStore(data.store);
                        }, time < 0 ? 0 : time);
                    },
                    onError: (error: ApiError) => {
                        const time = endTime - Date.now();
                        setTimeout(() => {
                            setLoadingState('error');
                            setApiError(error.message || t('api.unknownError'));
                        }, time < 0 ? 0 : time);

                    }
                }
            );
        } else {
            // --- Création ---
            console.log('Create', collected);

            setLoadingState('saving');
            createStoreMutation.mutate(collected as any, {
                onSuccess: (data) => {
                    const time = endTime - Date.now();
                    setTimeout(() => {
                        setLoadingState('success');
                        setSavedStore(data.store);
                    }, time < 0 ? 0 : time);

                },
                onError: (error: ApiError) => {
                    const time = endTime - Date.now();
                    setTimeout(() => {
                        setLoadingState('error');
                        setApiError(error.message || t('api.unknownError'));
                    }, time < 0 ? 0 : time);
                }
            }
            );
        }
    };

    const handleBack = (e: any) => {
        e.preventDefault()
        e.stopPropagation()
        if (activeIndex > 0) {
            swiper?.slidePrev();
        } else if (onCancel) {
            onCancel();
        }
    };

    // --- Préparation des URLs pour preview ---
    const getPreviewUrl = (fileOrUrl: string | Blob | undefined): string | undefined => {
        if (typeof fileOrUrl === 'string') return getImg(fileOrUrl, undefined, Server_Host).match(/url\("?([^"]+)"?\)/)?.[1];
        if (fileOrUrl instanceof File) return URL.createObjectURL(fileOrUrl);
        return undefined;
    };

    const logoPreview = useMemo(() => getPreviewUrl(collected.logo[0]), [collected.logo]);
    const coverPreview = useMemo(() => getPreviewUrl(collected.cover_image[0]), [collected.cover_image]);



    console.log({savedStore,loadingState});
    



    if (loadingState === 'saving') return <FeedbackOverlay
        status="saving"
        title="Sauvegarde en cours"
        message="Veuillez patienter pendant que nous enregistrons vos données."
    />
    if (loadingState === 'success' && savedStore) return <FeedbackOverlay
        status="success"
        title="Succès !"
        message="Votre formulaire a été enregistré avec succès."
        onSuccessRedirect={() => {
            swiper?.slideTo(0)
            onSaveSuccess(savedStore, isEditing ? 'updated' : 'created')
        }}
    />
    if (loadingState === 'error') return <FeedbackOverlay
        status="error"
        title="Une erreur est survenue"
        message="Impossible d’enregistrer le formulaire."
        onRetry={() => setLoadingState('idle')}
        onCancel={() => onCancel?.()}
    />



    // --- Rendu ---
    return (
        // Conteneur principal avec padding
        <div className="store-creation-wizard w-full h-full overflow-y-auto flex flex-col justify-center max-w-2xl m-auto p-4 sm:p-6">

            <div className="relative mb-6">
                <h1 className="text-2xl font-semibold text-center text-gray-800">
                    {isEditing ? t('storeCreateEdit.editTitle') : t('storeCreateEdit.createTitle')}
                </h1>
                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 px-3 bg-gray-50 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Barre de Progression */}
            {/* Utiliser flex, items-center, w-full, max-w-md mx-auto */}
            <div className="progress-store flex w-full max-w-md mx-auto items-center mb-8">
                {[t('storeCreate.stepName'), t('storeCreate.stepLogo'), t('storeCreate.stepCover'), t('storeCreate.stepInfo')].map((label, i) => (
                    <React.Fragment key={label}>
                        {/* Étape (Numéro + Label) */}
                        {/* Utiliser flex flex-col items-center ou juste div */}
                        <div
                            onClick={() => maxReachedIndex >= i && swiper?.slideTo(i)}
                            // Appliquer styles Tailwind conditionnels
                            className={`progress-step flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium relative ${activeIndex === i ? 'border-blue-600 bg-blue-600 text-white' :
                                maxReachedIndex >= i ? 'border-blue-300 bg-blue-50 text-blue-600 cursor-pointer hover:border-blue-500' :
                                    'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {maxReachedIndex >= i && isNameValid ? <IoCheckmarkCircle /> : (i + 1)} {/* Check si valide et atteint */}
                            {/* Label en dessous */}
                            <span className={`absolute top-full mt-1.5 text-xs text-center ${activeIndex === i ? 'text-blue-600 font-medium' : 'text-gray-500'} ${maxReachedIndex >= i ? '' : 'opacity-50'}`}>{label}</span>
                        </div>
                        {/* Ligne de connexion */}
                        {i < 3 && (
                            <span className={`progress-line flex-grow h-0.5 ${maxReachedIndex > i ? 'bg-blue-400' : 'bg-gray-300'}`}></span>
                        )}
                    </React.Fragment>
                ))}
            </div>


            {/* Swiper pour les étapes */}
            {/* Donner une hauteur fixe ou min-height pour éviter les sauts */}
            <div className="swiper-container h-[500px] relative "> {/* Hauteur ajustée */}
                <Swiper
                    onSwiper={setSwiper}
                    onActiveIndexChange={(s) => {
                        setActiveIndex(s.activeIndex);
                        // Valider l'étape précédente pour mettre à jour maxReachedIndex si on recule
                        if (s.previousIndex !== undefined && validateStep(s.previousIndex)) {
                            setMaxReachedIndex(prev => Math.max(prev, s.previousIndex + 1));
                        }
                    }}
                    className={`h-[500px] ${createStoreMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`} // Désactiver pendant la création
                    allowTouchMove={false} // Empêcher swipe manuel
                    modules={[Navigation]} // Seulement Navigation (contrôlée par boutons)
                // navigation // Cacher la navigation par défaut de Swiper
                >
                    {/* Slide 1: Nom */}
                    <SwiperSlide style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className='flex  w-full h-full items-center justify-center gap-6 px-4 text-center'>
                        <h2 className="text-lg font-medium text-gray-700">{t('storeCreate.stepNameTitle')}</h2>
                        <div className='w-full mx-auto max-w-sm flex flex-col items-center justify-center'>
                            <label htmlFor='input-store-name' className="sr-only">{t('storeCreate.nameLabel')}</label>
                            <input
                                ref={nameInputRef}
                                id='input-store-name'
                                name="name" // Pour le handler générique
                                type="text"
                                autoFocus
                                // Appliquer styles Tailwind pour input, y compris états validation
                                className={`w-full px-4 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${nameCheck.type === 'invalid' ? 'border-red-500 ring-red-300 focus:ring-red-500 focus:border-red-500' :
                                    nameCheck.type === 'valid' ? 'border-green-500 ring-green-300 focus:ring-green-500 focus:border-green-500' :
                                        'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                                placeholder={t('storeCreate.namePlaceholder')}
                                value={collected.name || ''}
                                onChange={handleInputChange}
                                onKeyUp={(e) => e.key === 'Enter' && isNameValid && swiper?.slideNext()}
                            />
                            <div className="w-full flex justify-between mt-1 px-1">
                                {/* Message de validation/disponibilité */}
                                <span className={`text-xs h-4 ${nameCheck.type === 'invalid' ? 'text-red-600' :
                                    nameCheck.type === 'valid' ? 'text-green-600' :
                                        'text-gray-500' // Pour 'pending' ou 'checking'
                                    }`}>
                                    {/* Afficher spinner si checking? */}
                                    {isCheckingName ? <span className='italic'>{t('storeCreate.validation.nameChecking')}...</span> : nameCheck.message}
                                </span>
                                {/* Compteur */}
                                <span className={`text-xs ${collected.name.length > 32 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {collected.name.length} / 32
                                </span>
                            </div>
                        </div>
                    </SwiperSlide>

                    {/* Slide 2: Logo */}
                    <SwiperSlide style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className='flex flex-col items-center justify-center gap-6 px-4 text-center'>
                        <h2 className="text-lg font-medium text-gray-700">{t('storeCreate.stepLogoTitle')}</h2>
                        {/* Composant AddLogo refactorisé */}
                        <label htmlFor='store-logo-input' className={`relative group w-40 h-40 sm:w-48 sm:h-48 rounded-full cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-gray-100 border-2 ${logoError ? 'border-red-400' : 'border-dashed border-gray-300'} hover:border-blue-400 hover:bg-gray-50`}>
                            <img
                                src={logoPreview || '/res/empty/drag-and-drop.png'} // Preview ou Placeholder
                                alt={t('storeCreate.logoLabel')}
                                className={`w-full h-full ${collected.logo.length > 0 ? 'object-contain p-2' : 'object-contain opacity-50'}`} // Contain et padding si logo
                                onError={(e) => (e.currentTarget.src = '/res/empty/drag-and-drop.png')} // Fallback si preview échoue
                            />
                            {/* Overlay au survol */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <IoPencil className="text-white w-8 h-8" />
                            </div>
                            <input id='store-logo-input' name="logo" style={{ display: 'none' }} type="file" accept='image/*' onChange={(e) => handleFileChange(e, 'logo')} />
                        </label>
                        {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
                        <p className="text-xs text-gray-500 px-4">{t('storeCreate.logoHelpText')}</p>
                    </SwiperSlide>

                    {/* Slide 3: Cover Image */}
                    <SwiperSlide className='flex h-full overflow-visible flex-col items-center justify-center gap-6 px-4 text-center'>
                        <h2 className="text-lg font-medium text-gray-700">{t('storeCreate.stepCoverTitle')}</h2>
                        <label htmlFor='store-cover_image-input' className={`relative  group w-full max-w-md aspect-video rounded-lg cursor-pointer overflow-hidden bg-gray-100 border-2 ${coverError ? 'border-red-400' : 'border-dashed border-gray-300'} hover:border-blue-400 hover:bg-gray-50`}>
                            <div
                                style={{ background: getImg(coverPreview || '/res/empty/drag-and-drop.png') }}
                                className={`relative mx-auto group w-full max-w-md aspect-video rounded-lg cursor-pointer overflow-hidden bg-gray-100 border-2 ${coverError ? 'border-red-400' : 'border-dashed border-gray-300'} hover:border-blue-400 hover:bg-gray-50  ${collected.cover_image.length > 0 ? 'object-cover' : 'object-contain opacity-50'} w-auto h-[70%]`}//className={` }`}
                                onError={(e) => (e.currentTarget.style.background = getImg('/res/empty/drag-and-drop.png'))}
                            >
                            </div>
                            <div className="absolute m-auto inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <IoPencil className="text-white w-10 h-10" />
                            </div>
                            <input id='store-cover_image-input' name="cover_image" style={{ display: 'none' }} type="file" accept='image/*' onChange={(e) => handleFileChange(e, 'cover_image')} />
                        </label>
                        {coverError && <p className="mt-1 text-xs text-red-600">{coverError}</p>}
                        <p className="text-xs text-gray-500 px-4">{t('storeCreate.coverHelpText')}</p>
                    </SwiperSlide>

                    {/* Slide 4: Infos (Titre, Description) */}
                    <SwiperSlide style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className='flex flex-col w-full h-full items-center justify-center gap-6 px-4 text-center'>
                        <h2 className="text-lg font-medium text-gray-700">{t('storeCreate.stepInfoTitle')}</h2>
                        <div className="w-full max-w-sm flex flex-col gap-4">
                            {/* Titre */}
                            <div>
                                <label htmlFor='input-store-title' className=' text-sm font-medium text-gray-700 mb-1 text-left flex justify-between items-center'>
                                    <span>{t('storeCreate.titleLabel')}</span>
                                    <span className={`text-xs ${collected.title.length > 52 ? 'text-red-600' : 'text-gray-400'}`}>{collected.title.length} / 52</span>
                                </label>
                                <input
                                    ref={titleInputRef}
                                    id='input-store-title'
                                    name="title"
                                    type="text"
                                    className={`block bg-gray-50 w-full px-4 rounded-md shadow-sm sm:text-sm h-10 ${titleError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    placeholder={t('storeCreate.titlePlaceholder')}
                                    value={collected.title || ''}
                                    onChange={handleInputChange}
                                    onKeyUp={(e) => e.key === 'Enter' && descriptionInputRef.current?.focus()}
                                />
                                {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
                            </div>
                            {/* Description */}
                            <div>
                                <label htmlFor='input-store-description' className=' text-sm font-medium text-gray-700 mb-1 text-left flex justify-between items-center'>
                                    <span>{t('storeCreate.descriptionLabel')}</span>
                                    <span className={`text-xs ${collected.description.length > 128 ? 'text-red-600' : 'text-gray-400'}`}>{collected.description.length} / 128</span>
                                </label>
                                <textarea // Utiliser textarea pour description plus longue
                                    ref={descriptionInputRef as any} // Type cast si ref est pour input
                                    id='input-store-description'
                                    name="description"
                                    className={`block bg-gray-50 p-4 w-full rounded-md shadow-sm sm:text-sm min-h-[80px] ${descriptionError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                    placeholder={t('storeCreate.descriptionPlaceholder')}
                                    value={collected.description || ''}
                                    onChange={handleInputChange}
                                />
                                {descriptionError && <p className="mt-1 text-xs text-red-600">{descriptionError}</p>}
                            </div>
                        </div>
                        {/* Google Preview (simplifié) */}
                        <div className="mt-4 w-full max-w-sm border border-gray-200 rounded-lg p-3 bg-gray-50 text-left">
                            <p className="text-xs text-gray-500 mb-2">{t('storeCreate.googlePreviewLabel')}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-cover bg-center bg-gray-300 flex-shrink-0" style={{ backgroundImage: logoPreview ? `url(${logoPreview})` : 'none' }}>
                                    {!logoPreview && <span className='text-gray-500 text-[10px] font-bold'>?</span>}
                                </div>
                                <div>
                                    <h3 className='text-sm font-medium text-blue-800 leading-tight'>{collected.title || t('storeCreate.previewDefaultTitle')}</h3>
                                    <p className='text-xs text-green-700 line-clamp-1'>{`https://${collected.name || 'votrenom'}.sublymus.com`}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{collected.description || t('storeCreate.previewDefaultDesc')}</p>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>


            <div className="direction flex justify-between items-center mt-8 w-full max-w-md mx-auto min-h-28">
                {/* Bouton Retour/Annuler */}
                <button
                    type="button"
                    onClick={handleBack}
                    // Cacher si première étape ET on ne peut pas annuler
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${(activeIndex === 0 && !canCancel) ? 'invisible' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <IoChevronBack />
                    {activeIndex === 0 && canCancel ? t('common.cancel') : t('common.back')}
                </button>
                {/* Bouton Suivant/Créer */}
                <button
                    type="button"
                    onClick={handleNext}
                    // Désactiver si étape invalide OU chargement
                    disabled={!validateStep(activeIndex) || createStoreMutation.isPending}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(!validateStep(activeIndex) || createStoreMutation.isPending) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {/* Afficher texte conditionnel */}
                    {createStoreMutation.isPending ? t('common.creating') : (activeIndex === 3 ? (isEditing ? t('common.saveChanges') : t('common.create')) : t('common.next'))}
                    <IoChevronForward />
                </button>
            </div>

        </div>
    );
}


import { Loader2, CheckCircle, XCircle } from "lucide-react"

type FeedbackStatus = "saving" | "error" | "success"

interface FeedbackOverlayProps {
    status: FeedbackStatus
    title: string
    message: string
    onRetry?: () => void
    onCancel?: () => void
    onSuccessRedirect?: () => void
}

export function FeedbackOverlay({
    status,
    title,
    message,
    onRetry,
    onCancel,
    onSuccessRedirect
}: FeedbackOverlayProps) {

    const text = 500
    const bg = 100
    const bgColor = {
        saving: "blue",
        success: "green",
        error: "red"
    }[status]

    const renderIcon = () => {
        const iconClass = `w-12 h-12 text-${bgColor}-${text} sx:w-8 sx:h-8`
        switch (status) {
            case "saving":
                return <Loader2 className={`${iconClass} animate-spin`} />
            case "success":
                return <CheckCircle className={iconClass} />
            case "error":
                return <XCircle className={iconClass} />
        }
    }



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white  rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col sx:flex-row items-center gap-6"
            onClick={(e)=>{
                if(e.target == e.currentTarget){
                    // action
                }
            }}>
                {/* Icône avec fond coloré */}
                <div className={`p-4 rounded-full  bg-${bgColor}-${bg}`}>
                    {renderIcon()}
                </div>

                {/* Trait vertical */}
                <div className="w-px h-6 sx:h-16 bg-gray-200" />

                {/* Contenu */}
                <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-1">{title}</h2>
                    <p className="text-sm text-gray-600 mb-4">{message}</p>

                    {/* Actions */}
                    {status === "error" && (
                        <div className="flex gap-2">

                            {onCancel && (
                                <button
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                    onClick={onCancel}
                                >
                                    Annuler
                                </button>
                            )}
                            {onRetry && (
                                <button
                                    className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
                                    onClick={onRetry}
                                >
                                    Réessayer
                                </button>
                            )}
                        </div>
                    )}

                    {status === "success" && (
                        <button
                            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                            onClick={onSuccessRedirect}
                        >
                            Aller au dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
