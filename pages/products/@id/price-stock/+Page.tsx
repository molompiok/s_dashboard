// pages/products/@id/price-stock/+Page.tsx
// import './+Page.css'; // ❌ Supprimer

import { useEffect, useState, useMemo } from "react";
import { IoCheckmark } from "react-icons/io5";
import { Value } from "../../../../Components/Feature/Feature"; // Composant d'affichage de valeur
import { getAllCombinations, ClientCall, getOptions } from "../../../../Components/Utils/functions"; // Utilitaires
import { FeatureInterface, ProductInterface, ValueInterface } from "../../../../Interfaces/Interfaces";
// import { useProductStore } from "../../ProductStore"; // Remplacé par hooks API
import { useGetProductList, useMultipleUpdateFeaturesValues } from '../../../../api/ReactSublymusApi'; // ✅ Hooks API
import { usePageContext } from "../../../../renderer/usePageContext";
import { useGlobalStore } from "../../../stores/StoreStore";
// import { useApp } from "../../../../renderer/AppStore/UseApp"; // Remplacé par useChildViewer
import { ChildViewer } from "../../../../Components/ChildViewer/ChildViewer";
import { ValuePricing } from "../../../../Components/ValuePricing/ValuePricing"; // Formulaire prix/stock
import { Confirm } from "../../../../Components/Confirm/Confirm"; // Bouton de confirmation
import { Topbar } from "../../../../Components/TopBar/TopBar"; // Topbar
import { useTranslation } from "react-i18next"; // ✅ i18n
import logger from "../../../../api/Logger"; // Logger
import { EDITED_DATA } from "../../../../Components/Utils/constants";
import { SaveButton } from "../../../../Components/SaveButton/SaveButton";
import { useChildViewer } from "../../../../Components/ChildViewer/useChildViewer";
import { StockProductSkeleton } from "../../../../Components/Skeletons/allsKeletons";
import { PageNotFound } from "../../../../Components/PageNotFound/PageNotFound";

export { Page };

// Interface pour les combinaisons générées
type Combination = ReturnType<typeof getOptions>; // Utiliser le type retour de getOptions

