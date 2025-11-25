// pages/products/@id/+Page.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { usePageContext } from '../../../renderer/usePageContext';
import { useGlobalStore } from '../../../api/stores/StoreStore';
import {
    useGetProduct, useCreateProduct, useUpdateProduct, useDeleteProduct, useMultipleUpdateFeaturesValues
} from '../../../api/ReactSublymusApi';
import { FeatureInterface, ProductInterface, ValueInterface } from '../../../api/Interfaces/Interfaces';
import { Topbar, BreadcrumbItem } from '../../../Components/TopBar/TopBar';
import { ProductFormSkeleton } from '../../../Components/Skeletons/allsKeletons';
import { StateDisplay } from '../../../Components/StateDisplay/StateDisplay';
import { ImageManager, ImageItem } from '../../../Components/ImageManager/ImageManager';
import { SEOSettings } from '../../../Components/SEOSettings/SEOSettings';
import { Feature } from '../../../Components/Feature/Feature';
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor';
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup';
import { CategoryItemMini } from '../../../Components/CategoryItem/CategoryItemMini';
import { VisibilityControl } from '../../../Components/Controls/VisibilityControl';
import { ClientCall, debounce, http, limit, toNameString } from '../../../Components/Utils/functions';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { showErrorToast, showToast } from '../../../Components/Utils/toastNotifications';
import { IoAdd, IoArrowBack, IoArrowForward, IoCheckmarkCircleOutline, IoInformationCircleOutline, IoLayersOutline, IoStorefrontOutline, IoWarningOutline } from 'react-icons/io5';
import { useMyLocation } from '../../../Hooks/useRepalceState';
import { getNewFeature, getDefaultFeature, getDefaultValues } from '../../../Components/Utils/parseData';
import { FeatureInfo } from '../../../Components/FeatureInfo/FeatureInfo';
import { log } from 'console';
import { ApiError } from '../../../api/SublymusApi';
import { Plus } from 'lucide-react';
import { SpinnerIcon } from '../../../Components/Confirm/Spinner';
import { cardStyle } from '../../../Components/Button/Style';

export { Page };

// --- Constantes et Types ---
type WizardStep = 'info' | 'publish';
const DEBOUNCE_TIME = 3000;
const initialEmptyProduct: Partial<ProductInterface> = {
    name: '', description: '', price: undefined, barred_price: undefined,
    categories_id: [], features: [], is_visible: false, stock: null,
};

const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const inputStyle = "block w-full rounded-lg dark:text-white shadow-sm bg-white dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 sm:text-sm transition-colors p-2.5";
const sectionStyle = "bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-2 mob:p-4 sm:p-6";

