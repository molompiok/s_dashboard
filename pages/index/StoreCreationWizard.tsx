// pages/stores/StoreCreationWizard.tsx
// import './CreateStore.css'; // ❌ Supprimer

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper/types';
import { Navigation } from 'swiper/modules'; // Utiliser Navigation standard
import { IoCheckmarkCircle, IoChevronBack, IoChevronForward, IoCloseCircle, IoCloud, IoImage, IoImages, IoInformationCircle, IoPencil, IoSearch, IoStorefront, IoWarning } from 'react-icons/io5';
import { useCheckStoreNameAvailability, useCreateStore, useUpdateStore } from '../../api/ReactSublymusApi'; // ✅ Hooks API
import { ApiError } from '../../api/SublymusApi'; // Pour typer erreur
import { StoreInterface } from '../../api/Interfaces/Interfaces'; // Types locaux
import { getMedia } from '../../Components/Utils/StringFormater';
import { ClientCall, debounce, toNameString } from '../../Components/Utils/functions';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../api/Logger';

// Importer Swiper CSS (une fois dans l'app)
import 'swiper/css';
import 'swiper/css/navigation'; // Ajouter CSS Navigation

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

    const isEditing = !!initialStoreData?.id;


    const [loadingState, setLoadingState] = useState<LoadingStateType>('idle');
    const [tryInvalid, setTryInvalid] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [savedStore, setSavedStore] = useState<StoreInterface | null>(null);

    const [s] = useState({
        collected: {} as StoreInterface,
        init: false
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
    const [maxReachedIndex, setIndexError] = useState<number>(-1)
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
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

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
            validateStep(0)
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

    useEffect(() => {
        validateStep(activeIndex)
    }, [isNameValid, collected])
    // --- Validation locale des étapes ---
    const validateStep = (indexToValidate: number, validate = true): boolean => {
        console.log('=======> VALIDATION START index:', indexToValidate, 'validate:', validate);

        if (!isNameValid && (validate || indexToValidate == 0)) {
            validate && setIndexError(0);
            console.log('=======> VALIDATION END index:', indexToValidate, 'isValid:', false, 'error index:', 0);
            return false
        }
        const logoOk = collected.logo?.length > 0;
        tryInvalid && !logoOk && !logoError && setLogoError(logoOk ? '' : t('storeCreate.validation.logoRequired'));
        if (!logoOk && (validate || indexToValidate == 1)) {
            validate && setIndexError(1);
            console.log('=======> VALIDATION END index:', indexToValidate, 'isValid:', false, 'error index:', 1);
            return false
        }
        const coverOk = collected.cover_image?.length > 0;
        tryInvalid && !coverOk && !coverError && setCoverError(coverOk ? '' : t('storeCreate.validation.coverRequired'));
        if (!coverOk && (validate || indexToValidate == 2)) {
            validate && setIndexError(2);

            console.log('=======> VALIDATION END index:', indexToValidate, 'isValid:', false, 'error index:', 2);
            return false
        }
        const titleOk = collected.title.trim().length > 0;
        const descOk = collected.description.trim().length > 0;
        tryInvalid && !titleOk && !titleError && setTitleError(titleOk ? '' : t('storeCreate.validation.titleRequired'));
        tryInvalid && !descOk && !descriptionError && setDescriptionError(descOk ? '' : t('storeCreate.validation.descriptionRequired'));
        if (!(titleOk && descOk) && (validate || indexToValidate == 3)) {
            validate && setIndexError(3)
            console.log('=======> VALIDATION END index:', indexToValidate, 'isValid:', false, 'error index:', 3);
            return false
        }
        validate && setIndexError(3)
        console.log('=======> VALIDATION END index:', indexToValidate, 'validate:', validate, 'isValid:', true, 'error index:', -1);
        return true

    };

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue = value;
        // Appliquer toNameString seulement pour le champ 'name'
        if (name === 'name') {
            processedValue = toNameString(value).substring(0, 32);
        } else if (name === 'title') {
            processedValue = value.substring(0, 100); // Limiter titre
        } else if (name === 'description') {
            processedValue = value.substring(0, 500); // Limiter description
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
        e.target.value = ''; // Permet de re-sélectionner le même fichier
    };

    const handleNext = (e: any) => {
        e.preventDefault()
        e.stopPropagation()

        if (activeIndex < 3) {
            if (validateStep(activeIndex,false)) {
                swiper?.slideNext();
            }
            return
        }
        if (!validateStep(activeIndex)) {
            setActiveIndex(maxReachedIndex)
            swiper?.slideTo(maxReachedIndex)
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
        if (typeof fileOrUrl === 'string') return getMedia({ source: fileOrUrl, from: 'server' });
        if (fileOrUrl instanceof File) return URL.createObjectURL(fileOrUrl);
        return undefined;
    };

    const logoPreview = useMemo(() => getPreviewUrl(collected.logo[0]), [collected.logo]);
    const coverPreview = useMemo(() => getPreviewUrl(collected.cover_image[0]), [collected.cover_image]);



    console.log({ activeIndex, maxReachedIndex });




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
            setActiveIndex(0)
            swiper?.slideTo(0)
            onSaveSuccess(savedStore, isEditing ? 'updated' : 'created')
        }}
    />
    if (loadingState === 'error') return <FeedbackOverlay
        status="error"
        title="Une erreur est survenue"
        message="Impossible d’enregistrer le formulaire."
        onRetry={() => {
            setLoadingState('idle');
            setActiveIndex(0);
            swiper?.slideTo(0);
        }}
        onCancel={() => onCancel?.()}
    />

    const icons = [
        <div className="min-w-12 min-h-12 sl2:min-w-14 sl2:min-h-14 bg-green-500/20 dark:bg-green-400/20                                 rounded-full flex items-center justify-center mb-2">
            <IoStorefront className="w-6 h-6 sl2:w-7 sl2:h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
        </div>,
        <div className="min-w-12 min-h-12 sl2:min-w-14 sl2:min-h-14 bg-blue-500/20 dark:bg-blue-400/20 
                                          rounded-full flex items-center justify-center mb-2">
            <IoImage className="w-6 h-6 sl2:w-7 sl2:h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
        </div>,
        <div className="min-w-12 min-h-12 sl2:min-w-14 sl2:min-h-14 bg-purple-500/20 dark:bg-purple-400/20 
                                          rounded-full flex items-center justify-center mb-2">
            <IoImages className="w-6 h-6 sl2:w-7 sl2:h-7 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
        </div>,
        <div className="min-w-12 min-h-12 sl2:min-w-14 sl2:min-h-14 bg-green-500/20 dark:bg-green-400/20 
                                          rounded-full flex items-center justify-center mb-2">
            <IoInformationCircle className="w-6 h-6 sl2:w-7 sl2:h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
        </div>
    ]

    // --- Rendu ---
    return (
        // Conteneur principal avec backdrop transparent et responsive padding
        <div className="store-creation-wizard w-screen h-full overflow-x-hidden overflow-y-auto py-12 
                bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">

            <div className="store-creation-wizard w-screen  py-12 px-3 max-w-2xl mx-auto 
                bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">


                {/* Header avec titre et bouton fermer */}
                <div className="relative flex items-center  mb-4 sl2:mb-6">
                    {icons[activeIndex]}
                    <h1 className="text-lg ml-2 sl2:text-xl sm:text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
                        {isEditing ? t('storeCreate.editTitle') : t('storeCreate.mainTitle')}
                    </h1>
                    <button
                        type="button"
                        onClick={onCancel}
                        className=" ml-auto right-0 top-1/2 -translate-y-1/2  px-2 py-1  
                         bg-gray-200 dark:bg-gray-800/30 backdrop-blur-sm 
                         rounded-full hover:bg-gray-300 dark:hover:bg-gray-700/40 
                         text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100
                         transition-all duration-200 border border-white/10 dark:border-gray-600/20"
                    >
                        ✕
                    </button>
                </div>

                {/* Barre de Progression avec design amélioré */}
                <div className="progress-store flex w-full max-w-xs sl2:max-w-sm sm:max-w-md mx-auto items-center mb-6 sl2:mb-8">
                    {[t('storeCreate.stepName'), t('storeCreate.stepLogo'), t('storeCreate.stepCover'), t('storeCreate.stepInfo')].map((label, i) => (
                        <React.Fragment key={label}>
                            {/* Étape avec design glassmorphism */}
                            <div
                                onClick={() => maxReachedIndex >= i && swiper?.slideTo(i)}
                                className={`progress-step flex items-center justify-center 
                                  w-8 h-8 sl2:w-9 sl2:h-9 sm:w-10 sm:h-10 
                                  rounded-full border-2 text-xs sl2:text-sm font-medium relative 
                                  backdrop-blur-sm transition-all duration-300
                                  ${activeIndex === i
                                        ? 'border-green-500 bg-green-500/90 text-white shadow-lg shadow-green-500/25'
                                        : maxReachedIndex >= i
                                            ? 'border-green-300 dark:border-green-400 bg-white/20 dark:bg-gray-800/30 text-green-600 dark:text-green-400 cursor-pointer hover:border-green-500 dark:hover:border-green-300 hover:bg-white/30 dark:hover:bg-gray-700/40'
                                            : 'border-gray-300 dark:border-gray-600 bg-white/10 dark:bg-gray-800/20 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {maxReachedIndex >= i && isNameValid ? (
                                    <IoCheckmarkCircle className="w-4 h-4 sl2:w-5 sl2:h-5" />
                                ) : (
                                    <span className="text-xs sl2:text-sm">{i + 1}</span>
                                )}

                                {/* Label responsive */}
                                <span className={`absolute top-full mt-1 sl2:mt-1.5 text-[10px] sl2:text-xs text-center whitespace-nowrap
                                       ${activeIndex === i
                                        ? 'text-green-600 dark:text-green-400 font-medium'
                                        : 'text-gray-500 dark:text-gray-400'} 
                                       ${maxReachedIndex >= i ? '' : 'opacity-50'}
                                       hidden sx:block`}>
                                    {label}
                                </span>
                            </div>

                            {/* Ligne de connexion */}
                            {i < 3 && (
                                <span className={`progress-line flex-grow h-0.5 mx-1 sl2:mx-2 rounded-full
                                        ${maxReachedIndex > i
                                        ? 'bg-green-400/60 dark:bg-green-500/50'
                                        : 'bg-gray-300/50 dark:bg-gray-600/30'}`}>
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Swiper Container avec card glassmorphism */}
                <div className="swiper-container min-h-[400px] sl2:min-h-[450px] sm:h-[500px] relative mb-6">
                    <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-md rounded-xl sl2:rounded-2xl 
                          border border-white/20 dark:border-gray-700/30 p-2 sl2:p-4 h-full
                          shadow-xl shadow-black/5 dark:shadow-black/20">
                        <Swiper
                            onSwiper={setSwiper}
                            onActiveIndexChange={(s) => {
                                setActiveIndex(s.activeIndex);
                            }}
                            className={`h-full ${createStoreMutation.isPending ? 'opacity-50 pointer-events-none overflow-visible' : ''}`}
                            allowTouchMove={false}
                            modules={[Navigation]}
                        >
                            {/* Slide 1: Nom avec design amélioré */}
                            <SwiperSlide className="flex flex-col justify-center items-center h-full gap-4  sl2:gap-6 px-2 sl2:px-4 text-center">
                                <div className="flex flex-col items-center gap-2 sl2:gap-3">

                                    <h2 className="text-base sl2:text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                                        {t('storeCreate.stepNameTitle')}
                                    </h2>
                                    <p className="text-xs mt-4 sl2:text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                                        Choisissez un nom unique pour votre boutique
                                    </p>
                                </div>

                                <div className="w-full mt-4 mx-auto max-w-xs sl2:max-w-sm flex flex-col items-center">
                                    <label htmlFor="input-store-name" className="sr-only">{t('storeCreate.nameLabel')}</label>
                                    <input
                                        ref={nameInputRef}
                                        id="input-store-name"
                                        name="name"
                                        type="text"
                                        autoFocus
                                        className={`w-full px-3 sl2:px-4 py-2 sl2:py-3 
                                          bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm
                                          border rounded-lg sl2:rounded-xl shadow-sm 
                                          text-sm sl2:text-base placeholder-gray-500 dark:placeholder-gray-400
                                          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200
                                          ${nameCheck.type === 'invalid'
                                                ? 'border-red-400 dark:border-red-500 ring-red-300 dark:ring-red-400 focus:ring-red-400 focus:border-red-500'
                                                : nameCheck.type === 'valid'
                                                    ? 'border-green-400 dark:border-green-500 ring-green-300 dark:ring-green-400 focus:ring-green-400 focus:border-green-500'
                                                    : 'border-white/30 dark:border-gray-600/40 focus:border-green-400 dark:focus:border-green-500 focus:ring-green-400'
                                            }`}
                                        placeholder={t('storeCreate.namePlaceholder')}
                                        value={collected.name || ''}
                                        onChange={handleInputChange}
                                        onKeyUp={(e) => e.key === 'Enter' && isNameValid && swiper?.slideNext()}
                                    />

                                    <div className="w-full flex justify-between mt-2 px-1">
                                        <span className={`text-xs flex-1 ${nameCheck.type === 'invalid'
                                            ? 'text-red-500 dark:text-red-400'
                                            : nameCheck.type === 'valid'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-500 dark:text-gray-400'}`}>
                                            {isCheckingName ? (
                                                <span className="italic flex items-center gap-1">
                                                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                    {t('storeCreate.validation.nameChecking')}...
                                                </span>
                                            ) : nameCheck.message}
                                        </span>
                                        <span className={`text-xs font-medium ${collected.name.length > 32
                                            ? 'text-red-500 dark:text-red-400'
                                            : 'text-gray-400 dark:text-gray-500'}`}>
                                            {collected.name.length}/32
                                        </span>
                                    </div>
                                </div>
                            </SwiperSlide>

                            {/* Slide 2: Logo avec design moderne */}
                            <SwiperSlide className="flex flex-col justify-center items-center h-full gap-4 sl2:gap-6 px-2 sl2:px-4 text-center">
                                <div className="flex flex-col items-center gap-2 sl2:gap-3">

                                    <h2 className="text-base sl2:text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                                        {t('storeCreate.stepLogoTitle')}
                                    </h2>
                                    <p className="text-xs sl2:text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                                        Ajoutez un logo pour représenter votre marque
                                    </p>
                                </div>

                                <label htmlFor="store-logo-input"
                                    style={{ background: getMedia({ isBackground: true, source: logoPreview, from: 'server' }) }}
                                    className={`relative my-4 group cursor-pointer mx-auto flex flex-col items-center justify-center 
                                         w-32 h-32 sl2:w-36 sl2:h-36 sm:w-40 sm:h-40 
                                         rounded-full overflow-hidden transition-all duration-300
                                         bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm
                                         border-2 border-dashed hover:border-solid
                                         ${logoError
                                            ? 'border-red-400 dark:border-red-500'
                                            : 'border-white/30 dark:border-gray-600/40 hover:border-blue-400 dark:hover:border-blue-500'} 
                                         hover:bg-white/20 dark:hover:bg-gray-700/30`}>


                                    {
                                        (isEditing || logoPreview) ? <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent 
                                          flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="flex flex-col items-center gap-1 text-white">
                                                <IoPencil className="w-5 h-5 sl2:w-6 sl2:h-6" />
                                                <span className="text-xs font-medium">Modifier</span>
                                            </div>
                                        </div> : <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent 
                                          flex items-center justify-center ">
                                            <div className="flex flex-col items-center gap-1 text-white">
                                                <IoImage className="w-5 h-5 sl2:w-6 sl2:h-6" />
                                                <span className="text-xs font-medium">Ajouter</span>
                                            </div>
                                        </div>
                                    }
                                    <input id="store-logo-input" name="logo" type="file" accept="image/*" className="hidden"
                                        onChange={(e) => handleFileChange(e, 'logo')} />
                                </label>

                                {logoError && (
                                    <p className="text-xs text-red-500 dark:text-red-400  
                                         px-3 py-1">
                                        {logoError}
                                    </p>
                                )}

                                <p className="text-xs mx-auto text-gray-500 dark:text-gray-400 px-4 max-w-sm text-center leading-relaxed">
                                    {t('storeCreate.logoHelpText')}
                                </p>
                            </SwiperSlide>

                            {/* Slide 3: Cover Image avec design amélioré */}
                            <SwiperSlide className="flex flex-col justify-center items-center h-full gap-4 sl2:gap-6 px-2  text-center">
                                <div className="flex flex-col items-center gap-2 sl2:gap-3">

                                    <h2 className="text-base sl2:text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                                        {t('storeCreate.stepCoverTitle')}
                                    </h2>
                                    <p className="text-xs sl2:text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                                        Image de couverture de votre boutique
                                    </p>
                                </div>
                                <div className='mx-auto w-[1px] h-[20px] border-2 border-dashed hover:border-solid border-gray-600/40'></div>
                                <label htmlFor="store-cover_image-input"
                                    style={{ background: getMedia({ isBackground: true, size: 'cover', source: coverPreview, from: 'server' }) }}
                                    className={`relative group cursor-pointer mx-auto flex flex-col items-center justify-center 
                                         w-full aspect-video
                                          overflow-hidden transition-all duration-300
                                         bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm
                                         border-2 border-dashed hover:border-solid
                                         ${logoError
                                            ? 'border-red-400 dark:border-red-500'
                                            : 'border-gray-600/40  hover:border-blue-400 dark:hover:border-blue-500'} 
                                         hover:bg-white/20 dark:hover:bg-gray-700/30`}>



                                    {
                                        (isEditing || coverPreview) ? <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent 
                                          flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="flex flex-col items-center gap-1 text-white">
                                                <IoPencil className="w-5 h-5 sl2:w-6 sl2:h-6" />
                                                <span className="text-xs font-medium">Modifier</span>
                                            </div>
                                        </div> : <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent 
                                          flex items-center justify-center ">
                                            <div className="flex flex-col items-center gap-1 text-white">
                                                <IoImage className="w-5 h-5 sl2:w-6 sl2:h-6" />
                                                <span className="text-xs font-medium">Ajouter</span>
                                            </div>
                                        </div>
                                    }
                                    <input id="store-cover_image-input" name="cover_image" type="file" accept="image/*" className="hidden"
                                        onChange={(e) => handleFileChange(e, 'cover_image')} />
                                </label>
                                <div className='mx-auto w-[1px] h-[20px] border-2 border-dashed hover:border-solid border-gray-600/40'></div>
                                {coverError && (
                                    <p className="text-xs text-red-500 dark:text-red-400 
                                         px-3 py-1">
                                        {coverError}
                                    </p>
                                )}

                                <p className="mx-auto text-xs text-gray-500 dark:text-gray-400 px-4 max-w-sm text-center leading-relaxed">
                                    {t('storeCreate.coverHelpText')}
                                </p>
                            </SwiperSlide>

                            {/* Slide 4: Infos avec design moderne */}
                            <SwiperSlide className="flex flex-col justify-center items-center h-full gap-4 sl2:gap-6 px-2 sl2:px-4 text-center overflow-y-auto">
                                <div className="flex flex-col items-center gap-2 sl2:gap-3">

                                    <h2 className="text-base sl2:text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                                        {t('storeCreate.stepInfoTitle')}
                                    </h2>
                                </div>

                                <div className="w-full max-w-xs sl2:max-w-sm flex flex-col gap-3 sl2:gap-4">
                                    {/* Titre */}
                                    <div>
                                        <label htmlFor="input-store-title"
                                            className="flex justify-between items-center text-xs sl2:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            <span>{t('storeCreate.titleLabel')}</span>
                                            <span className={`text-xs ${collected.title.length > 100
                                                ? 'text-red-500 dark:text-red-400'
                                                : 'text-gray-400 dark:text-gray-500'}`}>
                                                {collected.title.length}/100
                                            </span>
                                        </label>
                                        <input
                                            ref={titleInputRef}
                                            id="input-store-title"
                                            name="title"
                                            type="text"
                                            className={`block w-full px-3 sl2:px-4 py-2 sl2:py-3 
                                              bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm
                                              rounded-lg sl2:rounded-xl border text-sm sl2:text-base
                                              placeholder-gray-500 dark:placeholder-gray-400
                                              focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200
                                              ${titleError
                                                    ? 'border-red-400 dark:border-red-500 focus:ring-red-400 focus:border-red-500'
                                                    : 'border-white/30 dark:border-gray-600/40 focus:border-green-400 dark:focus:border-green-500 focus:ring-green-400'}`}
                                            placeholder={t('storeCreate.titlePlaceholder')}
                                            value={collected.title || ''}
                                            onChange={handleInputChange}
                                            onKeyUp={(e) => e.key === 'Enter' && descriptionInputRef.current?.focus()}
                                        />
                                        {titleError && (
                                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{titleError}</p>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="input-store-description"
                                            className="flex justify-between items-center text-xs sl2:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            <span>{t('storeCreate.descriptionLabel')}</span>
                                            <span className={`text-xs ${collected.description.length > 500
                                                ? 'text-red-500 dark:text-red-400'
                                                : 'text-gray-400 dark:text-gray-500'}`}>
                                                {collected.description.length}/500
                                            </span>
                                        </label>
                                        <textarea
                                            ref={descriptionInputRef}
                                            id="input-store-description"
                                            name="description"
                                            rows={3}
                                            className={`block w-full px-3 sl2:px-4 py-2 sl2:py-3 
                                              bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm
                                              rounded-lg sl2:rounded-xl border text-sm sl2:text-base
                                              placeholder-gray-500 dark:placeholder-gray-400 resize-none
                                              focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200
                                              ${descriptionError
                                                    ? 'border-red-400 dark:border-red-500 focus:ring-red-400 focus:border-red-500'
                                                    : 'border-white/30 dark:border-gray-600/40 focus:border-green-400 dark:focus:border-green-500 focus:ring-green-400'}`}
                                            placeholder={t('storeCreate.descriptionPlaceholder')}
                                            value={collected.description || ''}
                                            onChange={handleInputChange}
                                        />
                                        {descriptionError && (
                                            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{descriptionError}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Google Preview avec design amélioré */}
                                <div className="mt-4 w-full max-w-xs sl2:max-w-sm 
                                      bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm
                                      border border-white/30 dark:border-gray-600/40 
                                      rounded-lg sl2:rounded-xl p-3 sl2:p-4 text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                        <IoSearch className="w-3 h-3" />
                                        {t('storeCreate.googlePreviewLabel')}
                                    </p>
                                    <div className="flex items-start gap-2 sl2:gap-3">
                                        <div className="w-10 h-10 sl2:w-12 sl2:h-12 rounded-full bg-cover bg-center 
                                              bg-white/20 dark:bg-gray-700/30 flex-shrink-0 flex items-center justify-center
                                              border border-white/20 dark:border-gray-600/30"
                                            style={{ background: getMedia({isBackground:true,source:logoPreview,from:'server'}) }}>
                                            {!logoPreview && (
                                                <IoStorefront className="w-4 h-4 sl2:w-5 sl2:h-5 text-gray-400 dark:text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs sl2:text-sm font-medium text-blue-700 dark:text-blue-400 leading-tight truncate">
                                                {collected.title || t('storeCreate.previewDefaultTitle')}
                                            </h3>
                                            <p className="text-xs text-green-700 dark:text-green-400 truncate">
                                                https://{collected.name.replaceAll(' ','-').toLowerCase() || 'votrenom'}.sublymus.com
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                                        {collected.description || t('storeCreate.previewDefaultDesc')}
                                    </p>
                                </div>
                            </SwiperSlide>
                        </Swiper>
                    </div>
                </div>

                {/* Boutons de navigation avec design moderne */}
                <div className="flex justify-between items-center w-full max-w-xs sl2:max-w-sm sm:max-w-md mx-auto">
                    {/* Bouton Retour/Annuler */}
                    <button
                        type="button"
                        onClick={handleBack}
                        className={`inline-flex items-center gap-1 sl2:gap-1.5 px-3 sl2:px-4 py-2 sl2:py-2.5 
                          rounded-lg sl2:rounded-xl text-xs sl2:text-sm font-medium 
                          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0
                          ${(activeIndex === 0 && !canCancel)
                                ? 'invisible'
                                : 'bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-white/30 dark:border-gray-600/40 hover:bg-white/30 dark:hover:bg-gray-700/40 focus:ring-gray-400'
                            }`}
                    >
                        <IoChevronBack className="w-3 h-3 sl2:w-4 sl2:h-4" />
                        {activeIndex === 0 && canCancel ? t('common.cancel') : t('common.back')}
                    </button>

                    {/* Bouton Suivant/Créer */}
                    <button
                        type="button"
                        onClick={handleNext}
                        className={`inline-flex items-center gap-1 sl2:gap-1.5 px-2 sl2:px-3 py-2 sl2:py-2.5 
                          rounded-lg sl2:rounded-xl text-xs sl2:text-sm font-medium 
                          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0
                          ${(!validateStep(activeIndex, false) || createStoreMutation.isPending)
                                ? 'bg-gray-300/50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-300/30 dark:border-gray-600/20'
                                : 'bg-green-500/90 dark:bg-green-600/90 text-white hover:bg-green-600 dark:hover:bg-green-500 focus:ring-green-400 shadow-lg shadow-green-500/25 dark:shadow-green-600/20'
                            }`}
                    >
                        {/* Afficher texte conditionnel */}
                        {createStoreMutation.isPending ? t('common.creating') : (activeIndex === 3 ? (isEditing ? t('common.saveChanges') : t('common.create')) : t('common.next'))}
                        <IoChevronForward className='min-w-3 min-h-3' />
                    </button>
                </div>

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
                onClick={(e) => {
                    if (e.target == e.currentTarget) {
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
