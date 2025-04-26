// pages/products/@id/+Page.tsx (ou /products/new/+Page.tsx)

// --- Imports ---
import { useEffect, useState, useCallback } from 'react'; // Ajouter useCallback
import { usePageContext } from '../../../renderer/usePageContext';
import { useStore } from '../../stores/StoreStore';
// ✅ Importer les hooks API nécessaires
import {
    useGetProducts, // Pourrait être utilisé pour charger l'original
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useMultipleUpdateFeaturesValues,
    useApi
} from '../../../api/ReactSublymusApi';
import { FeatureInterface, ProductInterface, ValueInterface } from '../../../Interfaces/Interfaces';
import { Topbar } from '../../../Components/TopBar/TopBar';
// Importer les composants UI 
import { SwiperProducts } from '../../../Components/SwiperProducts/SwiperProducts';
import { CategoryItemMini } from '../../../Components/CategoryItem/CategoryItemMini';
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup';
import { Feature } from '../../../Components/Feature/Feature';
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor';
import { CommandeList } from '../../../Components/CommandesList/CommandesList';
import { Indicator } from '../../../Components/Indicator/Indicator';
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
// Importer les utilitaires
import { debounce } from '../../../Components/Utils/functions';
import { NEW_VIEW } from '../../../Components/Utils/constants';
// Autres imports
import { useMyLocation } from '../../../Hooks/useRepalceState';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'; // Utiliser le hook
import { useTranslation } from 'react-i18next';
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoAdd, IoPencil } from 'react-icons/io5'; // Icons pour le formulaire
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Grid, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { getNewFeature } from '../../../Components/Utils/parseData';
import { FeatureInfo } from '../../../Components/FeatureInfo/FeatureInfo';
import { HoriszontalSwiper } from '../../../Components/HorizontalSwiper/HorizontalSwiper';
// Constantes
const FEATURE_LIMIT = 5;
const DEBOUNCE_PRODUCT_ID = 'debounce:save:product';
const DEBOUNCE_FEATURES_ID = 'debounce:save:features';
const DEBOUNCE_PRODUCT_TIME = 3000;
const DEBOUNCE_FEATURES_TIME = 200;

// État initial vide
const initialEmptyProduct: Partial<ProductInterface> = {
    name: '',
    description: '',
    price: undefined, // Utiliser undefined pour les nombres pour mieux détecter la saisie initiale
    barred_price: undefined,
    categories_id: [],
    features: [], // Commencer avec un tableau vide
    is_visible: true, // Visible par défaut?
    // default_feature_id est géré à la création/mise à jour complexe
};


export { Page };