// --- Composant Wizard Stepper UI ---
const Stepper = ({ currentStep, setStep, isNewProduct }: { currentStep: WizardStep, setStep: (step: WizardStep) => void, isNewProduct: boolean }) => {
    const { t } = useTranslation();
    const steps: { id: WizardStep, name: string, icon: React.ElementType }[] = [
        { id: 'info', name: t('product.step.info'), icon: IoInformationCircleOutline },
        { id: 'publish', name: t('product.step.publish'), icon: IoStorefrontOutline },
    ];
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <nav className={`flex items-center justify-center  rounded-xl ${cardStyle}`} aria-label="Progress">
            <input ref={(ref) => {
                if (!ref) return;
                ref.autofocus = true;
                setTimeout(() => {
                    ref.autofocus = true;
                }, 700);
            }} type="text" autoFocus style={{ all: 'unset', visibility: 'hidden', width: '0px', maxWidth: '0px', height: '0px', maxHeight: '0px' }} />
            <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className="flex items-center">
                        <button onClick={() => setStep(step.id)} disabled={isNewProduct && stepIdx > 0} className="flex flex-col items-center text-center disabled:cursor-not-allowed group">
                            <div className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${stepIdx == currentStepIndex ? 'bg-teal-600' : isNewProduct ? 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600' : 'bg-teal-600/10 dark:bg-teal-600/20'}`}>
                                <step.icon className={`h-6 w-6 ${stepIdx == currentStepIndex ? 'text-white' : isNewProduct ? 'text-gray-500 dark:text-gray-400' : 'text-teal-700'}`} />
                            </div>
                            <p className={`mt-2 text-xs font-medium transition-colors ${step.id === currentStep ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>{step.name}</p>
                        </button>
                        {stepIdx !== steps.length - 1 && <div className="w-5 sx:w-10 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700" />}
                    </li>
                ))}
            </ol>
        </nav>
    );
};
// --- Composant Principal ---
function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const { currentStore } = useGlobalStore()
    const { params, replaceLocation } = useMyLocation();
    const { urlPathname } = usePageContext();
    const productId = params[1];
    const isNewProduct = productId === 'new';

    const [step, setStep] = useState<WizardStep>('info');
    const [product, setProduct] = useState<Partial<ProductInterface>>(initialEmptyProduct);
    const [originalProduct, setOriginalProduct] = useState<ProductInterface | null | undefined>(null);

    // Gérer la navigation vers "publish" si "publish-required" existe dans localStorage
    // Le Layout gère déjà le localStorage, on lit juste le flag ici pour naviguer
    useEffect(() => {
        if (!isNewProduct && productId) {
            const publishRequired = localStorage.getItem('publish-required');
            if (publishRequired === 'true') {
                // Vérifier qu'on est bien sur la page principale (pas une sous-page)
                const isMainPage = urlPathname === `/products/${productId}` || urlPathname === `/products/${productId}/`;
                
                if (isMainPage) {
                    setStep('publish');
                }
            }
        }
    }, [productId, isNewProduct, urlPathname]);

    const [s] = useState({
        init: false,
        features: [] as FeatureInterface[] | undefined,
        product: undefined as Partial<ProductInterface> | undefined
    })
    const { data: fetchedProduct, isLoading, isError, error, refetch } = useGetProduct({ product_id: productId, with_feature: true, }, { enabled: !isNewProduct });

    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const multipleUpdateMutation = useMultipleUpdateFeaturesValues();
    const isLoadingMutation = createProductMutation.isPending || updateProductMutation.isPending || multipleUpdateMutation.isPending;

    useEffect(() => {
        if (fetchedProduct && !s.init) {
            s.init = true;
            setProduct(fetchedProduct);
            setOriginalProduct(fetchedProduct);
            return
        }
        if (fetchedProduct && !s.product && isLoadingMutation) {
            setProduct(fetchedProduct);
            setOriginalProduct(fetchedProduct);
        }
    }, [fetchedProduct]);

    const updateProduct = () => {

        const d = s.product
        s.product = undefined
        d && updateProductMutation.mutate({ product_id: productId, data: d }, {
            onSuccess: (data) => {
                showToast(t('common.saveChanges'), "SUCCESS");
                if (s.product) {
                    updateProduct();
                }
                refetch()
            },
            onError: (err) => showErrorToast(err),
        });
    }

    const updateFeatures = () => {
        try {
            const f = s.features;
            s.features = undefined
            originalProduct && f && multipleUpdateMutation.mutate(
                {
                    currentFeatures: f,
                    initialFeatures: originalProduct.features || [],
                    product_id: originalProduct.id,
                },
                {
                    onSuccess: (data) => {
                        try {
                            if (!data.product?.id) return;
                            if (s.features) {
                                updateFeatures();
                                return;
                            }
                            setProduct(data.product);
                            setOriginalProduct(data.product);
                            showToast("Fonctionnalités mises à jour avec succès"); // ✅ Toast succès
                        } catch (error) {
                        }
                    },
                    onError: (error: ApiError) => {
                        showErrorToast(error); // ❌ Toast erreur
                    },
                }
            );
        } catch (error) { }
    }

    const handleFieldUpdate = (field: keyof ProductInterface, value: any) => {

        if (field == 'features') {

            if (Array.isArray(value)) {
                s.features = value;
                isNewProduct
                    ? setProduct(prev => ({ ...prev, features: value }))
                    : debounce(() => {
                        updateFeatures();
                    }, 'feature_update', DEBOUNCE_TIME);
            }
            return
        }

        setProduct((prev) => ({ ...prev, [field]: value }));
        s.product = { ...(s.product || {}), [field]: value }
        !isNewProduct && debounce(() => {
            updateProduct()
        }, 'product_update', DEBOUNCE_TIME);
    };

    const handleSaveAndContinue = () => {
        // Validation basique
        if (!product.name || !product.price) {
            showErrorToast(new Error(t('product.validation.nameAndPriceRequired')));
            return;
        }

        createProductMutation.mutate({ product, views: product.features?.[0]?.values?.[0]?.views || [] }, {
            onSuccess: (data) => {
                showToast(t('product.createSuccess'));
                replaceLocation(`/products/${data.product.id}`);
                setOriginalProduct(data.product);
                setProduct(data.product);
                setStep('publish');
            },
            onError: showErrorToast,
        });
    };

    const nextStep = () => {
        const steps: WizardStep[] = ['info', 'publish'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
    };

    const prevStep = () => {
        const steps: WizardStep[] = ['info', 'publish'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) setStep(steps[currentIndex - 1]);
    };

    if (isLoading || !currentStore) return <ProductFormSkeleton />;
    if (isError) return <StateDisplay variant="danger" icon={IoWarningOutline} title="Erreur" description={error.message} />;

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.products'), url: '/products' },
        { name: isNewProduct ? t('product.createBreadcrumb') : limit(originalProduct?.name || '...', 30) },
    ];


    return (
        <div className="product-wizard-page pb-48 w-full min-h-screen flex flex-col">
            <Topbar back title={isNewProduct ? t('product.createTitle') : t('product.editTitle')} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-5xl mx-auto p-2 mob:p-4 md:p-6 lg:p-8 flex flex-col gap-8">
                <Stepper currentStep={step} setStep={setStep} isNewProduct={isNewProduct && !originalProduct} />

                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                        {step === 'info' && <ProductInfoStep product={product} onUpdate={handleFieldUpdate} />}
                        {step === 'publish' && originalProduct && <ProductPublishStep product={originalProduct} onUpdate={handleFieldUpdate} />}
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-between items-center">
                    {step !== 'info' ? <button onClick={prevStep} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <IoArrowBack /> {t('common.previous')}
                    </button> : <div></div>}
                    {isNewProduct && !originalProduct ? (
                        <button onClick={handleSaveAndContinue} disabled={createProductMutation.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors">
                            {
                                createProductMutation.isPending && <SpinnerIcon />
                            }
                            {t('product.saveAndContinue')} <IoArrowForward />
                        </button>
                    ) : step !== 'publish' ? (
                        <button onClick={nextStep} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors">
                            {t('common.next')} <IoArrowForward />
                        </button>
                    ) : (
                        <a target="_blank" rel="noopener noreferrer" href={`${http}${currentStore.default_domain}/${product.slug}`} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                            <IoCheckmarkCircleOutline /> {t('product.viewOnStore')}
                        </a>
                    )}
                </div>
            </main>
        </div>
    );
}

// --- SOUS-COMPOSANTS POUR CHAQUE ÉTAPE ---

// ÉTAPE 1
const ProductInfoStep = ({ product, onUpdate }: { product: Partial<ProductInterface>, onUpdate: (field: keyof ProductInterface, value: any) => void }) => {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const defaultFeature = getDefaultFeature(product);
    const defaultValue = getDefaultValues(product);
    const imageItems: ImageItem[] = (defaultFeature?.values?.[0]?.views || []).map(v => ({ id: typeof v == 'string' ? v : v.size + v.type + (v as File).name + (v as File).lastModified, source: v as string }))

    const handleImagesChange = (newImages: ImageItem[], value_id?: string) => {
        let value: ValueInterface | undefined;
        if (value_id) {
            value = defaultFeature?.values?.find(v => v.id == value_id);
        } else {
            value = defaultValue[0];
        }
        if (!value) {
            value = {
                id: ClientCall(() => Date.now().toString(32) + Math.random().toString(32), 0), // ID temporaire
                feature_id: '',
                index: 0,
                text: '',
                _request_mode:'new'
            }
            if (!defaultFeature) {
                product.features = [getNewFeature()]
                product.features[0].values = [value];
                product.features[0].is_default = true;
            } else {
                defaultFeature.values = [value];
            }
        }
        value.views = newImages.map(i => i.source);
        value._request_mode = value._request_mode || 'edited';

        onUpdate('features', product.features);
    };

    const handleCategoriesChange = (categories_id: string[]) => {
        onUpdate('categories_id', categories_id);
    };


    return (
        <div className={`${sectionStyle} space-y-6`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('product.step.info')}</h2>
            <div>
                <label htmlFor="productName" className={labelStyle}>{t('product.nameLabel')}</label>
                <input type="text" id="productName" value={product.name || ''} onChange={e => onUpdate('name', e.target.value)} className={inputStyle} />
            </div>
            <div>
                <label className={labelStyle}>Images principales</label>
                <ImageManager canOpenGallery images={imageItems} onImagesChange={handleImagesChange} />
            </div>
            <div>
                <label className={labelStyle}>{t('product.descriptionLabel')}</label>
                <MarkdownEditor2 value={product.description || ''} setValue={val => onUpdate('description', val)} />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="productPrice" className={labelStyle}>{t('product.priceLabel')}</label>
                    <input type="number" id="productPrice" value={product.price ?? ''} onChange={e => onUpdate('price', parseFloat(e.target.value))} className={inputStyle} />
                </div>
                <div>
                    <label htmlFor="productBarredPrice" className={labelStyle}>{t('product.barredPriceLabel')}</label>
                    <input type="number" id="productBarredPrice" value={product.barred_price ?? ''} onChange={e => onUpdate('barred_price', parseFloat(e.target.value))} className={inputStyle} />
                </div>
            </div>
            <div>
                <label className={labelStyle}>{t('product.categoriesLabel')}</label>
                <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" onClick={() =>
                        openChild(
                            <ChildViewer
                                title={t('product.selectCategoryTitle')}>
                                <CategoriesPopup
                                    ignore={product.categories_id || []}
                                    onSelected={cat => {
                                        openChild(null)
                                        handleCategoriesChange([...(product.categories_id || []), cat.id])
                                    }}
                                />
                            </ChildViewer>
                        )} className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors"><IoAdd size={20} /></button>
                    {(product.categories_id || []).map(cat_id => <CategoryItemMini key={cat_id} category_id={cat_id} onDelete={() => handleCategoriesChange((product.categories_id || []).filter(c_id => c_id !== cat_id))} />)}
                </div>
            </div>
        </div>
    );
};

// ÉTAPE 2 - Publication
const ProductPublishStep = ({ product, onUpdate }: { product: ProductInterface, onUpdate: (field: keyof ProductInterface, value: any) => void }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Section Publication et SEO */}
            <div className={`${sectionStyle} space-y-6`}>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('product.step.publish')}</h2>
                <VisibilityControl
                    t={t}
                    onDeleteRequired={() => {}}
                    title={t('product.visibilityTitle')}
                    isLoading={false}
                    isVisible={!!product.is_visible}
                    onSetVisibility={(v) => onUpdate('is_visible', v)} 
                />
                <div className="pt-6 border-t dark:border-gray-700">
                    <SEOSettings product={product} />
                </div>
            </div>
        </div>
    );
};






















