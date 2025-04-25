// pages/category/@id/+Page.tsx (Adapter le nom si c'est un fichier unique pour new/edit)

// --- Imports ---
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePageContext } from '../../../renderer/usePageContext';
import { useStore } from '../../stores/StoreStore';
import { useGetCategoryById, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../api/ReactSublymusApi'; // ✅ Hooks API
import { CategoryInterface, FilterType } from '../../../Interfaces/Interfaces';
import { Topbar } from '../../../Components/TopBar/TopBar';
import { IoAdd, IoBagHandle, IoCloudUploadOutline, IoLayers, IoPencil, IoTrash } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import { FaRedo } from 'react-icons/fa';
import { getImg } from '../../../Components/Utils/StringFormater';
import { useApp } from '../../../renderer/AppStore/UseApp'; // Gardé pour openChild
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'; // Utiliser le hook
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup'; // Gardé pour sélection parent
import { CategoryItemMini } from '../../../Components/CategoryItem/CategoryItemMini'; // Utiliser Mini pour parent
import { SaveButton } from '../../../Components/SaveButton/SaveButton'; // Gardé
import { Button } from '../../../Components/Button/Button'; // Gardé
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete'; // Gardé
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound'; // Gardé
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor'; // Gardé
import { Indicator } from '../../../Components/Indicator/Indicator'; // Gardé
import { ProductList } from '../../../Components/ProductList/ProductList'; // Gardé
import { ClientCall, debounce } from '../../../Components/Utils/functions'; // Gardé
import { useMyLocation } from '../../../Hooks/useRepalceState'; // Gardé
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../../api/Logger'; // Logger
import { ApiError } from '../../../api/SublymusApi'; // Importer ApiError
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { VisibilityControl } from '../../../Components/Button/VisibilityControl';

export { Page };

// État initial vide pour une nouvelle catégorie
const initialEmptyCategory: Partial<CategoryInterface> = {
    name: '',
    description: '',
    parent_category_id: undefined,
    view: [],
    icon: [],
};

function Page() {
    const { t } = useTranslation(); // ✅ i18n
    const { openChild } = useChildViewer();
    const { currentStore } = useStore();
    const { routeParams } = usePageContext();

    const categoryIdFromRoute = routeParams?.['id'];
    const isNewCategory = categoryIdFromRoute === 'new';

    // --- Gestion de l'état du formulaire ---
    const [categoryFormState, setCategoryFormState] = useState<Partial<CategoryInterface>>(
        isNewCategory ? initialEmptyCategory : {} // Commencer vide si édition (sera rempli par fetch)
    );
    // Stocker les données originales pour comparaison (détection des changements)
    const [originalCategoryData, setOriginalCategoryData] = useState<Partial<CategoryInterface> | null>(null);
    // État pour les previews d'images locales
    const [localImagePreviews, setLocalImagePreviews] = useState<{ view?: string; icon?: string }>({});
    // État pour les erreurs de validation par champ
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    // État pour l'auto-save (non actif par défaut)
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    // --- Récupération des données pour l'édition ---
    const {
        data: fetchedCategoryData, // Renommer pour éviter conflit
        isLoading: isLoadingCategory,
        isError: isFetchError,
        error: fetchError,
        isSuccess: isFetchSuccess,
    } = useGetCategoryById(
        isNewCategory ? undefined : categoryIdFromRoute, // Fetch seulement si ce n'est pas 'new'
        { enabled: !isNewCategory && !!currentStore } // Activer si édition et store chargé
    );

    // Initialiser le formulaire quand les données sont chargées (mode édition)
    useEffect(() => {
        if (!isNewCategory && isFetchSuccess && fetchedCategoryData) {
            setCategoryFormState(fetchedCategoryData);
            setOriginalCategoryData(fetchedCategoryData); // Sauver l'original
            setLocalImagePreviews({}); // Reset previews locales
            setFieldErrors({}); // Reset erreurs
            setIsAutoSaving(false); // Désactiver auto-save au chargement
        }
        // Si on navigue vers /new après avoir été sur une page d'édition
        if (isNewCategory) {
            setCategoryFormState(initialEmptyCategory);
            setOriginalCategoryData(null);
            setLocalImagePreviews({});
            setFieldErrors({});
            setIsAutoSaving(false);
        }
    }, [isNewCategory, isFetchSuccess, fetchedCategoryData]); // Ajouter categoryIdFromRoute comme dépendance

    // --- Mutations API ---
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory(); // Supposons qu'il existe

    const isLoadingMutation = createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending;

    // --- Détection des changements ---
    const hasChanges = useMemo(() => {
        if (isNewCategory || !originalCategoryData) return true; // Toujours considéré comme modifié si nouveau
        // Comparaison simple (à affiner si besoin avec deep-equal)
        // Comparer seulement les champs modifiables
        const modifiableFields: (keyof CategoryInterface)[] = ['name', 'description', 'parent_category_id', 'view', 'icon', 'is_visible'];
        for (const key of modifiableFields) {
            // Gérer la comparaison des tableaux (images) - comparer les refs ou le contenu?
            // Pour les fichiers, comparer les objets File peut être complexe.
            // On peut simplement vérifier si categoryFormState[key] a été défini (contient un objet File ou une nouvelle string)
            if (key === 'view' || key === 'icon') {
                if (Array.isArray(categoryFormState[key]) && categoryFormState[key]?.length > 0 && !(typeof categoryFormState[key]?.[0] === 'string')) {
                    return true; // Nouveau fichier Blob/File = changement
                }
                // Comparer les URLs string si pas de nouveau fichier
                if (JSON.stringify(categoryFormState[key]) !== JSON.stringify(originalCategoryData[key])) return true;

            } else if (categoryFormState[key] !== originalCategoryData[key]) {
                // Gérer le cas où '' et null doivent être considérés comme égaux pour parent_id?
                if (key === 'parent_category_id' && (!categoryFormState[key] && !originalCategoryData[key])) continue;
                return true;
            }
        }
        return false;
    }, [categoryFormState, originalCategoryData, isNewCategory]);


    // --- Validation Locale Simple (avant envoi API) ---
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};
        let isValid = true;

        if (!categoryFormState.name || categoryFormState.name.trim().length < 3) {
            errors.name = t('category.validation.nameRequired'); // Nouvelle clé
            isValid = false;
        }
        // Description optionnelle (pas de validation de longueur min ici)

        // Vérifier présence image VIEW (soit URL existante, soit nouveau fichier)
        const viewValue = categoryFormState.view?.[0];
        if (!viewValue) {
            errors.view = t('category.validation.viewRequired'); // Nouvelle clé
            isValid = false;
        }
        // Vérifier présence image ICON
        const iconValue = categoryFormState.icon?.[0];
        if (!iconValue) {
            errors.icon = t('category.validation.iconRequired'); // Nouvelle clé
            isValid = false;
        }

        // setFieldErrors(errors);
        // Focus sur le premier champ en erreur (optionnel)
        if (!isValid) {
            const firstErrorKey = Object.keys(errors)[0];
            const element = ClientCall(function name() {
                return document.getElementById(`input-category-${firstErrorKey}`)
            }, null); // Assigner des IDs aux inputs
            element?.focus();
        }
        return isValid;
    };

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCategoryFormState(prev => ({ ...prev, [name]: value }));
        setFieldErrors(prev => ({ ...prev, [name]: '' })); // Reset erreur du champ
        setIsAutoSaving(true); // Activer auto-save au changement
    };

    const handleMarkdownChange = (value: string) => {
        setCategoryFormState(prev => ({ ...prev, description: value }));
        setFieldErrors(prev => ({ ...prev, description: '' }));
        setIsAutoSaving(true);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'view' | 'icon') => {
        const files = e.target.files;
        if (!files?.[0]) return;
        const file = files[0];
        const previewUrl = URL.createObjectURL(file);

        setCategoryFormState(prev => ({ ...prev, [field]: [file] })); // Stocker l'objet File
        setLocalImagePreviews(prev => ({ ...prev, [field]: previewUrl })); // Stocker l'URL de preview locale
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
        setIsAutoSaving(true);

        // Révoquer l'ancienne URL de preview si elle existe, après un délai pour laisser l'UI mettre à jour
        const oldPreview = localImagePreviews[field];
        if (oldPreview) {
            setTimeout(() => URL.revokeObjectURL(oldPreview), 100);
        }
        // Nettoyer l'input file pour permettre de re-sélectionner le même fichier
        e.target.value = '';
    };

    const handleParentCategorySelect = (selectedCategory: CategoryInterface) => {
        setCategoryFormState(prev => ({ ...prev, parent_category_id: selectedCategory.id }));
        setIsAutoSaving(true);
        openChild(null); // Fermer la popup
    };

    const handleRemoveParent = () => {
        setCategoryFormState(prev => ({ ...prev, parent_category_id: null }));
        setIsAutoSaving(true);
    };

    // --- Auto Save ---
    useEffect(() => {
        // Ne pas auto-save si nouveau, pas de changements, ou si une mutation est en cours
        if (isNewCategory || !hasChanges || !isAutoSaving || isLoadingMutation) return;

        const handler = debounce(() => {
            logger.debug("Triggering auto-save...");
            if (validateForm()) { // Valider avant auto-save
                handleSave(true); // true pour indiquer auto-save
            } else {
                logger.warn("Auto-save skipped due to validation errors.");
            }
        }, 'category-auto-save', 3000); // Déclencher 3s après le dernier changement

        return () => {
            // Nettoyer le debounce si le composant est démonté ou si les dépendances changent
            // (Normalement, debounce gère déjà ça en interne si implémenté correctement)
        };
    }, [hasChanges, isAutoSaving, isNewCategory, isLoadingMutation]); // Surveiller l'état du formulaire


    // --- Sauvegarde Manuelle / Création ---
    const handleSave = async (isAuto = false) => {
        if (isLoadingMutation) return; // Empêcher double clic
        if (!validateForm()) {
            logger.warn("Manual save prevented by validation errors.");
            return; // Arrêter si validation échoue
        }
        setIsAutoSaving(false); // Désactiver auto-save pendant sauvegarde manuelle

        // Construire FormData
        const formData = new FormData();
        let hasFileChanges = false;

        // Ajouter les champs texte/numériques modifiés ou tous si nouvelle catégorie
        Object.entries(categoryFormState).forEach(([key, value]) => {
            if (key !== 'view' && key !== 'icon' && key !== 'id') { // Exclure fichiers et id pour l'instant
                if (isNewCategory || value !== originalCategoryData?.[key as keyof CategoryInterface]) {
                    // Gérer null pour parent_category_id
                    if (value !== null && value !== undefined) {
                        formData.append(key, String(value));
                    } else if (key === 'parent_category_id') {
                        formData.append(key, ''); // Envoyer string vide pour null? Ou ne pas envoyer? API doit gérer.
                    }
                }
            }
        });

        // Ajouter les fichiers SEULEMENT s'ils ont changé (objet File)
        (['view', 'icon'] as const).forEach(key => {
            const file = categoryFormState[key]?.[0];
            if (file && file instanceof File) {
                formData.append(`${key}_0`, file); // Nom attendu par createFiles/updateFiles
                formData.append(key, JSON.stringify([`${key}_0`])); // Pseudo URL
                hasFileChanges = true;
            } else if (originalCategoryData && categoryFormState[key] !== originalCategoryData[key]) {
                // Si l'URL a changé (ex: suppression d'image sans ajout de nouvelle)
                // Envoyer un tableau vide ou la nouvelle URL si c'est juste une string
                formData.append(key, JSON.stringify(categoryFormState[key] ?? []));
            }
        });

        // Choisir la mutation
        if (isNewCategory) {
            // Création
            createCategoryMutation.mutate(formData, {
                onSuccess: (data) => {
                    logger.info("Category created successfully", data);
                    setCategoryFormState(data.category); // Mettre à jour avec données serveur
                    setOriginalCategoryData(data.category);
                    setLocalImagePreviews({});
                    setFieldErrors({});
                    history.replaceState(null, "", `/categories/${data.category.id}`);
                    // Afficher toast succès
                },
                onError: (error) => {
                    logger.error({ error }, "Category creation failed");
                    // Afficher toast erreur
                }
            });
        } else {
            // Mise à jour (seulement si changements détectés, même si bouton cliqué)
            if (!hasChanges && !isAuto) {
                logger.info("Update skipped, no changes detected.");
                // Afficher toast "Aucune modification" ?
                return;
            }
            if (!categoryFormState.id) {
                logger.error("Cannot update category without ID");
                return; // Sécurité
            }
            formData.append('category_id', categoryFormState.id); // Ajouter l'ID pour l'update
            updateCategoryMutation.mutate(formData, {
                onSuccess: (data) => {
                    logger.info("Category updated successfully", data);
                    // Mettre à jour l'original pour refléter la sauvegarde
                    setCategoryFormState(data.category); // Mettre à jour avec données serveur
                    setOriginalCategoryData(data.category);
                    setLocalImagePreviews({}); // Les previews ne sont plus utiles
                    setFieldErrors({});
                    // Si c'était un auto-save, ne pas forcément afficher de toast
                    if (!isAuto) {
                        // Afficher toast succès
                    }
                },
                onError: (error) => {
                    logger.error({ error }, "Category update failed");
                    // Afficher toast erreur
                },
                onSettled: () => {
                    // Réactiver auto-save après la fin de la requête (succès ou erreur)
                    // Sauf si c'était un auto-save qui a échoué? À affiner.
                    // setIsAutoSaving(true);
                }
            });
        }
    };
    const handleVisibility = (is_visible: boolean) => {
        setCategoryFormState(prev => ({ ...prev, is_visible }));
        setIsAutoSaving(true);
    }
    const handleDelete = () => {
        if (!categoryFormState.id || isNewCategory || isLoadingMutation) return;
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('category.confirmDeleteTitle', { name: categoryFormState.name })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteCategoryMutation.mutate(categoryFormState.id!, {
                            onSuccess: () => {
                                logger.info(`Category ${categoryFormState.id} deleted`);
                                openChild(null);
                                // Rediriger vers la liste des catégories
                                ClientCall(() => { window.location.href = '/categories'; });
                            },
                            onError: (error) => {
                                logger.error({ error }, `Failed to delete category ${categoryFormState.id}`);
                                openChild(null);
                                // Afficher toast erreur
                            }
                        });
                    }}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };

    console.log({ categoryIdFromRoute, isNewCategory, currentStore, isFetchError, isLoadingCategory, categoryFormState });

    // --- Affichage ---
    // Afficher PageNotFound si erreur de fetch en mode édition
    if (!isNewCategory && isFetchError && fetchError?.status === 404) {
        return <PageNotFound title={'option 1'} description={fetchError.message} />;
    }
    // Afficher un loader global pendant le chargement initial en mode édition
    if (!isNewCategory && isLoadingCategory) {
        return <div className="w-full min-h-screen flex items-center justify-center"><span className='text-gray-500'>{t('common.loading')}</span></div>; // Loader pleine page
    }
    // Si on est en mode édition mais que la catégorie n'a pas été trouvée (autre erreur 404 gérée ci-dessus)
    if (!isNewCategory && !isLoadingCategory && !categoryFormState.id) {
        return <PageNotFound title={'option 2'} description={t('category.loadError')} />;
    }

    // Préparer les URLs d'image pour l'affichage (locale ou depuis serveur)
    const viewUrl = localImagePreviews.view ?? (typeof categoryFormState.view?.[0] === 'string' ? getImg(categoryFormState.view[0], undefined, currentStore?.url) : '');
    const iconUrl = localImagePreviews.icon ?? (typeof categoryFormState.icon?.[0] === 'string' ? getImg(categoryFormState.icon[0], 'contain', currentStore?.url) : '');
    const showViewPlaceholder = !localImagePreviews.view && (!categoryFormState.view || categoryFormState.view.length === 0);
    const showIconPlaceholder = !localImagePreviews.icon && (!categoryFormState.icon || categoryFormState.icon.length === 0);




    return (
        // Layout principal
        <div className="w-full flex flex-col bg-gray-50 min-h-screen">
            <Topbar back={true} />
            {/* Utiliser max-w-2xl ou 3xl pour page formulaire, gap-4 ou 6 */}
            <main className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 pb-24"> {/* Ajouter pb-24 pour espace bouton flottant */}

                <h1 className="text-2xl font-semibold text-gray-900">
                    {isNewCategory ? t('category.createTitle') : t('category.editTitle', { name: originalCategoryData?.name || '...' })}
                </h1>

                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1 flex  items-center' htmlFor='chose-category-view'>
                        {t('category.coverImageLabel')} <Indicator title={t('category.coverImageTooltipTitle')} description={t('category.coverImageTooltipDesc')} />
                    </label>
                    {/* Utiliser aspect-video ou aspect-[16/9] ? Ou 3/1? */}
                    <label htmlFor='chose-category-view' className={`relative block w-full aspect-[3/1] rounded-lg cursor-pointer overflow-hidden group bg-gray-100 border ${fieldErrors.view ? 'border-red-500' : 'border-gray-300'} ${!showViewPlaceholder ? 'hover:opacity-90' : 'hover:bg-gray-200'}`}>
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-opacity duration-150"
                            style={{ background: viewUrl }}
                        ></div>
                        {/* Placeholder / Icône Upload */}
                        {showViewPlaceholder && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500">
                                <IoCloudUploadOutline size={40} />
                                <span className="mt-1 text-xs">{t('category.selectImagePrompt')}</span>
                            </div>
                        )}
                        {/* Bouton Edit flottant (si image existe) */}
                        {!showViewPlaceholder && (
                            <div className="absolute bottom-2 right-2 p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow text-gray-600 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RiImageEditFill size={18} />
                            </div>
                        )}
                        <input id='chose-category-view' name="view" type="file" accept='image/*' className="sr-only" onChange={(e) => handleFileChange(e, 'view')} />
                    </label>
                    {fieldErrors.view && <p className="mt-1 text-xs text-red-600">{fieldErrors.view}</p>}
                </div>

                {/* Section Icône et Stats */}
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Icône */}
                    <div className='flex-shrink-0'>
                        <label className='block text-sm font-medium text-gray-700 mb-1  flex  items-center' htmlFor='chose-category-icon'>
                            {t('category.iconLabel')} <Indicator title={t('category.iconTooltipTitle')} description={t('category.iconTooltipDesc')} />
                        </label>
                        <label htmlFor='chose-category-icon' className={`relative block w-36 h-36 rounded-lg cursor-pointer overflow-hidden group bg-gray-100 border ${fieldErrors.icon ? 'border-red-500' : 'border-gray-300'} ${!showIconPlaceholder ? 'hover:opacity-90' : 'hover:bg-gray-200'}`}>
                            <div
                                className="absolute inset-0 bg-contain bg-center bg-no-repeat" // Contain pour icône
                                style={{ background: iconUrl }}
                            ></div>
                            {showIconPlaceholder && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 p-2 text-center">
                                    <IoCloudUploadOutline size={32} />
                                    <span className="mt-1 text-xs">{t('category.selectIconPrompt')}</span>
                                </div>
                            )}
                            {!showIconPlaceholder && (
                                <div className="absolute bottom-1 right-1 p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow text-gray-600 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <RiImageEditFill size={16} />
                                </div>
                            )}
                            <input id='chose-category-icon' name="icon" type="file" accept='image/*' className="sr-only" onChange={(e) => handleFileChange(e, 'icon')} />
                        </label>
                        {fieldErrors.icon && <p className="mt-1 text-xs text-red-600">{fieldErrors.icon}</p>}
                    </div>

                    {/* Stats (mode édition seulement) */}
                    {!isNewCategory && categoryFormState.id && (
                        <div className="stats flex-grow pt-6"> {/* pt-6 pour aligner avec le haut de l'input nom */}
                            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('category.performanceData')}</h3>
                            {/* Utiliser flex flex-col gap-1.5 */}
                            <div className='flex flex-col gap-1.5'>
                                <h2 className='flex items-center gap-2 text-sm text-gray-700'><IoBagHandle className='w-4 h-4 text-gray-400' /> {t('dashboard.products')}: <span className='font-medium text-gray-900'>{categoryFormState.product_count ?? 0}</span></h2>
                                {/* Ajouter stats commandes et sous-catégories si API les fournit */}
                                {/* <h2 className='flex items-center gap-2 text-sm text-gray-700'><IoCart className='w-4 h-4 text-gray-400' /> Commandes: <span className='font-medium text-gray-900'>{0}</span></h2> */}
                                {/* <h2 className='flex items-center gap-2 text-sm text-gray-700'><IoApps className='w-4 h-4 text-gray-400' /> Sous Catégories: <span className='font-medium text-gray-900'>{0}</span></h2> */}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nom Catégorie */}
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-category-name'>
                        <span>{t('category.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                        <span className={`text-xs ${(categoryFormState.name?.trim()?.length || 0) > 255 ? 'text-red-600' : 'text-gray-400'}`}>
                            {(categoryFormState.name?.trim()?.length || 0)} / 255
                        </span>
                    </label>
                    <input
                        id='input-category-name'
                        name="name" // Important pour handleInputChange
                        className={`p-2.5 px-4 block w-full rounded-md shadow-sm sm:text-sm ${fieldErrors.name ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                        type="text"
                        value={categoryFormState.name || ''}
                        placeholder={t('category.namePlaceholder')}
                        onChange={handleInputChange}
                    // onKeyUp, onKeyDown si nécessaire
                    />
                    {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                </div>

                {/* Description Catégorie */}
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-category-description'>
                        <span>{t('category.descriptionLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                        <span className={`text-xs ${(categoryFormState.description?.trim()?.length || 0) > 1000 ? 'text-red-600' : 'text-gray-400'}`}>
                            {(categoryFormState.description?.trim()?.length || 0)} / 1000
                        </span>
                    </label>
                    {/* Utiliser l'éditeur Markdown */}
                    <MarkdownEditor2
                        value={categoryFormState.description || ''}
                        setValue={handleMarkdownChange}
                        error={!!fieldErrors.description} // Passer l'état d'erreur
                    />
                    {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
                </div>

                {/* Sélection Catégorie Parent */}
                <div>
                    <h3 className="block text-sm font-medium text-gray-700 mb-2">
                        {t('category.parentCategoryLabel')} <span className='text-gray-400 text-xs'>({t('common.optionalField')})</span>
                    </h3>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Bouton Choisir/Remplacer */}
                        <ParentCategoryButton
                            categoryFormState={categoryFormState}
                            openChild={openChild}
                            ChildViewer={ChildViewer}
                            CategoriesPopup={CategoriesPopup}
                            handleParentCategorySelect={handleParentCategorySelect}
                            t={t}
                        />
                        {/* Affichage du parent sélectionné */}
                        {categoryFormState.parent_category_id && (
                            <CategoryItemMini
                                openCategory
                                category_id={categoryFormState.parent_category_id}
                                onDelete={handleRemoveParent} // Permettre de supprimer le parent
                                hoverEffect={false}

                            />
                        )}
                    </div>
                </div>

                {/* Section Actions Basse (Supprimer, etc. en mode édition) */}
                {!isNewCategory && categoryFormState.id && (
                    <VisibilityControl
                        isVisible={!!originalCategoryData?.is_visible}
                        title={t('product.visibilityTitle')}
                        onSetVisibility={handleVisibility}
                        onDeleteRequired={handleDelete} // Utilise la fonction simulée
                        isLoading={false}
                        t={t}
                    />
                )}
                {!isNewCategory && categoryFormState.id && (
                    <ProductList
                        title={t('category.categoryProducts')}
                        addTo={{
                            category_id: categoryFormState.id,
                            text: t('category.addProductToCategory')
                        }}
                        baseFilter={{
                            categories_id: [categoryFormState.id]
                        }} />
                )}

            </main>

            {/* Bouton Sauvegarde Flottant */}
            <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50 transition-opacity duration-300 ${hasChanges || isNewCategory ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <SaveButton
                    loading={isLoadingMutation}
                    // Différencier le titre et le style
                    title={isNewCategory
                        ? (validateForm() ? t('category.createButtonValid') : t('category.createButtonInvalid'))
                        : (hasChanges
                            ? (validateForm() ? t('category.saveButtonValid') : t('category.saveButtonInvalid'))
                            : t('category.noChangesButton')
                        )
                    }
                    // Le bouton est cliquable seulement si valide (pour création) ou si changements valides (pour MAJ)
                    required={validateForm() && (isNewCategory || hasChanges)}
                    onClick={() => handleSave(false)} // false = sauvegarde manuelle
                    // Adapter l'effet/couleur
                    effect="color" // Garder l'effet couleur
                // Utiliser des classes pour le style conditionnel? Moins facile avec les gradients.
                // style={isNewCategory ? { background: 'linear-gradient(...)' } : undefined}
                />
            </div>


        </div>
    );
}


function ParentCategoryButton({ categoryFormState, openChild, ChildViewer, CategoriesPopup, handleParentCategorySelect, t }: any) {

    const hasParent = !!categoryFormState.parent_category_id;

    const handleOpenPopup = () => {
        openChild(
            <ChildViewer title={t('category.selectParentTitle')}>
                <CategoriesPopup
                    ignore={[categoryFormState?.id || 'new']}
                    onSelected={handleParentCategorySelect}
                />
            </ChildViewer>,
            { background: '#3455' } // Attention: cette couleur peut ne pas être valide, vérifiez le format attendu par openChild
        );
    };

    return (
        <button
            type="button"
            onClick={handleOpenPopup}
            // Applique les classes conditionnellement en fonction de la présence d'un parent
            className={`transition flex ${hasParent
                // --- Style CARRÉ pour "Remplacer" ---
                ? 'flex-col items-center justify-center p-2 w-20 h-20 rounded-md hover:bg-gray-100 text-gray-700 gap-1 text-center' // w-20 h-20 pour carré (ajustez si besoin), pas de bordure/bg par défaut, flex-col, gap
                // --- Style RECTANGLE original pour "Sélectionner" ---
                : 'items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
            // Ajout d'un aria-label pour l'accessibilité, surtout pour le bouton carré
            aria-label={hasParent ? t('category.replaceParentButton') : t('category.selectParentButton')}
        >
            {hasParent ? (
                // --- Contenu pour "Remplacer" (Icône + Texte) ---
                <>
                    {/* Wrapper pour l'icône avec fond léger et rond */}
                    <span className="flex items-center justify-center p-2 bg-blue-100 rounded-full text-blue-600 mb-1"> {/* bg léger, texte bleu pur, rond, padding, marge basse */}
                        <FaRedo size={14} /> {/* Icône Remplacer */}
                    </span>
                    {/* Texte pour "Remplacer" */}
                    <span className="text-xs font-medium"> {/* Taille de texte plus petite pour s'adapter */}
                        {t('category.replaceParentButton')}
                    </span>
                </>
            ) : (
                // --- Contenu original pour "Sélectionner" ---
                <>
                    <IoAdd size={16} /> {/* Icône Ajouter */}
                    <span> {/* Garder le span pour la cohérence si besoin, ou juste le texte */}
                        {t('category.selectParentButton')}
                    </span>
                </>
            )}
        </button>
    );
}