function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const { currentStore } = useStore();
    const { routeParams } = usePageContext();
    const { replaceLocation, nextPage } = useMyLocation()
    const productIdFromRoute = routeParams?.['id'];
    const isNewProduct = productIdFromRoute === 'new';
    const api = useApi()
    // --- États du Composant ---
    // État principal du formulaire
    const [productFormState, setProductFormState] = useState<Partial<ProductInterface>>(
        isNewProduct ? initialEmptyProduct : {}
    );
    // Données originales (pour comparaison et titre)
    const [originalProductData, setOriginalProductData] = useState<Partial<ProductInterface> | null>(
        isNewProduct ? initialEmptyProduct : null // null si édition, sera rempli par fetch
    );
    // Erreurs de validation par champ
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const [featuresFromState, setFeaturesFromState] = useState<Partial<FeatureInterface>[]>([]);

    const [s] = useState({
        features: undefined as Partial<FeatureInterface>[] | undefined,
        collected: {} as Partial<ProductInterface>,
        isUpdated: false,
        isViewChanged: false,
    });

    // --- Récupération des données pour l'édition ---
    // Utiliser useGetProducts avec l'ID spécifique
    const {
        data: fetchedProductData,
        isLoading: isLoadingProduct,
        isError: isFetchError,
        error: fetchError,
        isSuccess: isFetchSuccess,
    } = useGetProducts(
        { product_id: isNewProduct ? undefined : productIdFromRoute, with_feature: true }, // Fetch seulement si ID et avec features/values
        { enabled: !isNewProduct && !!currentStore && !!productIdFromRoute }
    );

    // Initialiser le formulaire quand les données sont chargées
    useEffect(() => {
        if (!isNewProduct && isFetchSuccess && fetchedProductData?.list?.[0]) {
            const fetchedProduct = fetchedProductData.list[0];
            setProductFormState(fetchedProduct);
            setOriginalProductData(fetchedProduct); // Sauver l'original
            const v = fetchedProduct.features?.find(f => f.id == fetchedProduct?.default_feature_id)?.values || []
            setValues(v.map((a, i) => ({ ...a, index: i })));
            setFeaturesFromState(fetchedProduct.features || [])
            setFieldErrors({});
            logger.info("Product data loaded for editing", { productId: fetchedProduct.id });
        }
        // Reset si on navigue vers /new
        if (isNewProduct) {
            setProductFormState(initialEmptyProduct);
            setOriginalProductData(initialEmptyProduct);
            setFieldErrors({});
        }
    }, [isNewProduct, isFetchSuccess, fetchedProductData]);


    // --- Mutations API ---
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct(); // Pour infos de base
    const multipleUpdateMutation = useMultipleUpdateFeaturesValues(); // Pour features/values
    const deleteProductMutation = useDeleteProduct();

    const isLoadingMutation = createProductMutation.isPending || updateProductMutation.isPending || multipleUpdateMutation.isPending || deleteProductMutation.isPending;

    const updateLocalProduct = (cb: (current: Partial<ProductInterface>) => Partial<ProductInterface>) => {
        setProductFormState((current) => {
            const d = cb({});
            if (d.features) {
                s.features = d.features;
                delete d.features;
                if (Object.keys(d).length == 0) return current
            }
            s.collected = { ...s.collected, ...d }
            s.isUpdated = true
            return { ...current, ...d }
        });
    }
    const updateLocalFeatures = (cb: (current: {}) => { features?: Partial<FeatureInterface>[] }) => {
        const d = cb({});
        if (!d.features) return;
        s.features = d.features;
        setFeaturesFromState(s.features);
    }

    const updateValues = async (vs: ValueInterface[], feature_id?: string) => {
        vs = vs.map((v, i) => {
            if (v.index !== i) {
                v.index = i;
                v._request_mode = 'edited'
            }
            return v
        })
        setValues(vs)
        const ft = featuresFromState.map(_f => (_f.id === (feature_id || originalProductData?.default_feature_id)) ? { ..._f, values: vs } : _f);
        console.log(ft);

        updateLocalFeatures(() => ({
            features: ft
        }));
    }

    const handleDelete = () => {
        logger.warn("handleDelete not implemented yet.");
        if (!isNewProduct && productFormState.id) {
            openChild(<ChildViewer><ConfirmDelete title={t('product.confirmDelete', { name: productFormState.name })} onCancel={() => openChild(null)} onDelete={() => {
                deleteProductMutation.mutate(productFormState.id!, {
                    onSuccess: () => { /* Redirection... */ },
                    onError: () => { /* Toast erreur... */ }
                });
                openChild(null);
            }} /></ChildViewer>, { background: '#3455' });
        }
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement; // Cast pour checked
        const fieldValue = type === 'checkbox' ? checked : value;
        updateLocalProduct((prev) => ({
            ...prev,
            [name]: fieldValue
        }));
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }, [updateLocalProduct]);

    const handleMarkdownChange = useCallback((value: string) => {
        updateLocalProduct((prev) => ({
            ...prev,
            description: value
        }));
        setFieldErrors(prev => ({ ...prev, description: '' }));
    }, [updateLocalProduct]);


    function isFilledProduct(product: Partial<ProductInterface>, validate?: boolean, keys?: string[]) {
        const errors: { [key: string]: string } = {};
        if ((!product.name || product.name.length < 3) && (!keys || (keys && keys.includes('name')))) {
            errors.name = t('category.validation.nameRequired');
            // validate && nameRef.current?.focus()
        }
        if ((!product.description || product.description.length < 3) && (!keys || (keys && keys.includes('description')))) {
            errors.description = t('category.validation.nameRequired');
            //   validate && descriptionRef.current?.focus()
        }
        if ((product.barred_price && (product.barred_price <= (product.price || 0))) && (!keys || (keys && keys.includes('barred_price')))) {
            errors.barred_price = t('category.validation.nameRequired');
            //   barredPriceRef.current?.focus()
        }
        if (!product.price && (!keys || (keys && keys.includes('price')))) {
            errors.price = t('category.validation.nameRequired');
            //   priceRef.current?.focus()
        } else {
            if (((product.barred_price || 0) <= (product.price || 0)) && (!keys || (keys && keys.includes('price')))) {
                // !barredError && setBarredError('le prix du produit doit etre difinie ');
                // v = false
            } else {
                errors.barred_price = t('category.validation.nameRequired');
            }
        }
        const hasError = Object.keys(errors).length > 0;
        if (validate && hasError) setFieldErrors(errors)
        return hasError
    }
    const openNewFeature = () => {
        openChild(<ChildViewer title='Les Informations sur la variante'>
            <FeatureInfo feature={(getNewFeature())} onChange={(f) => {
                const fs = featuresFromState || [];
                f._request_mode = 'new'
                const features = [...fs, f];
                updateLocalFeatures((current) => ({
                    ...current,
                    features
                }))
                openChild(null)
            }} onCancel={() => {
                openChild(null)

            }} />
        </ChildViewer>, {
            background: '#3455'
        })
    }
    // --- 🚀 Itération 1: handleSave (Création et Update Simple) ---
    const creatProduct = async () => {

        createProductMutation.mutate({
            product: productFormState,
            views: values[0]?.views || []
        }, {
            onSuccess: (data) => {
                if (!data?.product?.id) return
                logger.info("Product created successfully", data);
                s.collected = {}
                setProductFormState(data.product); // Mettre à jour avec données serveur (qui inclut default_feature_id)
                setOriginalProductData(data.product);
                setFeaturesFromState(data.product.features || [])
                setFieldErrors({});
                setValues(data.product.features?.find(f => f.id == data.product?.default_feature_id)?.values || [])
                replaceLocation(`/products/${data.product.id}`); // Mettre à jour l'URL
                // toast.success(data.message || t('product.createdSuccess'));
            },
            onError: (error: ApiError) => {
                logger.error({ error }, "Product creation failed");
                // Afficher erreurs spécifiques si disponibles, sinon message générique
                if (error.status === 422 && error.body?.errors) {
                    setFieldErrors(error.body.errors); // Afficher erreurs de validation API
                } else {
                    // toast.error(error.message || t('product.creationFailed'));
                }
            }
        });
    };

    const hasCollected = (c: Partial<ProductInterface>) => {
        const a = { ...c };
        delete a.features
        delete a.id
        delete (a as any).product_id
        const k = Object.keys(a) as (keyof typeof a)[];
        for (const e of k) {
            if (a[e] == undefined) delete a[e]
        }
        return Object.keys(a).length > 0
    }
    const saveRequired = async (collected: Partial<ProductInterface>) => {
        if (isLoadingMutation) return console.log('onLoading');
        if (!hasCollected(collected)) return
        if (!isFilledProduct(collected, true, Object.keys(s.collected))) return console.log('informations incomplete');

        try {

            const c = { ...s.collected, product_id: productIdFromRoute, features: undefined };
            s.collected = {}
            updateProductMutation.mutate(c, {
                onSuccess: (data) => {
                    if (!data.product?.id) return;
                    logger.info("Product updated successfully (simple)", data);
                    const updatedProduct = { ...originalProductData, ...data.product }; // Merger avec l'original pour garder les features/values
                    setOriginalProductData(updatedProduct);
                    if (hasCollected(collected)) {
                        debounce(() => {
                            saveRequired(s.collected)
                        }, DEBOUNCE_PRODUCT_ID, DEBOUNCE_PRODUCT_TIME)
                        return
                    }
                    s.collected = {};
                    setFeaturesFromState(updatedProduct.features || [])
                    setValues(updatedProduct.features?.find(f => f.id == updatedProduct.default_feature_id)?.values || [])
                    setProductFormState(updatedProduct);
                    setFieldErrors({});
                    // toast.success(data.message || t('product.updateSuccess'));
                },
                onError: (error: ApiError) => {
                    logger.error({ error }, "Product update failed (simple)");
                    if (error.status === 422 && error.body?.errors) {
                        setFieldErrors(error.body.errors);
                    } else {
                        // toast.error(error.message || t('product.updateFailed'));
                    }
                }
            });

        } catch (error) { }
    }

    const updateFeaturesValues = async () => {
        if (isLoadingMutation) return console.log('onLoading');
        if (isNewProduct) return
        if (!s.features) return;
        if (!originalProductData?.features) return;
        if (!originalProductData.id) return
        try {
            const f = s.features;
            return console.log('----------- FEATURES ------------', await api.prepareMultipleFeaturesValus({
                currentFeatures: f,
                initialFeatures: originalProductData.features,
                product_id: originalProductData.id,
            }));

            // s.features = undefined;
            // multipleUpdateMutation.mutate({
            //     currentFeatures:f,
            //     initialFeatures:originalProductData.features,
            //     product_id:originalProductData.id,
            // }, {
            //     onSuccess: (data) => {
            //         if (!data.product?.id) return;
            //         logger.info("Features updated successfully", data);
            //         const updatedProduct = { ...originalProductData, ...data.product };
            //         setOriginalProductData(updatedProduct);
            //         if(s.features) {
            //             debounce(() => {
            //                 updateFeaturesValues()
            //             }, DEBOUNCE_FEATURES_ID, DEBOUNCE_FEATURES_TIME)
            //             return
            //         }
            //         setFeaturesFromState(updatedProduct.features||[])
            //         setValues(updatedProduct.features?.find(f=>f.id ==updatedProduct.default_feature_id)?.values||[])
            //         setProductFormState(updatedProduct);
            //         setFieldErrors({});
            //         // toast.success(data.message || t('product.updateSuccess'));
            //     },
            //     onError: (error: ApiError) => {
            //         logger.error({ error }, "Product update failed (simple)");
            //         if (error.status === 422 && error.body?.errors) {
            //             setFieldErrors(error.body.errors);
            //         } else {
            //             // toast.error(error.message || t('product.updateFailed'));
            //         }
            //     }
            // });

        } catch (error) { }
    }
    useEffect(() => {
        !isNewProduct && s.isUpdated && (() => {
            s.isUpdated = false
            debounce(() => {
                saveRequired(s.collected)
            }, DEBOUNCE_PRODUCT_ID, DEBOUNCE_PRODUCT_TIME);
        })()
    }, [productFormState])

    useEffect(() => {
        !isNewProduct && s.features && (() => {
            debounce(() => {
                updateFeaturesValues()
            }, DEBOUNCE_FEATURES_ID, DEBOUNCE_FEATURES_TIME)
        })()
    }, [featuresFromState])

    /************************************************
     LOGIQUE DE GESTION DES VIEWS
    *************************************************/

    const [values, setValues] = useState<ValueInterface[]>([] as any);
    const [index, setindex] = useState(0);

    const clearValues = () => {
        return [...values].map(val => ({ ...val, views: (val.views || []).filter(view => view != NEW_VIEW) })).filter(val => val.views && val.views.length > 0);
    }
    useEffect(() => {
        const vs = clearValues();
        setValues(vs)
    }, [index])


    // --- Rendu ---
    if (!isNewProduct && isLoadingProduct) {
        return <div className="w-full min-h-screen flex items-center justify-center"><span className='text-gray-500'>{t('common.loading')}</span></div>;
    }
    if (!isNewProduct && isFetchError && fetchError?.status === 404) {
        return <PageNotFound title={t('product.notFound')} description={fetchError.message} />;
    }
    if (!isNewProduct && !isLoadingProduct && !productFormState.id) {
        return <PageNotFound title={t('product.notFound')} description={t('product.loadError')} />;
    }

    return (
        <div className="product-detail-page w-full flex flex-col bg-gray-50 min-h-screen">
            <Topbar back={true} />
            {/* Utiliser max-w-4xl ou 5xl pour plus d'espace, gap-6 ou 8 */}
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 pb-24">

                <section className="views">
                    <SwiperProducts views={values[index]?.views || []} setViews={(localViews) => {
                        if (values[index] == undefined) {
                            values[index] = {
                                views: localViews,
                                id: NEW_VIEW,
                                text: 'images ' + index
                            } as any as ValueInterface
                        } else {
                            values[index].views = localViews;
                            values[index].text = 'images ' + index;
                            values[index]._request_mode = 'edited'
                        }
                        const vs = clearValues();
                        s.isUpdated = true
                        updateValues(vs);
                    }} />
                    {fieldErrors.images && <p className="mt-2 text-xs text-red-600">{fieldErrors.images}</p>}
                </section>

                <section>
                    {!isNewProduct && <div className="image-manager no-selectable">
                        <HoriszontalSwiper values={clearValues() as any} onActiveIndexChange={(_index) => {
                            setindex(_index)
                            s.isViewChanged = true
                        }} onDeleteValue={() => {
                            s.isUpdated = true
                            updateValues([
                                ...values.slice(0, index),
                                ...values.slice(index + 1)
                            ]);
                        }} forward={() => {
                            const nextValue = values[index + 1];
                            if (!nextValue || (nextValue.views?.length == 0) || (nextValue.views?.length == 1 && nextValue.views?.[0] == NEW_VIEW)) return false;
                            const currentvalue = values[index];
                            updateValues(values.map((v, i) => i == index ? nextValue : i == index + 1 ? currentvalue : v));
                            return true;
                        }} goBack={() => {
                            const lastValue = values[index - 1];
                            if (!lastValue || (lastValue.views?.length == 0) || (lastValue.views?.length == 1 && lastValue.views?.[0] == NEW_VIEW)) return false;
                            const currentvalue = values[index];
                            updateValues(values.map((v, i) => i == index ? lastValue : i == index - 1 ? currentvalue : v));
                            return true;
                        }} />
                    </div>}
                </section>
                {/* Utiliser grid ou flex pour organiser Nom, Description, Prix */}
                <section className="product-section-minimal grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Colonne Gauche: Nom, Description */}
                    <div className="flex flex-col gap-4">
                        {/* Nom */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-product-name'>
                                <span>{t('product.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                                <span className={`text-xs ${(productFormState.name?.trim()?.length || 0) > 56 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {(productFormState.name?.trim()?.length || 0)} / 56
                                </span>
                            </label>
                            <input
                                id='input-product-name'
                                name="name"
                                className={`block p-2 w-full rounded-md shadow-sm sm:text-sm ${fieldErrors.name ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                type="text"
                                value={productFormState.name || ''}
                                placeholder={t('product.namePlaceholder')}
                                onChange={handleInputChange}
                            />
                            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
                        </div>
                        {/* Description */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-product-description'>
                                <span>{t('product.descriptionLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                                <span className={`text-xs ${(productFormState.description?.trim()?.length || 0) > 1024 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {(productFormState.description?.trim()?.length || 0)} / 1024
                                </span>
                            </label>
                            <MarkdownEditor2
                                value={productFormState.description || ''}
                                setValue={handleMarkdownChange}
                                error={!!fieldErrors.description}
                            />
                            {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
                        </div>
                    </div>
                    {/* Colonne Droite: Prix, Catégories */}
                    <div className="flex flex-col gap-4">
                        {/* Prix */}
                        <div className='grid grid-cols-1 gap-4 min-[900px]:grid-cols-2'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='input-product-price'>{t('product.priceLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></label>
                                <div className='relative'>
                                    <input
                                        id='input-product-price'
                                        name="price"
                                        className={`block p-2 w-full rounded-md shadow-sm sm:text-sm pl-3 pr-12 ${fieldErrors.price ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                        type="number"
                                        value={productFormState.price ?? ''} // Utiliser '' si undefined
                                        placeholder="0"
                                        min="0"
                                        onChange={handleInputChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-sm text-gray-500">FCFA</div>
                                </div>
                                {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>}
                            </div>
                            {/* Prix Barré */}
                            <div>
                                <label className='block flex items-center text-sm font-medium text-gray-700 mb-1' htmlFor='input-product-barred-price'>
                                    {t('product.barredPriceLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" />
                                    <Indicator title={t('product.barredPriceTooltipTitle')} description={t('product.barredPriceTooltipDesc')} style={{ marginLeft: 'auto' }} />
                                </label>
                                <div className='relative'>
                                    <input
                                        id='input-product-barred-price'
                                        name="barred_price"
                                        className={`block p-2 w-full rounded-md shadow-sm sm:text-sm pl-3 pr-12 ${fieldErrors.barred_price ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                        type="number"
                                        value={productFormState.barred_price ?? ''} // Utiliser '' si undefined ou null
                                        placeholder={t('product.barredPricePlaceholder')}
                                        min="0"
                                        onChange={handleInputChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-sm text-gray-500">FCFA</div>
                                </div>
                                {fieldErrors.barred_price && <p className="mt-1 text-xs text-red-600">{fieldErrors.barred_price}</p>}
                            </div>
                        </div>
                        {/* Catégories */}
                        <div>
                            <h3 className="block text-sm font-medium text-gray-700 mb-2">{t('product.categoriesLabel')} <span className='text-gray-400 text-xs'>({t('common.optionalField')})</span></h3>
                            <div className='flex items-center gap-2 flex-wrap'>
                                {/* Bouton Ajouter */}
                                <button
                                    type="button"
                                    onClick={() => openChild(
                                        <ChildViewer title={t('product.selectCategoryTitle')}>
                                            <CategoriesPopup
                                                ignore={productFormState.categories_id ?? []} // Ignorer celles déjà sélectionnées
                                                onSelected={(cat) => {
                                                    updateLocalProduct((prev) => ({
                                                        ...prev,
                                                        categories_id: [...(productFormState.categories_id ?? []), cat.id]
                                                    }));
                                                    openChild(null);
                                                }}
                                            />
                                        </ChildViewer>,
                                        { background: '#3455' }
                                    )}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                    title={t('product.addCategoryTooltip')}
                                >
                                    <IoAdd size={20} />
                                </button>
                                {/* Catégories sélectionnées */}
                                {(productFormState.categories_id ?? []).map(catId => (
                                    <CategoryItemMini
                                        key={catId}
                                        category_id={catId}
                                        hoverEffect={false}
                                        onDelete={(catToDelete) => {
                                            openChild(<ChildViewer>
                                                <ConfirmDelete title={t('product.removeCategory', { name: catToDelete.name })} onCancel={() => {
                                                    openChild(null)
                                                }} onDelete={() => {
                                                    updateLocalProduct((prev) => ({
                                                        ...prev,
                                                        categories_id: (productFormState.categories_id ?? []).filter(id => id !== catToDelete.id)
                                                    }));
                                                    setTimeout(() => {
                                                        openChild(null)
                                                    }, 700);
                                                }} />
                                            </ChildViewer>)
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section Variantes (Features/Values) */}
                {!isNewProduct && productFormState.id && (
                    <section className="product-section-feature mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center flex-wrap mb-3">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                {t('product.variantsTitle')}
                            </h2>
                            <span className="flex justify-between items-center flex-wrap ">
                                <span className='text-sm ml-2 font-normal text-gray-500'>({(featuresFromState?.filter(f => !f.is_default).length || 0)} / {FEATURE_LIMIT})</span>
                                <Indicator title={t('product.variantsTooltipTitle')} description={t('product.variantsTooltipDesc', { limit: FEATURE_LIMIT })} />
                            </span>
                            <button
                                type="button"
                                onClick={() => { openNewFeature() }}
                                disabled={(featuresFromState?.filter(f => !f.is_default).length || 0) >= FEATURE_LIMIT}
                                className="text-sm ml-auto text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('product.addVariantButton')}
                            </button>
                        </div>
                        <hr className="my-3 border-gray-100" />
                        {/* Affichage des features (exclure la feature par défaut) */}
                        <div className="flex flex-col gap-4">
                            {featuresFromState?.filter(f => !f.is_default).map((f) => (
                                <Feature
                                    key={f.id}
                                    feature={f}
                                    setFeature={(cb) => {
                                        updateLocalFeatures((prev) => ({
                                            ...prev,
                                            features: (featuresFromState ?? []).map(_f => _f.id === f.id ? cb(_f) as FeatureInterface : _f)
                                        }));
                                    }}
                                    onDelete={() => {
                                        // Supprimer UNE feature du state
                                        updateLocalFeatures((prev) => ({
                                            ...prev,
                                            features: (featuresFromState ?? []).filter(_f => _f.id !== f.id)
                                        }));
                                    }}
                                />
                            ))}
                            {/* Message si aucune variante ajoutée */}
                            {(featuresFromState?.filter(f => !f.is_default).length === 0) && (
                                <p className="text-sm text-gray-500 italic text-center py-4">{t('product.noVariantsAdded')}</p>
                            )}
                        </div>
                    </section>
                )}

                {/* Bouton Flottant (déplacé depuis la fin) */}
                <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50 transition-opacity duration-300 ${isLoadingMutation || isNewProduct ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {isLoadingMutation}
                </div>

                {/* Autres Sections (Settings, Commandes - affichées seulement en mode édition) */}
                {!isNewProduct && productFormState.id && (
                    <>
                        <section className="product-settings mt-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('product.advancedSettingsTitle')}</h2>
                            <ProductSettings onSelected={(action) => {
                                logger.info("Action selected from ProductSettings:", action);
                                // Gérer la navigation ou les actions ici
                                if (action === 'delete') handleDelete();
                                else nextPage(`/products/${productFormState.id}/${action}`)
                            }} />
                        </section>

                        <section className="product-commands mt-4">
                            <CommandeList product_id={productFormState.id} />
                        </section>
                    </>
                )}

            </main>
        </div>
    );
}


// --- Nouveau Composant ProductSettings --- (à mettre dans son propre fichier idéalement)
const Settings = [
    // Garder la structure mais adapter les clés i18n pour 'show'
    { name: 'price-stock', showKey: 'productSettings.priceStock', url: '/res/icons/money.png', color: '#4CAF50', shadow: '#388E3C' },
    { name: 'details', showKey: 'productSettings.details', url: '/res/icons/details.png', color: '#607D8B', shadow: '#455A64' },
    { name: 'promo', showKey: 'productSettings.promo', url: '/res/icons/promo.png', color: '#FF9800', shadow: '#F57C00' },
    { name: 'inventory', showKey: 'productSettings.inventory', url: '/res/icons/inventory.png', color: '#3F51B5', shadow: '#303F9F' }, // Caché si non pertinent
    { name: 'affiliation', showKey: 'productSettings.affiliation', url: '/res/icons/affiliation.png', color: '#9C27B0', shadow: '#7B1FA2' }, // Caché si non pertinent
    { name: 'show-stats', showKey: 'productSettings.stats', url: '/res/icons/stats.png', color: '#2196F3', shadow: '#1976D2' },
    { name: 'comments', showKey: 'productSettings.comments', url: '/res/icons/comments.png', color: '#FFC107', shadow: '#FFA000' },
    { name: 'delete', showKey: 'productSettings.delete', url: '/res/icons/delete.png', color: '#F44336', shadow: '#D32F2F' },
];

function ProductSettings({ onSelected }: { onSelected: (type: string) => void }) {
    const { t } = useTranslation();
    const s = useWindowSize().width;
    // Calcul slide per view (simplifié)
    const n = s < 550 ? 2 : s < 900 ? 3 : 4; // Ajuster selon besoin

    return (
        <Swiper
            slidesPerView={n}
            grid={{ rows: 2 }}
            spaceBetween={15} // Espace entre slides
            pagination={{ clickable: true }}
            modules={[Grid, Pagination]}

            // Ajouter padding horizontal pour voir les slides partielles
            // Les styles Swiper peuvent nécessiter des ajustements globaux ou via props
            className="product-settings-swiper py-4" // Ajouter py-4 pour pagination
            style={{ height: '300px', overflow: 'visible' }} // Permettre aux ombres de déborder
        >
            {Settings.map(s => (
                <SwiperSlide key={s.name} className="h-auto pb-8"> {/* Ajouter padding bottom pour pagination */}
                    {/* Carte Setting */}
                    <button // Utiliser un bouton pour l'accessibilité
                        type="button"
                        onClick={() => onSelected(s.name)}
                        className={`no-select setting w-full aspect-square rounded-xl p-3 flex flex-col justify-between items-center cursor-pointer transition duration-150 hover:scale-105`}
                        style={{ backgroundColor: s.color, boxShadow: `0px 4px 12px -4px ${s.shadow}` }} // Style inline pour couleurs dynamiques
                    >
                        <img src={s.url} alt={t(s.showKey)} className="w-12 h-12 object-contain" /> {/* Icone plus grande */}
                        <span className="name text-white text-xs font-medium text-center mt-1">{t(s.showKey)}</span>
                    </button>
                </SwiperSlide>
            ))}
            {/* Ajouter slides vides si besoin pour compléter la grille? Non nécessaire avec Swiper Grid */}
        </Swiper>
    );
}

