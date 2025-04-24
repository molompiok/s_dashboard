// pages/products/@id/+Page.tsx (ou /products/new/+Page.tsx)

// --- Imports ---
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'; // Ajouter useCallback
import { usePageContext } from '../../../renderer/usePageContext';
import { useStore } from '../../stores/StoreStore';
// ✅ Importer les hooks API nécessaires
import {
    useGetProducts, // Pourrait être utilisé pour charger l'original
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useMultipleUpdateFeaturesValues
} from '../../../api/ReactSublymusApi';
import { FeatureInterface, ProductInterface } from '../../../Interfaces/Interfaces';
import { Topbar } from '../../../Components/TopBar/TopBar';
// Importer les composants UI (seront refactorisés plus tard)
import { SwiperProducts } from '../../../Components/SwiperProducts/SwiperProducts';
import { CategoryItemMini } from '../../../Components/CategoryItem/CategoryItemMini';
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup';
import { Feature } from '../../../Components/Feature/Feature';
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor';
import { CommandeList } from '../../../Components/CommandesList/CommandesList';
import { SaveButton } from '../../../Components/SaveButton/SaveButton';
import { Indicator } from '../../../Components/Indicator/Indicator';
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
// Importer les utilitaires
import { ClientCall, debounce } from '../../../Components/Utils/functions';
import { NEW_ID_START, EDITED_DATA } from '../../../Components/Utils/constants';
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
// Constantes
const FEATURE_LIMIT = 5; // Limite de features

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
    const {replaceLocation,nextPage} = useMyLocation()
    const productIdFromRoute = routeParams?.['id'];
    const isNewProduct = productIdFromRoute === 'new';

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
     // État pour l'index de l'image/valeur affichée dans SwiperProducts
     const [currentImageIndex, setCurrentImageIndex] = useState(0);
     // État pour savoir si on déclenche l'auto-save
     const [shouldAutoSave, setShouldAutoSave] = useState(false);


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
            setFieldErrors({});
            setShouldAutoSave(false); // Ne pas auto-save au chargement
            setCurrentImageIndex(0); // Revenir à la première image
             logger.info("Product data loaded for editing", { productId: fetchedProduct.id });
        }
        // Reset si on navigue vers /new
        if (isNewProduct) {
            setProductFormState(initialEmptyProduct);
            setOriginalProductData(initialEmptyProduct);
            setFieldErrors({});
             setShouldAutoSave(false);
             setCurrentImageIndex(0);
        }
    }, [isNewProduct, isFetchSuccess, fetchedProductData, productIdFromRoute]);


    // --- Mutations API ---
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct(); // Pour infos de base
    const multipleUpdateMutation = useMultipleUpdateFeaturesValues(); // Pour features/values
    const deleteProductMutation = useDeleteProduct();

    const isLoadingMutation = createProductMutation.isPending || updateProductMutation.isPending || multipleUpdateMutation.isPending || deleteProductMutation.isPending;

    // --- Détection des changements ---
    const hasChanges = useMemo(() => {
         if (isNewProduct || !originalProductData) return false; // Pas de "changements" pour un nouveau produit avant la première sauvegarde
         // Comparaison (à affiner, surtout pour les features/values/fichiers)
          // Pour une détection simple, on pourrait comparer le JSON stringifié, mais c'est coûteux.
          // Pour l'instant, on se base sur l'état 'shouldAutoSave' qui est activé par les handlers.
         return shouldAutoSave; // Retourne true si un changement a activé l'auto-save
    }, [productFormState, originalProductData, isNewProduct, shouldAutoSave]);

    // --- Fonctions de Mise à Jour de l'État Local ---
    const updateLocalData = useCallback((newData: Partial<ProductInterface>) => {
        setProductFormState(prev => ({ ...prev, ...newData }));
        setShouldAutoSave(true); // Marquer qu'un changement a eu lieu
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement; // Cast pour checked
        const fieldValue = type === 'checkbox' ? checked : value;
        updateLocalData({ [name]: fieldValue });
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }, [updateLocalData]);

    const handleMarkdownChange = useCallback((value: string) => {
        updateLocalData({ description: value });
        setFieldErrors(prev => ({ ...prev, description: '' }));
    }, [updateLocalData]);

    // --- Logique pour extraire les Values de la feature par défaut ---
    const defaultFeatureValues = useMemo(() => {
        const defaultFeature = productFormState.features?.find(f => f.id === productFormState.default_feature_id || f.is_default);
        return defaultFeature?.values ?? [];
    }, [productFormState.features, productFormState.default_feature_id]);

    // --- Handler pour mettre à jour les images depuis SwiperProducts ---
    const handleViewsUpdate = useCallback((newViewsForValue: (string | Blob)[]) => {
         // Mettre à jour la 'Value' correspondante dans la feature par défaut
         const defaultFeatureId = productFormState.default_feature_id || productFormState.features?.find(f => f.is_default)?.id;
         if (!defaultFeatureId) {
              logger.error("Cannot update views: default feature not found.");
              return; // Ne devrait pas arriver si la structure est correcte
         }

         updateLocalData({
             features: (productFormState.features ?? []).map(f => {
                 if (f.id !== defaultFeatureId) return f;
                 // Trouver ou créer la 'Value' à l'index courant
                 let currentValues = [...(f.values ?? [])];
                 let targetValue = currentValues[currentImageIndex];

                 if (!targetValue) {
                     // Si l'index n'existe pas (ex: après suppression), on l'ajoute?
                     // Ou on met à jour le dernier existant?
                     // Pour l'instant, créons une nouvelle Value si index hors limites
                     targetValue = {
                         id: NEW_ID_START + Date.now(), // Nouvel ID temporaire
                         index: currentImageIndex,
                         text: `Image ${currentImageIndex + 1}`, // Nom par défaut
                         // autres champs par défaut...
                     } as any;
                     currentValues[currentImageIndex] = targetValue; // Insérer à l'index
                     // Ou currentValues.push(targetValue) si on ajoute à la fin?
                 }

                 // Mettre à jour les vues pour cette valeur spécifique
                 const updatedValue = {
                     ...targetValue,
                     views: newViewsForValue,
                     [EDITED_DATA]: EDITED_DATA // Marquer comme modifié
                 };
                 currentValues[currentImageIndex] = updatedValue;

                 return { ...f, values: currentValues, [EDITED_DATA]: EDITED_DATA }; // Retourner feature mise à jour
             })
         });
         // L'état local des vues dans SwiperProducts sera géré par lui-même,
         // mais productFormState est maintenant à jour.

    }, [productFormState.features, productFormState.default_feature_id, currentImageIndex, updateLocalData]);


    // --- Validation et Sauvegarde (Logique à implémenter dans les prochaines étapes) ---
     const validateForm = (): boolean => {
         // TODO: Implémenter la validation complète
         logger.warn("validateForm not fully implemented yet.");
         const errors: { [key: string]: string } = {};
         let isValid = true;
         if (!productFormState.name || productFormState.name.trim().length < 3) {
             errors.name = t('category.validation.nameRequired'); // Réutiliser clé? Non, clé produit
             isValid = false;
         }
          if (!productFormState.price || productFormState.price <= 0) {
             errors.price = t('product.validation.priceRequired'); // Nouvelle clé
             isValid = false;
         }
         // Ajouter autres validations...
        //   if (defaultFeatureValues.length === 0 || defaultFeatureValues.every(v => v.views?.length === 0)) {
        //      errors.images = t('product.validation.imageRequired'); // Nouvelle clé
        //      isValid = false;
        //  }

        //  setFieldErrors(errors);
         return isValid;
     };

     const handleDelete = () => {
          // TODO: Implémenter la logique de suppression
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

      // --- 🚀 Itération 1: handleSave (Création et Update Simple) ---
    const handleSave = async (isAuto = false) => {
        if (isLoadingMutation) return;
        if (!validateForm()) {
            logger.warn("Save prevented by validation errors.");
            // Afficher un toast d'erreur de validation?
            // toast.error(t('validationFailed'));
            return;
        }
        // Si c'est une MAJ manuelle et qu'il n'y a pas de changement, ne rien faire
        if (!isNewProduct && !hasChanges && !isAuto) {
             logger.info("Update skipped, no changes detected.");
             // toast.info(t('product.noChangesToSave')); // Nouvelle clé i18n
             return;
        }

        setShouldAutoSave(false); // Désactiver auto-save pendant sauvegarde

        // --- Construire FormData pour Create ou Update Simple ---
        const formData = new FormData();
        let hasFileChanges = false; // Pour savoir si on a ajouté des fichiers

        // // 1. Champs Texte/Numériques/Booléens
        //  // Champs à inclure pour la création ou s'ils ont changé pour l'update
         const fieldsToProcess: (keyof ProductInterface)[] = ['name', 'description', 'price', 'barred_price', 'is_visible', 'currency']; // Ajouter currency?
         fieldsToProcess.forEach(key => {
             const currentValue = productFormState[key];
             const originalValue = originalProductData?.[key];
             // Inclure si nouveau OU si différent de l'original (gérer null/undefined comme égaux?)
             const shouldInclude = isNewProduct || currentValue !== originalValue;
             // Gérer cas spécifiques (ex: prix à 0, booléens)
             if (shouldInclude && currentValue !== undefined && currentValue !== null) {
                  // Convertir booléen en string 'true'/'false' pour FormData
                 formData.append(key, typeof currentValue === 'boolean' ? String(currentValue) : String(currentValue));
             } else if (shouldInclude && (currentValue === null || currentValue === undefined) && (key === 'barred_price' || key === 'description')) {
                 // Envoyer une chaîne vide pour remettre à null certains champs optionnels?
                 // L'API doit gérer la chaîne vide comme une intention de mettre à null.
                 formData.append(key, '');
             }
         });

         // 2. Catégories (toujours envoyer le tableau actuel, même s'il est vide)
         const categoriesChanged = JSON.stringify(productFormState.categories_id ?? []) !== JSON.stringify(originalProductData?.categories_id ?? []);
         if (isNewProduct || categoriesChanged) {
             formData.append('categories_id', JSON.stringify(productFormState.categories_id ?? []));
         }

        // 3. Images Principales (depuis defaultFeatureValues)
         // Itérer sur les values de la feature par défaut pour trouver les nouveaux fichiers
         defaultFeatureValues.forEach((value, index) => {
             const views = value.views ?? [];
             views.forEach((view, viewIndex) => {
                 if (view instanceof File) { // Si c'est un nouveau fichier
                     // Générer un nom de champ unique pour le backend (ex: views_valueId_index)
                     // Ou utiliser l'approche `views_0`, `views_1` si `createFiles/updateFiles` le gère
                     const fieldName = `views_${index}_${viewIndex}`; // Exemple
                     formData.append(fieldName, view);
                     hasFileChanges = true;

                     // Ajouter la référence au pseudo-champ 'views' attendu par createFiles/updateFiles
                      // Cela devient complexe ici sans savoir comment l'API gère les fichiers
                      // pour une feature/value spécifique lors de la création/MAJ produit.
                      // **Hypothèse Simplifiée pour S0:** On envoie juste les fichiers de la première value (index 0)
                      // pour la création et on gère la MAJ des features/values séparément.
                      // **Donc, on n'ajoute PAS de champ 'views' JSON ici pour l'update simple.**
                 }
             });
         });

         // **Pour la création (isNewProduct):**
         // Ajouter le champ 'views' JSON et les fichiers pour la première Value (index 0)
         if (isNewProduct) {
              const firstValueFiles = defaultFeatureValues[0]?.views?.filter(v => v instanceof File) as File[] ?? [];
              const fileKeys: string[] = [];
              firstValueFiles.forEach((file, idx) => {
                   const key = `views_${idx}`;
                   formData.append(key, file);
                   fileKeys.push(key);
                   hasFileChanges = true;
              });
              if (fileKeys.length > 0) {
                  formData.append('views', JSON.stringify(fileKeys)); // Champ 'views' pour createFiles
              } else {
                  // Gérer le cas où aucune image n'est fournie à la création (validation devrait l'empêcher)
                  logger.error("No initial images provided for new product creation.");
                  // setFieldErrors(prev => ({ ...prev, images: t('product.validation.imageRequired') }));
                  // return; // Arrêter si aucune image (ou laisser l'API gérer?)
              }
               // Ajouter un nom de feature par défaut si besoin à la création? L'API le fait déjà.
              // formData.append('default_feature_name', t('product.defaultVariantFeatureName'));
         }


         // --- Appeler la Mutation ---
         if (isNewProduct) {
             logger.info("Calling createProduct mutation", Object.fromEntries(formData.entries())); // Log FormData content
             createProductMutation.mutate(formData, {
                 onSuccess: (data) => {
                     logger.info("Product created successfully", data);
                     setProductFormState(data.product); // Mettre à jour avec données serveur (qui inclut default_feature_id)
                     setOriginalProductData(data.product);
                     setFieldErrors({});
                     setShouldAutoSave(false); // Reset flag
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
         } else {
             // Mise à jour Simple (uniquement si des changements hors features/values)
             // **NOTE:** Cette condition est simpliste. Idéalement, on détecte SI les features/values ont changé.
             // Pour S0, on appelle updateProduct pour les modifs simples. handleSave sera étendu plus tard.
             const featuresChanged = false/* TODO: Logique pour détecter changement dans features/values */;
             if (!featuresChanged && hasChanges) { // Si seulement infos simples ont changé
                  if (!productFormState.id) return; // Sécurité
                  formData.append('product_id', productFormState.id);
                  logger.info("Calling updateProduct mutation", Object.fromEntries(formData.entries()));
                  updateProductMutation.mutate(formData, {
                     onSuccess: (data) => {
                         logger.info("Product updated successfully (simple)", data);
                         const updatedProduct = { ...originalProductData, ...data.product }; // Merger avec l'original pour garder les features/values
                         setProductFormState(updatedProduct);
                         setOriginalProductData(updatedProduct);
                         setFieldErrors({});
                         setShouldAutoSave(false); // Reset flag
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
             } else if (featuresChanged) {
                  // Appel à handleSave pour features/values (sera fait dans une prochaine itération)
                  logger.warn("Feature/Value changes detected, multipleUpdateFeaturesValues call not implemented yet in handleSave.");
                   // Pour l'instant, on ne sauvegarde rien si les features ont changé
                   // Ou on pourrait appeler updateProduct quand même pour les infos simples?
                  setShouldAutoSave(false); // Reset flag pour éviter boucle si erreur
             }

         }
    };
    // --- Fin Itération 1: handleSave ---

     // --- Auto Save (Logique de base) ---
      useEffect(() => {
         if (isNewProduct || !hasChanges || !shouldAutoSave || isLoadingMutation) return;
         const handler = debounce(() => {
              logger.debug("Triggering auto-save for product...");
              if (validateForm()) {
                  handleSave(true);
              } else {
                   logger.warn("Product auto-save skipped due to validation errors.");
              }
         }, 'product-auto-save', 3000);
         // return () => handler.cancel(); // Si debounce retourne une fonction cancel
      }, [productFormState, hasChanges, shouldAutoSave, isNewProduct, isLoadingMutation]);


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

    console.log({productFormState});
    

    return (
        <div className="product-detail-page w-full flex flex-col bg-gray-50 min-h-screen">
            <Topbar back={true} />
            {/* Utiliser max-w-4xl ou 5xl pour plus d'espace, gap-6 ou 8 */}
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 pb-24">

            <section className="views">
                    <SwiperProducts
                        // 🚨 Correction: Passer les vues de la value courante
                        views={defaultFeatureValues[currentImageIndex]?.views ?? []}
                        setViews={handleViewsUpdate}
                        initialIndex={currentImageIndex} // Contrôler l'index
                        onIndexChange={setCurrentImageIndex}
                    />
                    {fieldErrors.images && <p className="mt-2 text-xs text-red-600">{fieldErrors.images}</p>}
                 </section>

                 {/* Section Infos Minimales */}
                 {/* Utiliser grid ou flex pour organiser Nom, Description, Prix */}
                 <section className="product-section-minimal grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Colonne Gauche: Nom, Description */}
                     <div className="flex flex-col gap-4">
                         {/* Nom */}
                         <div>
                              <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-product-name'>
                                  <span>{t('product.nameLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                                  <span className={`text-xs ${ (productFormState.name?.trim()?.length || 0) > 56 ? 'text-red-600' : 'text-gray-400'}`}>
                                     {(productFormState.name?.trim()?.length || 0)} / 56
                                 </span>
                              </label>
                              <input
                                  id='input-product-name'
                                  name="name"
                                  className={`block w-full rounded-md shadow-sm sm:text-sm ${fieldErrors.name ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
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
                                    <span className={`text-xs ${ (productFormState.description?.trim()?.length || 0) > 1024 ? 'text-red-600' : 'text-gray-400'}`}>
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
                          <div className='grid grid-cols-2 gap-4'>
                              <div>
                                   <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='input-product-price'>{t('product.priceLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></label>
                                   <div className='relative'>
                                       <input
                                           id='input-product-price'
                                           name="price"
                                           className={`block w-full rounded-md shadow-sm sm:text-sm pl-3 pr-12 ${fieldErrors.price ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
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
                                   <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='input-product-barred-price'>
                                        {t('product.barredPriceLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" />
                                        <Indicator title={t('product.barredPriceTooltipTitle')} description={t('product.barredPriceTooltipDesc')} style={{ marginLeft: 'auto' }} />
                                    </label>
                                   <div className='relative'>
                                        <input
                                            id='input-product-barred-price'
                                            name="barred_price"
                                             className={`block w-full rounded-md shadow-sm sm:text-sm pl-3 pr-12 ${fieldErrors.barred_price ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
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
                                                          updateLocalData({ categories_id: [...(productFormState.categories_id ?? []), cat.id] });
                                                           openChild(null);
                                                      }}
                                                 />
                                             </ChildViewer>,
                                             { background: '#3455' }
                                         )}
                                         className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                         title={t('product.addCategoryTooltip')}
                                     >
                                         <IoAdd size={20}/>
                                     </button>
                                      {/* Catégories sélectionnées */}
                                     {(productFormState.categories_id ?? []).map(catId => (
                                         <CategoryItemMini
                                             key={catId}
                                             category_id={catId}
                                             hoverEffect={false}
                                             onDelete={(catToDelete) => {
                                                  updateLocalData({ categories_id: (productFormState.categories_id ?? []).filter(id => id !== catToDelete.id) });
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
                           <div className="flex justify-between items-center mb-3">
                               <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                   {t('product.variantsTitle')} 
                                    <span className='text-sm font-normal text-gray-500'>({(productFormState.features?.filter(f => !f.is_default).length || 0)} / {FEATURE_LIMIT})</span> 
                                     <Indicator title={t('product.variantsTooltipTitle')} description={t('product.variantsTooltipDesc', { limit: FEATURE_LIMIT })} /> 
                               </h2>
                                <button
                                    type="button"
                                     onClick={() => { /* TODO: openFeatureOption(undefined, 'add') */ }}
                                     disabled={(productFormState.features?.filter(f => !f.is_default).length || 0) >= FEATURE_LIMIT}
                                     className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-300 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     {t('product.addVariantButton')} 
                                </button>
                           </div>
                            <hr className="my-3 border-gray-100" />
                            {/* Affichage des features (exclure la feature par défaut) */}
                             <div className="flex flex-col gap-4">
                                 {productFormState.features?.filter(f => !f.is_default).map((f) => (
                                     <Feature
                                         key={f.id}
                                         feature={f}
                                          setFeature={(cb) => {
                                               // Mettre à jour UNE feature dans le state
                                               updateLocalData({
                                                   features: (productFormState.features ?? []).map(_f => _f.id === f.id ? cb(_f) as FeatureInterface : _f)
                                               });
                                          }}
                                          onOpenRequired={(featureToEdit) => { /* TODO: openFeatureOption(featureToEdit, 'replace') */ }}
                                          onDelete={() => {
                                               // Supprimer UNE feature du state
                                               updateLocalData({
                                                   features: (productFormState.features ?? []).filter(_f => _f.id !== f.id)
                                               });
                                          }}
                                     />
                                 ))}
                                  {/* Message si aucune variante ajoutée */}
                                 {(productFormState.features?.filter(f => !f.is_default).length === 0) && (
                                     <p className="text-sm text-gray-500 italic text-center py-4">{t('product.noVariantsAdded')}</p> 
                                 )}
                            </div>
                      </section>
                 )}

                {/* Bouton Flottant (déplacé depuis la fin) */}
                 <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50 transition-opacity duration-300 ${hasChanges || isNewProduct ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                     <SaveButton
                         loading={isLoadingMutation}
                         isNew={isNewProduct}
                         hasChanges={hasChanges}
                         // 'required' dépend de la validation ET (si édition) de hasChanges
                         required={validateForm() && (isNewProduct || hasChanges)}
                         onClick={() => handleSave(false)}
                         effect="color"
                     />
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
             style={{height:'300px', overflow: 'visible' }} // Permettre aux ombres de déborder
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

