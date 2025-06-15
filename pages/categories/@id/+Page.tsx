// pages/category/@id/+Page.tsx

// --- Imports ---
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContext } from '../../../renderer/usePageContext';
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { useGetCategory, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../api/ReactSublymusApi';
import { CategoryInterface } from '../../../api/Interfaces/Interfaces';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { IoAdd, IoBagHandle, IoCloudUploadOutline, IoLayers, IoPencil, IoTrash, IoWarningOutline, IoBanOutline } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import { FaRedo } from 'react-icons/fa';
import { getMedia } from '../../../Components/Utils/StringFormater';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup';
import { CategoryItemMini } from '../../../Components/CategoryItem/CategoryItemMini';
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete';
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor';
import { Indicator } from '../../../Components/Indicator/Indicator';
import { ProductList } from '../../../Components/ProductList/ProductList';
import { debounce, limit } from '../../../Components/Utils/functions';
import { useMyLocation } from '../../../Hooks/useRepalceState';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { VisibilityControl } from '../../../Components/Controls/VisibilityControl';
import { CreateControl } from '../../../Components/Controls/CreateControl';
import { showErrorToast, showToast } from '../../../Components/Utils/toastNotifications';
// 🎨 Imports pour les états
import { CategoryFormSkeleton } from '../../../Components/Skeletons/allsKeletons';
import { StateDisplay } from '../../../Components/StateDisplay/StateDisplay';

export { Page };

const DEBOUNCE_CATEGORY_ID = 'debounce:save:category';
const DEBOUNCE_CATEGORY_TIME = 2000;

const initialEmptyCategory: Partial<CategoryInterface> = {
    name: '',
    description: '',
    parent_category_id: undefined,
    view: [],
    icon: [],
    is_visible: true, // Par défaut visible à la création
};

function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const { currentStore } = useGlobalStore();
    const { params, replaceLocation } = useMyLocation();
    const categoryIdFromRoute = params[1];
    const isNewCategory = categoryIdFromRoute === 'new';

    const [categoryFormState, setCategoryFormState] = useState<Partial<CategoryInterface>>(initialEmptyCategory);
    const [originalCategoryData, setOriginalCategoryData] = useState<Partial<CategoryInterface> | null>(null);
    const [localImagePreviews, setLocalImagePreviews] = useState<{ view?: string; icon?: string }>({});
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [isVisibilityUpdating, setIsVisibilityUpdating] = useState(false);
    const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    const s = useMemo(() => ({ collected: {} as Partial<CategoryInterface>, isUpdated: false }), []);

    const { data: fetchedCategoryData, isLoading: isLoadingCategory, isError: isFetchError, error: fetchError, refetch } = useGetCategory(
        { category_id: categoryIdFromRoute, with_product_count: true },
        { enabled: !isNewCategory && !!currentStore }
    );

    useEffect(() => {
        if (!isNewCategory && fetchedCategoryData) {
            setCategoryFormState(fetchedCategoryData);
            setOriginalCategoryData(fetchedCategoryData);
            setLocalImagePreviews({});
            setFieldErrors({});
        }
        if (isNewCategory) {
            setCategoryFormState(initialEmptyCategory);
            setOriginalCategoryData(null);
        }
    }, [isNewCategory, fetchedCategoryData]);

    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const isLoadingMutation = createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending;

    const updateLocalCategory = (updater: (current: Partial<CategoryInterface>) => Partial<CategoryInterface>) => {
        const changes = updater(categoryFormState);
        setCategoryFormState(current => ({ ...current, ...changes }));
        s.collected = { ...s.collected, ...changes };
        s.isUpdated = true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateLocalCategory(() => ({ [e.target.name]: e.target.value }));
    };

    const handleMarkdownChange = (value: string) => {
        updateLocalCategory(() => ({ description: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'view' | 'icon') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        updateLocalCategory(() => ({ [field]: [file] }));
        setLocalImagePreviews(prev => {
            if (prev[field]) URL.revokeObjectURL(prev[field]!);
            return { ...prev, [field]: previewUrl };
        });
        e.target.value = '';
    };

    const handleParentCategorySelect = (selected: CategoryInterface) => {
        updateLocalCategory(() => ({ parent_category_id: selected.id }));
        openChild(null);
    };

    const handleRemoveParent = () => {
        updateLocalCategory(() => ({ parent_category_id: 'null' }));
    };
    
    const handleVisibility = (is_visible: boolean) => {
        setIsVisibilityUpdating(true);
        updateLocalCategory(() => ({ is_visible }));
    };

    const handleDelete = () => { /* ... (logique inchangée, déjà bonne) ... */ };
    
    const validateForm = (showErrors: boolean = true) => {
        const errors: { [key: string]: string } = {};
        if (!categoryFormState.name || categoryFormState.name.trim().length < 3) errors.name = t('category.validation.nameRequired');
        if (!categoryFormState.view?.[0]) errors.view = t('category.validation.viewRequired');
        if (!categoryFormState.icon?.[0]) errors.icon = t('category.validation.iconRequired');
        if (showErrors) setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const createCategory = () => {
        if (!validateForm()) return;
        createCategoryMutation.mutate({ data: categoryFormState }, {
            onSuccess: (data) => {
                replaceLocation(`/categories/${data.category.id}`);
                showToast('Catégorie créée avec succès');
            },
            onError: (error) => showErrorToast(error),
        });
    };

    const saveRequired = () => {
        if (isLoadingMutation || !validateForm(false)) return;
        if (isNewCategory) return;
        
        const dataToUpdate = { ...s.collected };
        s.collected = {};
        
        if (Object.keys(dataToUpdate).length === 0) {
            setIsVisibilityUpdating(false);
            return;
        }

        setAutoSaveState('saving');
        updateCategoryMutation.mutate({ data: dataToUpdate, category_id: categoryIdFromRoute }, {
            onSuccess: (data) => {
                setOriginalCategoryData(data.category);
                setAutoSaveState('saved');
                if (Object.keys(s.collected).length > 0) {
                    debounce(() => saveRequired(), DEBOUNCE_CATEGORY_ID, DEBOUNCE_CATEGORY_TIME);
                } else {
                    setTimeout(() => setAutoSaveState('idle'), 2000);
                }
            },
            onError: (error) => {
                showErrorToast(error);
                setAutoSaveState('idle');
            },
            onSettled: () => setIsVisibilityUpdating(false),
        });
    };

    useEffect(() => {
        if (!isNewCategory && s.isUpdated) {
            s.isUpdated = false;
            debounce(() => saveRequired(), DEBOUNCE_CATEGORY_ID, DEBOUNCE_CATEGORY_TIME);
        }
    }, [categoryFormState, isNewCategory, s]);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => { /* ... (logique inchangée) ... */ return [];}, []);

    // 🎨 --- GESTION DES ÉTATS D'INTERRUPTION ---
    if (isLoadingCategory || !currentStore) {
        return <CategoryFormSkeleton />;
    }

    if (isFetchError) {
        const title = fetchError.status === 404 ? t('common.notFound.title') : t('common.error.title');
        const description = fetchError.status === 404 ? t('category.notFoundDesc') : (fetchError.message || t('common.error.genericDesc'));
        return (
            <div className="w-full min-h-screen flex flex-col"><Topbar back={true} breadcrumbs={breadcrumbs} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay variant="danger" icon={IoWarningOutline} title={title} description={description}>
                        <a href="/categories" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl">{t('category.backToList')}</a>
                    </StateDisplay>
                </main>
            </div>
        );
    }
    // Fin de la gestion des états

    const viewUrl = localImagePreviews.view || getMedia({ isBackground: true, source: categoryFormState.view?.[0], from: 'api' });
    const iconUrl = localImagePreviews.icon || getMedia({ isBackground: true, source: categoryFormState.icon?.[0], from: 'api' });
    const showViewPlaceholder = !localImagePreviews.view && !categoryFormState.view?.[0];
    const showIconPlaceholder = !localImagePreviews.icon && !categoryFormState.icon?.[0];

    // 🎨 Styles réutilisables
    const labelStyle = "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center";
    const sectionStyle = "bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-4 sm:p-6";
    const inputStyle = `p-2.5 px-4 block w-full rounded-lg border bg-white dark:bg-gray-800/50 shadow-sm sm:text-sm text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors ${fieldErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500'}`;
    const imagePickerStyle = (hasError: boolean) => `relative block rounded-lg cursor-pointer overflow-hidden group bg-gray-100/50 dark:bg-black/20 border-2 border-dashed ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500'}`;

    return (
        <div className="category-detail pb-[200px] w-full flex flex-col min-h-screen">
            <Topbar back={true} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isNewCategory ? t('category.createTitle') : t('category.editTitle', { name: originalCategoryData?.name || '...' })}
                    </h1>
                    {/* Auto-save indicator */}
                    {!isNewCategory && <div className={`text-xs transition-opacity duration-300 ${autoSaveState !== 'idle' ? 'opacity-100' : 'opacity-0'}`}>
                        {autoSaveState === 'saving' && <span className="text-amber-600 dark:text-amber-400">{t('common.saving')}...</span>}
                        {autoSaveState === 'saved' && <span className="text-green-600 dark:text-green-400">{t('common.saved')}</span>}
                    </div>}
                </div>

                <div className={`${sectionStyle} space-y-6`}>
                    <div>
                        <label className={labelStyle} htmlFor="chose-category-view">{t('category.coverImageLabel')} <Indicator className="ml-2" title={t('category.coverImageTooltipTitle')} description={t('category.coverImageTooltipDesc')} /></label>
                        <label htmlFor="chose-category-view" className={`${imagePickerStyle(!!fieldErrors.view)} w-full aspect-[3/1]`}>
                            <div className="absolute inset-0 bg-cover bg-center" style={{ background: viewUrl ? `url(${viewUrl})` : 'none' }}></div>
                            {showViewPlaceholder && <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-500"><IoCloudUploadOutline size={40} /><span className="mt-1 text-xs">{t('category.selectImagePrompt')}</span></div>}
                            {!showViewPlaceholder && <div className="absolute bottom-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow text-gray-700 dark:text-gray-300 group-hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"><RiImageEditFill size={18} /></div>}
                            <input id="chose-category-view" type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e, 'view')} />
                        </label>
                        {fieldErrors.view && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.view}</p>}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="flex-shrink-0 w-full sm:w-auto">
                            <label className={labelStyle} htmlFor="chose-category-icon">{t('category.iconLabel')} <Indicator className="ml-2" title={t('category.iconTooltipTitle')} description={t('category.iconTooltipDesc')} /></label>
                            <label htmlFor="chose-category-icon" className={`${imagePickerStyle(!!fieldErrors.icon)} w-36 h-36`}>
                                <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ background: iconUrl ? `url(${iconUrl})` : 'none' }}></div>
                                {showIconPlaceholder && <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-500 p-2 text-center"><IoCloudUploadOutline size={32} /><span className="mt-1 text-xs">{t('category.selectIconPrompt')}</span></div>}
                                {!showIconPlaceholder && <div className="absolute bottom-1 right-1 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow text-gray-700 dark:text-gray-300 group-hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"><RiImageEditFill size={16} /></div>}
                                <input id="chose-category-icon" type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e, 'icon')} />
                            </label>
                            {fieldErrors.icon && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.icon}</p>}
                        </div>
                        {!isNewCategory && <div className="stats flex-grow sm:pt-7"><h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('category.performanceData')}</h3><div className="flex flex-col gap-1.5"><h2 className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><IoBagHandle className="w-4 h-4 text-gray-400" />{t('dashboard.products')}: <span className="font-semibold text-gray-900 dark:text-white">{categoryFormState.product_count ?? 0}</span></h2></div></div>}
                    </div>

                    <div>
                        <label className={`${labelStyle} justify-between`} htmlFor="input-category-name">
                            <span>{t('category.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                            <span className={`text-xs ${(categoryFormState.name?.length || 0) > 52 ? 'text-red-500' : 'text-gray-400'}`}>{(categoryFormState.name?.length || 0)} / 52</span>
                        </label>
                        <input id="input-category-name" name="name" type="text" value={categoryFormState.name || ''} placeholder={t('category.namePlaceholder')} onChange={handleInputChange} className={inputStyle} maxLength={52} />
                        {fieldErrors.name && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.name}</p>}
                    </div>

                    <div>
                        <label className={`${labelStyle} justify-between`} htmlFor="input-category-description"><span>{t('category.descriptionLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span></label>
                        <MarkdownEditor2 value={categoryFormState.description || ''} setValue={handleMarkdownChange} error={!!fieldErrors.description} />
                        {fieldErrors.description && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{fieldErrors.description}</p>}
                    </div>

                    <div>
                        <h3 className={`${labelStyle} mb-2`}>{t('category.parentCategoryLabel')} <span className="text-gray-400 text-xs ml-1">({t('common.optionalField')})</span></h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <ParentCategoryButton categoryFormState={categoryFormState} openChild={openChild} t={t} handleParentCategorySelect={handleParentCategorySelect} />
                            {(categoryFormState.parent_category_id && categoryFormState.parent_category_id !== 'null') && <CategoryItemMini category_id={categoryFormState.parent_category_id} onDelete={handleRemoveParent} />}
                        </div>
                    </div>
                </div>

                {!isNewCategory && (
                    <div className={sectionStyle}>
                        <VisibilityControl title='' isVisible={!!originalCategoryData?.is_visible} onSetVisibility={handleVisibility} onDeleteRequired={handleDelete} isLoading={isVisibilityUpdating} t={t} />
                    </div>
                )}
                {isNewCategory && <CreateControl onCancel={() => history.back()} onCreate={createCategory} canCreate={validateForm(false)} t={t} title={t('category.createTitle')} isLoading={isLoadingMutation} />}
                
                {!isNewCategory && categoryFormState.id && (
                    <div className={sectionStyle}>
                        <ProductList title={t('category.categoryProducts')} addTo={{ category_id: categoryFormState.id, text: t('category.addProductToCategory') }} baseFilter={{ categories_id: [categoryFormState.id] }} />
                    </div>
                )}
            </main>
        </div>
    );
}

function ParentCategoryButton({ categoryFormState, openChild, t, handleParentCategorySelect }: any) {
    const hasParent = !!categoryFormState.parent_category_id && categoryFormState.parent_category_id !== 'null';
    const handleOpenPopup = () => openChild(<ChildViewer title={t('category.selectParentTitle')}><CategoriesPopup ignore={[categoryFormState?.id || 'new']} onSelected={handleParentCategorySelect} /></ChildViewer>, { background: 'rgba(30, 41, 59, 0.7)', blur: 4 });

    const baseStyle = "transition-all flex text-sm font-medium";
    const addStyle = "items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-teal-500/10 text-teal-700 border-teal-500/20 hover:bg-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20 dark:hover:bg-teal-500/20";
    const replaceStyle = "flex-col items-center justify-center p-2 w-24 h-24 rounded-lg bg-gray-100/80 dark:bg-black/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-black/30 gap-1 text-center";

    return (
        <button type="button" onClick={handleOpenPopup} className={`${baseStyle} ${hasParent ? replaceStyle : addStyle}`} aria-label={t(hasParent ? 'category.replaceParentButton' : 'category.selectParentButton')}>
            {hasParent ? (
                <>
                    <span className="flex items-center justify-center p-2 bg-teal-500/10 rounded-full text-teal-600 dark:text-teal-400 mb-1"><FaRedo size={14} /></span>
                    <span className="text-xs">{t('category.replaceParentButton')}</span>
                </>
            ) : (
                <><IoAdd size={16} /><span>{t('category.selectParentButton')}</span></>
            )}
        </button>
    );
}