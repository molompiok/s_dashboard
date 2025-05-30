// pages/category/@id/+Page.tsx (Adapter le nom si c'est un fichier unique pour new/edit)

// --- Imports ---
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePageContext } from '../../../renderer/usePageContext';
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { useGetCategory, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../api/ReactSublymusApi'; // ✅ Hooks API
import { CategoryInterface, FilterType } from '../../../api/Interfaces/Interfaces';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { IoAdd, IoBagHandle, IoCloudUploadOutline, IoLayers, IoPencil, IoTrash } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import { FaRedo } from 'react-icons/fa';
import { getMedia } from '../../../Components/Utils/StringFormater';
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
import { ClientCall, debounce, limit } from '../../../Components/Utils/functions'; // Gardé
import { useMyLocation } from '../../../Hooks/useRepalceState'; // Gardé
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { ApiError } from '../../../api/SublymusApi'; // Importer ApiError
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { VisibilityControl } from '../../../Components/Controls/VisibilityControl';
import { CreateControl } from '../../../Components/Controls/CreateControl';
import { showErrorToast, showToast } from '../../../Components/Utils/toastNotifications';
import { CategoryFormSkeleton } from '../../../Components/Skeletons/allsKeletons';

export { Page };

const DEBOUNCE_CATEGORY_ID = 'debounce:save:category'
const DEBOUNCE_CATEGORY_TIME = 2000

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
    const { currentStore } = useGlobalStore();
    const { params, myLocation, replaceLocation } = useMyLocation()
    const categoryIdFromRoute = params[1];
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
    const [isVisibilityUpdating, changeVisibilityUpdating] = useState(false);


    const [s] = useState({
        collected: {} as Partial<CategoryInterface>,
        isUpdated: false,
    });
    // --- Récupération des données pour l'édition ---
    const {
        data: fetchedCategoryData, // Renommer pour éviter conflit
        isLoading: isLoadingCategory,
        isError: isFetchError,
        error: fetchError,
        isSuccess: isFetchSuccess,
    } = useGetCategory(
        {
            with_product_count: true,
            category_id: isNewCategory ? undefined : categoryIdFromRoute
        }, // Fetch seulement si ce n'est pas 'new'
        { enabled: !isNewCategory && !!currentStore } // Activer si édition et store chargé
    );

    // Initialiser le formulaire quand les données sont chargées (mode édition)
    useEffect(() => {
        if (!isNewCategory && isFetchSuccess && fetchedCategoryData) {
            setCategoryFormState(fetchedCategoryData);
            setOriginalCategoryData(fetchedCategoryData); // Sauver l'original
            setLocalImagePreviews({}); // Reset previews locales
            setFieldErrors({}); // Reset erreurs
        }
        // Si on navigue vers /new après avoir été sur une page d'édition
        if (isNewCategory) {
            setCategoryFormState(initialEmptyCategory);
            setOriginalCategoryData(null);
            setLocalImagePreviews({});
            setFieldErrors({});
            isFilledCategory(false)
        }
    }, [isNewCategory, isFetchSuccess, fetchedCategoryData]);

    // --- Mutations API ---
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const isLoadingMutation = createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending;

    const updateLocalCategory = (cb: (current: Partial<CategoryInterface>) => Partial<CategoryInterface>) => {
        setCategoryFormState((current) => {
            const d = cb({});
            s.collected = { ...s.collected, ...d }
            s.isUpdated = true;
            const c = { ...current, ...d };
            return c
        });
    }


    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateLocalCategory(prev => ({ ...prev, [name]: value.substring(0, 52) }));
    };

    const handleMarkdownChange = (value: string) => {
        updateLocalCategory(prev => ({ ...prev, description: value }));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'view' | 'icon') => {
        const files = e.target.files;
        if (!files?.[0]) return;
        const file = files[0];
        // console.log({ file });

        const previewUrl = URL.createObjectURL(file);

        updateLocalCategory(prev => ({ ...prev, [field]: [file] })); // Stocker l'objet File
        setLocalImagePreviews(prev => ({ ...prev, [field]: previewUrl })); // Stocker l'URL de preview locale
        // Révoquer l'ancienne URL de preview si elle existe, après un délai pour laisser l'UI mettre à jour
        const oldPreview = localImagePreviews[field];
        if (oldPreview) {
            setTimeout(() => URL.revokeObjectURL(oldPreview), 100);
        }
        // Nettoyer l'input file pour permettre de re-sélectionner le même fichier
        e.target.value = '';
    };

    const handleParentCategorySelect = (selectedCategory: CategoryInterface) => {
        updateLocalCategory(prev => ({ ...prev, parent_category_id: selectedCategory.id }));
        openChild(null); // Fermer la popup
    };

    const handleRemoveParent = () => {
        updateLocalCategory(prev => ({ ...prev, parent_category_id: 'null' }));
    };
    const handleVisibility = (is_visible: boolean) => {
        changeVisibilityUpdating(true)
        updateLocalCategory(prev => ({ ...prev, is_visible }));
    }
    const handleDelete = () => {
        if (!categoryFormState.id || isNewCategory || isLoadingMutation) return;
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('category.confirmDeleteTitle', { name: categoryFormState.name })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteCategoryMutation.mutate(
                            {
                                category_id: categoryFormState.id!,
                            },
                            {
                                onSuccess: () => {
                                    console.log(`Category ${categoryFormState.id} deleted`);
                                    openChild(null);
                                    setCategoryFormState({});
                                    showToast('Catégorie supprimée avec succès', 'WARNING'); // ✅ Toast succès
                                },
                                onError: (error) => {
                                    console.log({ error }, `Failed to delete category ${categoryFormState.id}`);
                                    openChild(null);
                                    showErrorToast(error); // ✅ Toast erreur
                                },
                            }
                        );
                    }}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };
    // --- Validation Locale Simple (avant envoi API) ---
    const isFilledCategory = (validate = true): boolean => {
        const errors: { [key: string]: string } = {};

        if (!categoryFormState.name || categoryFormState.name.trim().length < 3) {
            errors.name = t('category.validation.nameRequired'); // Nouvelle clé
        }
        const viewValue = categoryFormState.view?.[0];
        if (!viewValue) {
            errors.view = t('category.validation.viewRequired'); // Nouvelle clé
        }
        // Vérifier présence image ICON
        const iconValue = categoryFormState.icon?.[0];
        if (!iconValue) {
            errors.icon = t('category.validation.iconRequired'); // Nouvelle clé
        }


        const e: any = errors
        const hasError = Object.keys(errors).length > 0;
        if (!validate) {
            for (const k of Object.keys(errors)) {
                e[k] = ''
            }
        }
        setFieldErrors(e)
        return !hasError
    };

    const createCategory = async () => {
        if (!isFilledCategory()) return

        createCategoryMutation.mutate(
            {
                data: categoryFormState,
            },
            {
                onSuccess: (data) => {
                    console.log("Category created successfully", data);
                    setCategoryFormState(data.category);
                    setOriginalCategoryData(data.category);
                    setLocalImagePreviews({});
                    setFieldErrors({});
                    replaceLocation(`/categories/${data.category.id}`);
                    showToast('Catégorie créée avec succès'); // ✅ Par défaut, type SUCCESS
                },
                onError: (error) => {
                    console.log({ error }, "Category creation failed");
                    showErrorToast(error); // ✅ Toast d'erreur
                },
            }
        );
    }

    // --- Sauvegarde Manuelle / Création ---
    const hasCollected = () => {
        const a = { ...s.collected };
        delete a.id
        const k = Object.keys(a) as (keyof typeof a)[];
        for (const e of k) {
            if (a[e] == undefined) delete a[e]
        }
        return Object.keys(a).length > 0
    }
    const saveRequired = async () => {
        if (isLoadingMutation) return; // Empêcher double clic
        if (!isFilledCategory()) return console.log("Manual save prevented by validation errors.");
        if (isNewCategory) return

        const c = s.collected
        s.collected = {}
        updateCategoryMutation.mutate(
            {
                data: c,
                category_id: categoryIdFromRoute,
            },
            {
                onSuccess: (data) => {
                    if (!data.category?.id) return;

                    console.log("Category updated successfully", data);

                    setOriginalCategoryData(data.category);

                    if (hasCollected()) {
                        debounce(() => {
                            saveRequired();
                        }, DEBOUNCE_CATEGORY_ID, DEBOUNCE_CATEGORY_TIME);
                        return;
                    }

                    setCategoryFormState(data.category);
                    setLocalImagePreviews({});
                    setFieldErrors({});

                    debounce(() => showToast('Catégorie mise à jour avec succès'), 'category-success-update', 5000)// ✅ Toast succès
                },
                onError: (error) => {
                    console.log({ error }, "Category update failed");
                    showErrorToast(error); // ❌ Toast erreur
                },
                onSettled(){
                    changeVisibilityUpdating(false)
                }
            }
        );
    };

    useEffect(() => {
        !isNewCategory && s.isUpdated && (() => {
            s.isUpdated = false
            debounce(() => {
                saveRequired()
            }, DEBOUNCE_CATEGORY_ID, DEBOUNCE_CATEGORY_TIME)
        })()
        isFilledCategory(!isNewCategory)
    }, [categoryFormState])

    useEffect(() => {
        if (!currentStore) return
        if (!isNewCategory) {
            console.log('RELOAD DATA REQUIRED');
            return
        }
    }, [currentStore])



    const categoryName = categoryFormState?.name;

    // Construire les breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        const crumbs: BreadcrumbItem[] = [
            { name: t('navigation.home'), url: '/' },
            // Lien vers la liste principale des catégories
            { name: t('navigation.categories'), url: '/categories' },
        ];
        if (isNewCategory) {
            crumbs.push({ name: t('category.createBreadcrumb') });
        } else if (categoryName) {
            crumbs.push({ name: limit(categoryName, 30) });
        } else {
            crumbs.push({ name: t('common.loading') });
        }
        return crumbs;
    }, [t, isNewCategory, categoryName]);

    const [isPageLoading, setIsPageLoading] = useState(true);
    useEffect(() => {
        setIsPageLoading(false)
    }, []);

    if (!isNewCategory && isPageLoading) return <CategoryFormSkeleton />;
    if (!isNewCategory && isLoadingCategory) return <CategoryFormSkeleton />;  // Loader pleine page
    if (!isNewCategory && isFetchError) return <PageNotFound />
    if (!isNewCategory && !fetchedCategoryData?.id) return <PageNotFound />

    // Préparer les URLs d'image pour l'affichage (locale ou depuis serveur)
    const viewUrl = localImagePreviews.view ? getMedia({ isBackground: true, source: localImagePreviews.view }) : getMedia({ isBackground: true, source: categoryFormState.view?.[0], from: 'api' });
    const iconUrl = localImagePreviews.icon ? getMedia({ isBackground: true, source: localImagePreviews.icon }) : getMedia({ isBackground: true, source: categoryFormState.icon?.[0], from: 'api' });
    const showViewPlaceholder = !localImagePreviews.view && (!categoryFormState.view || categoryFormState.view.length === 0);
    const showIconPlaceholder = !localImagePreviews.icon && (!categoryFormState.icon || categoryFormState.icon.length === 0);

    const hasError = Object.keys(fieldErrors).length > 0

    // console.log(categoryFormState, viewUrl);

    return (
        // Layout principal
        <div className="w-full flex flex-col min-h-screen">
            <Topbar back={true} breadcrumbs={breadcrumbs} />
            {/* Utiliser max-w-2xl ou 3xl pour page formulaire, gap-4 ou 6 */}
            <main className="w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 pb-24"> {/* Ajouter pb-24 pour espace bouton flottant */}

                <h1 className="text-2xl font-semibold text-gray-900">
                    {isNewCategory ? t('category.createTitle') : t('category.editTitle', { name: originalCategoryData?.name || '...' })}
                </h1>

                <div>
                    <label className=' text-sm font-medium text-gray-700 mb-1 flex  items-center' htmlFor='chose-category-view'>
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
                        <label className='text-sm font-medium text-gray-700 mb-1  flex  items-center' htmlFor='chose-category-icon'>
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
                    <label className='text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-category-name'>
                        <span>{t('category.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                        <span className={`text-xs ${(categoryFormState.name?.trim()?.length || 0) > 255 ? 'text-red-600' : 'text-gray-400'}`}>
                            {(categoryFormState.name?.trim()?.length || 0)} / 52
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
                    <label className='text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-category-description'>
                        <span>{t('category.descriptionLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                        <span className={`text-xs ${(categoryFormState.description?.trim()?.length || 0) > 500 ? 'text-red-600' : 'text-gray-400'}`}>
                            {(categoryFormState.description?.trim()?.length || 0)} / 500
                        </span>
                    </label>
                    {/* Utiliser l'éditeur Markdown */}
                    <MarkdownEditor2
                        value={categoryFormState.description || ''}
                        setValue={(value) => {
                            console.log({ value });
                            const v = value.trim().substring(0,500)
                            v && handleMarkdownChange(v)
                        }}
                        error={!!fieldErrors.description} // Passer l'état d'erreur
                    />
                    {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
                </div>

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
                        {(categoryFormState.parent_category_id && categoryFormState.parent_category_id !== 'null') && (
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
                        isLoading={isVisibilityUpdating}
                        t={t}
                    />
                )}
                {
                    isNewCategory && <CreateControl
                        onCancel={() => {
                            history.back();
                        }}
                        onCreate={() => {
                            createCategory()
                        }}
                        canCreate={!hasError}
                        t={t}
                        title={t('product.createTitle')}
                        isLoading={isLoadingMutation}
                    />
                }
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

            {/* Flottant LOADING */}
            <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50 transition-opacity duration-300 ${isLoadingMutation || isNewCategory ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {isLoadingMutation}
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