function Page() {
    const { t } = useTranslation(); // ✅ i18n
    // const { fetchProductBy, updateProduct } = useProductStore(); // Remplacé
    const { routeParams } = usePageContext();
    const { currentStore } = useGlobalStore();
    const productId = routeParams?.['id'];

    // --- State ---
    const [product, setProduct] = useState<Partial<ProductInterface> | undefined>(undefined);
    const [features, setFeatures] = useState<FeatureInterface[]>([]); // Stocker les features séparément pour mise à jour
    const [filter, setFilter] = useState<Record<string, string[]>>({}); // Filtre pour afficher combinaisons
    const [allCombinations, setAllCombinations] = useState<Combination[]>([]);

    // --- API Data Fetching ---
    const {
        data: productData,
        isLoading: isLoadingProduct,
        isError: isFetchError,
        error: fetchError,
        refetch: refetchProduct // Pour recharger après sauvegarde
    } = useGetProductList(
        { product_id: productId, with_feature: true },
        { enabled: !!productId && productId !== 'new' } // Activer seulement si ID produit valide
    );

    // --- API Data Mutation ---
    const multipleUpdateMutation = useMultipleUpdateFeaturesValues();

    // Mettre à jour l'état local quand les données arrivent
    useEffect(() => {
        const fetchedProduct = productData?.list?.[0];
        if (fetchedProduct) {
            setProduct(fetchedProduct);
            setFeatures(fetchedProduct.features || []);
            // Calculer toutes les combinaisons initialement
            setAllCombinations(getAllCombinations(fetchedProduct as ProductInterface));
            logger.info("Product data loaded for price/stock management", { productId: fetchedProduct.id });
        }
    }, [productData]);


    // --- Filtering Logic ---
    // Filtre les combinaisons basées sur la sélection dans 'filter'
    const filteredCombinations = useMemo(() => {
        if (Object.keys(filter).length === 0) return allCombinations; // Tout afficher si pas de filtre
        return allCombinations.filter(comb => {
            for (const f_id in filter) {
                // Si la feature est dans le filtre mais que la combinaison n'a pas la valeur sélectionnée
                if (filter[f_id]?.length > 0 && !filter[f_id]?.includes(comb.bind[f_id])) {
                    return false; // Exclure cette combinaison
                }
            }
            return true; // Inclure si passe tous les filtres
        });
    }, [filter, allCombinations]);

    // --- Handlers ---
    const handleFilterToggle = (featureId: string, valueId: string) => {
        setFilter(current => {
            const currentFeatureFilter = current[featureId] || [];
            const newFeatureFilter = currentFeatureFilter.includes(valueId)
                ? currentFeatureFilter.filter(id => id !== valueId)
                : [...currentFeatureFilter, valueId];

            // Si le nouveau filtre est vide pour cette feature, retirer la clé
            if (newFeatureFilter.length === 0) {
                const { [featureId]: _, ...rest } = current; // Retirer la clé featureId
                return rest;
            } else {
                return { ...current, [featureId]: newFeatureFilter };
            }
        });
    };

    // Sauvegarde toutes les features modifiées via la mutation multiple
    const saveChanges = async () => {
        if (!product?.id) return

        multipleUpdateMutation.mutate({
            product_id: product?.id,
            currentFeatures: features,
            initialFeatures: product?.features || []
        }, {
            onSuccess: (updatedProductData) => {
                logger.info("Price/stock updated successfully", { productId: product.id });

                if (!updatedProductData.product) return

                setProduct(updatedProductData.product);
                setFeatures(updatedProductData.product.features || []);
                setAllCombinations(getAllCombinations(updatedProductData.product as ProductInterface));
                // Afficher toast succès
            },
            onError: (error) => {
                logger.error({ error }, "Price/stock update failed");
                // Afficher toast erreur
            }
        });
    };

  const [isPageLoading, setIsPageLoading] = useState(true);
    useEffect(() => {
        setIsPageLoading(false)
    }, []);
    
    // --- Rendu ---
    if(isPageLoading) return <StockProductSkeleton/>
    if (isLoadingProduct) return <StockProductSkeleton/>
    if (isFetchError) return <PageNotFound title={t('product.notFound')} description={fetchError?.message} />;
    if (!product) return <PageNotFound title={t('product.notFound')} />;


    return (
        // Utiliser flex flex-col
        <div className="w-full flex flex-col bg-gray-50 min-h-screen">
            <Topbar back={true} title={t('priceStock.pageTitle', { name: product.name }).toString()} />
            {/* Ajouter Titre */}
            <main className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* Section Filtres */}
                {/* Utiliser grid ou flex-wrap pour les features */}
                <section className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">{t('priceStock.filterTitle')}</h2>
                    <div className="flex flex-col gap-4">
                        {features.filter(f => !f.is_default && (f.values?.length ?? 0) > 0).map(f => ( // Exclure feature par défaut
                            <div key={f.id} className="bind-feature">
                                {/* Utiliser text-sm font-medium text-gray-600 mb-2 */}
                                <h3 className="text-sm font-medium text-gray-600 mb-2">{f.name}</h3>
                                {/* Utiliser flex flex-wrap gap-2 */}
                                <div className="bind-feature-values flex flex-wrap gap-2">
                                    {f.values?.map(v => (
                                        // Bouton Checkable
                                        <button
                                            type="button"
                                            key={v.id}
                                            // Appliquer styles Tailwind conditionnels
                                            className={`checkable inline-flex items-center gap-1.5 p-1 border rounded-md cursor-pointer transition hover:bg-gray-50 ${(filter[f.id!]?.includes(v.id)) ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                                                }`}
                                            onClick={() => handleFilterToggle(f.id!, v.id)}
                                        >
                                            {/* Checkbox visuelle */}
                                            <span className={`check w-5 h-5 flex items-center justify-center rounded border transition ${(filter[f.id!]?.includes(v.id)) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400 text-transparent'
                                                }`}>
                                                <IoCheckmark className="mark w-3.5 h-3.5" />
                                            </span>
                                            {/* Affichage de la valeur */}
                                            {/* Utiliser Value pour affichage cohérent */}
                                            <Value feature={f} value={v} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section Combinaisons */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">{t('priceStock.combinationsTitle')} ({filteredCombinations.length})</h2>
                    {/* Utiliser flex flex-col gap-3 */}
                    <div className="flex flex-col gap-3">
                        {filteredCombinations.length === 0 && (
                            <p className="text-sm text-gray-500 italic py-4 text-center">{t('priceStock.noCombinationMatch')}</p>
                        )}
                        {filteredCombinations.map((bind, index) => (
                            // Appliquer styles Tailwind pour chaque ligne de combinaison
                            <div key={index} className="bind bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Lignes de valeurs */}
                                <div className="bind-rows border-b border-gray-200">
                                    {Object.keys(bind.bind).map((f_id: string) => {
                                        const f = features.find(feat => feat.id === f_id);
                                        const v = f?.values?.find(val => val.id === bind.bind[f_id]);
                                        return v && f && (
                                            // Appliquer styles Tailwind pour chaque ligne de valeur
                                            <ValueRow
                                                key={f_id}
                                                feature={f}
                                                value={v}
                                                // Passer une fonction pour mettre à jour UNE SEULE valeur dans l'état 'features'
                                                onValueChange={(updatedValue) => {
                                                    setFeatures(currentFeatures =>
                                                        currentFeatures.map(feat =>
                                                            feat.id === f_id
                                                                ? {
                                                                    ...feat,
                                                                    values: feat.values?.map(val => val.id === updatedValue.id ? updatedValue : val),
                                                                    [EDITED_DATA]: EDITED_DATA // Marquer feature comme éditée
                                                                }
                                                                : feat
                                                        )
                                                    );
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                {/* Résumé Prix/Stock */}
                                {/* Utiliser grid ou flex pour organiser */}
                                <div className="p-3 bg-gray-50 grid grid-cols-2 sm:flex sm:justify-end sm:items-center gap-x-4 gap-y-1 text-sm">
                                    <div className="rt flex justify-between sm:justify-start items-center gap-2">
                                        <b className="font-normal text-gray-600">{t('priceStock.basePrice')}:</b>
                                        <span className="font-medium text-gray-800 whitespace-nowrap">{Number(product?.price || 0).toLocaleString()} {product?.currency}</span>
                                    </div>
                                    <div className="rt flex justify-between sm:justify-start items-center gap-2">
                                        <b className="font-normal text-gray-600">{t('priceStock.combinationPrice')}:</b>
                                        <span className="font-semibold text-gray-900 whitespace-nowrap">{(Number(product?.price || 0) + Number(bind.additional_price || 0)).toLocaleString()} {product?.currency}</span>
                                    </div>
                                    <div className={`rt flex justify-between sm:justify-start items-center gap-2 ${bind.stock === null || bind.stock === undefined ? 'text-green-600' : (bind.stock <= 0 ? 'text-red-600' : 'text-gray-600')}`}>
                                        <b className="font-normal">{t('priceStock.stockLabel')}:</b>
                                        <span className="font-medium whitespace-nowrap">
                                            {bind.stock === null || bind.stock === undefined ? t('value.unlimitedStock') : bind.stock}
                                        </span>
                                    </div>
                                    {/* Afficher les booléens de manière plus claire */}
                                    {/* <div className="rt"><b>diminue le stock </b><span className={`check ${bind.decreases_stock ? 'ok' : 'no'}`}></span></div> */}
                                    {/* <div className="rt"><b>Vendre sans stock </b><span className={`check ${bind.continue_selling ? 'ok' : 'no'}`}></span></div> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bouton Sauvegarder (Flottant ou fixe en bas) */}
                {/* Afficher seulement si des changements ont été faits */}
                {features.some(f => (f as any)[EDITED_DATA]) && (
                    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50">
                        <SaveButton
                            loading={multipleUpdateMutation.isPending}
                            required={true} // Actif s'il y a des changements
                            onClick={saveChanges}
                            title={t('priceStock.saveButton')}
                        />
                    </div>
                )}

            </main>
        </div>
    );
}

// --- Composant ValueRow ---
interface ValueRowProps {
    feature: FeatureInterface;
    value: ValueInterface;
    onValueChange: (updatedValue: ValueInterface) => void;
}

function ValueRow({ feature, value: currentValue, onValueChange }: ValueRowProps) {
    const { openChild } = useChildViewer();
    const { t } = useTranslation(); // ✅ i18n

    // L'état local de la valeur sera géré dans le popup
    const handleRowClick = () => {
        openChild(<ChildViewer title={t('priceStock.editValuePopupTitle', { name: currentValue.text })} back>
            <div className="p-4 sm:p-6"> {/* Padding pour le contenu du popup */}
                {/* Afficher le nom de la feature/valeur */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <Value feature={feature} value={currentValue} />
                    <span className='text-sm font-medium text-gray-500'>{feature.name}:</span>
                </div>
                {/* Formulaire ValuePricing */}
                <ValuePricing
                    value={currentValue} // Passer la valeur actuelle
                    addToValue={(updatedPricingData) => {
                        // Mettre à jour l'état parent directement ici, ou juste à la confirmation
                        // Pour l'instant, on met à jour seulement à la confirmation
                    }}
                />
                {/* Bouton Confirmer */}
                <Confirm
                    canConfirm={true} // Toujours confirmable pour le moment
                    onCancel={() => openChild(null)}
                    confirm={t('common.save')}
                    // À la confirmation, remonter la valeur mise à jour
                    onConfirm={() => { // Récupérer les données du formulaire si ValuePricing les gère
                        // Solution simple: on suppose que ValuePricing a mis à jour l'objet currentValue via référence (mutable)
                        // C'est pas idéal. Mieux: ValuePricing retourne les nouvelles données.
                        // Ici, on va juste remonter la valeur existante marquée comme éditée.
                        //  const updatedValue = { ...currentValue, ...pricingDataFromForm, [EDITED_DATA]: EDITED_DATA };
                        //  onValueChange(updatedValue);
                        openChild(null);
                    }}
                />
            </div>
        </ChildViewer>, { background: '#3455' });
    };

    return (
        // Appliquer styles Tailwind pour la ligne
        <div
            className="bind-row flex items-center px-3 py-1.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            onClick={handleRowClick} // Ouvrir popup au clic sur la ligne
        >
            {/* Feature Name */}
            <div className="bind-cell-feature flex-1 w-1/3 sm:w-auto text-sm text-gray-600 truncate pr-2">{feature.name}</div>
            {/* Value Display */}
            {/* Utiliser w-1/3 sm:w-auto sm:max-w-[180px] */}
            <div className="bind-cell-value w-1/3 sm:w-auto sm:max-w-[180px] flex justify-center items-center px-2">
                <Value feature={feature} value={{ ...currentValue }} />
            </div>
            {/* Price & Stock */}
            {/* Utiliser w-1/3 sm:w-auto flex justify-end */}
            <div className="bind-column w-1/3 sm:w-auto flex justify-end items-center gap-4 sm:gap-6">
                {/* Additional Price */}
                {/* Utiliser w-20 text-right */}
                <div className="bind-cell-price flex flex-col items-end w-20">
                    <span className="text-sm font-medium text-gray-800">
                        {currentValue.additional_price && currentValue.additional_price !== 0 ? `+${Number(currentValue.additional_price).toLocaleString()}` : '-'}
                    </span>
                    {/* <span className="text-xs text-gray-400">FCFA</span> */}
                </div>
                {/* Stock */}
                {/* Utiliser w-20 text-right */}
                <div className={`bind-cell-stock flex flex-col items-end w-20 ${currentValue.stock === null || currentValue.stock === undefined ? 'text-green-600' : (currentValue.stock <= 0 ? 'text-red-600' : 'text-gray-600')}`}>
                    <span className="text-sm font-medium">
                        {currentValue.stock === null || currentValue.stock === undefined ? t('value.unlimitedStockShort') : currentValue.stock}
                    </span>
                    {/* <span className="text-xs">{t('priceStock.stockLabel')}</span> */}
                </div>
            </div>
        </div>
    );
}