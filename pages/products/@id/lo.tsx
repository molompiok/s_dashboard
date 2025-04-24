// pages/products/@id/+Page.tsx

// --- Imports (inchangés) ---
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePageContext } from '../../../renderer/usePageContext';
import { useStore } from '../../stores/StoreStore';
import {
    useGetProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useMultipleUpdateFeaturesValues
} from '../../../api/ReactSublymusApi';
import { CategoryInterface, FeatureInterface, ProductInterface, ValueInterface, FilterType } from '../../../Interfaces/Interfaces';
import { Topbar } from '../../../Components/TopBar/TopBar';
import { SwiperProducts } from '../../../Components/SwiperProducts/SwiperProducts';
import { CategoryItemMini } from '../../../Components/CategoryItem/CategoryItemMini';
import { CategoriesPopup } from '../../../Components/CategoriesPopup/CategoriesPopup';
import { Feature } from '../../../Components/Feature/Feature';
import { FeatureInfo } from '../../../Components/FeatureInfo/FeatureInfo';
import { MarkdownEditor2 } from '../../../Components/MackdownEditor/MarkdownEditor';
import { ProductSettings } from './ProductSettings';
import { CommandeList } from '../../../Components/CommandesList/CommandesList';
import { SaveButton } from '../../../Components/SaveButton/SaveButton';
import { Indicator } from '../../../Components/Indicator/Indicator';
import { Button } from '../../../Components/Button/Button';
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { ClientCall, debounce } from '../../../Components/Utils/functions';
import { NEW_ID_START, EDITED_DATA, NEW_VIEW } from '../../../Components/Utils/constants';
import { getDefaultValues, IsFeaturesHere } from '../../../Components/Utils/parseData';
import { useMyLocation } from '../../../Hooks/useRepalceState';
import { ChildViewer, useChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { useTranslation } from 'react-i18next';
import logger from '../../../api/Logger';
import { ApiError } from '../../../api/SublymusApi';
import { IoAdd, IoPencil } from 'react-icons/io5';
import { getImg } from '../../../Components/Utils/StringFormater';

// Constantes et état initial (inchangés)
const FEATURE_LIMIT = 5;
const initialEmptyProduct: Partial<ProductInterface> = {
    name: '',
    description: '',
    price: undefined,
    barred_price: undefined,
    categories_id: [],
    features: [], // Sera initialisé avec la feature/value défaut si nécessaire
    is_visible: true,
};

export { Page };

function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const { currentStore } = useStore();
    const { routeParams } = usePageContext();
    const { replaceLocation } = useMyLocation();

    const productIdFromRoute = routeParams?.['id'];
    const isNewProduct = productIdFromRoute === 'new';

    // --- États (inchangés) ---
    const [productFormState, setProductFormState] = useState<Partial<ProductInterface>>(
        // 🚨 Correction: initialiser avec les images par défaut vides si nouveau
        isNewProduct ? { ...initialEmptyProduct, features: [{ id: 'default_feature_temp', is_default: true, values: [{ id: 'default_value_temp', views: [] }] } as Partial<FeatureInterface>] } : {}
    );
    const [originalProductData, setOriginalProductData] = useState<Partial<ProductInterface> | null>(
         isNewProduct ? initialEmptyProduct : null
    );
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [shouldAutoSave, setShouldAutoSave] = useState(false);


    // --- Récupération données (inchangé) ---
    const { /* ... */ } = useGetProducts(/* ... */);
    useEffect(() => { /* ... */
        // Assurer la présence de la feature/value par défaut si non chargée
         if (!isNewProduct && isFetchSuccess && fetchedProductData?.list?.[0]) {
             const fetchedProduct = fetchedProductData.list[0];
              if (!fetchedProduct.features?.some(f => f.is_default || f.id === fetchedProduct.default_feature_id)) {
                   logger.warn("Fetched product missing default feature, adding placeholder");
                   fetchedProduct.features = [
                       ...(fetchedProduct.features ?? []),
                        { id: fetchedProduct.default_feature_id ?? 'default_feature_loaded', is_default: true, values: [{ id: 'default_value_loaded', views: [] }] } as Partial<FeatureInterface>
                   ];
              } else {
                   // Assurer qu'il y a au moins une value dans la feature défaut (pour le swiper)
                   const defaultFeature = fetchedProduct.features.find(f => f.is_default || f.id === fetchedProduct.default_feature_id);
                   if (defaultFeature && (!defaultFeature.values || defaultFeature.values.length === 0)) {
                       defaultFeature.values = [{ id: 'default_value_loaded', views: [] }];
                   }
              }
             setProductFormState(fetchedProduct);
             setOriginalProductData(fetchedProduct);
             setFieldErrors({});
             setShouldAutoSave(false);
             setCurrentImageIndex(0);
              logger.info("Product data loaded for editing", { productId: fetchedProduct.id });
         }
         // Reset pour nouveau produit
         if (isNewProduct) {
              setProductFormState({ ...initialEmptyProduct, features: [{ id: 'default_feature_temp', is_default: true, values: [{ id: 'default_value_temp', views: [] }] } as Partial<FeatureInterface>] });
             setOriginalProductData(initialEmptyProduct);
             setFieldErrors({});
              setShouldAutoSave(false);
              setCurrentImageIndex(0);
         }
     }, [isNewProduct, isFetchSuccess, fetchedProductData, productIdFromRoute]);


    // --- Mutations API (inchangé) ---
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const multipleUpdateMutation = useMultipleUpdateFeaturesValues();
    const deleteProductMutation = useDeleteProduct();
    const isLoadingMutation = createProductMutation.isPending || updateProductMutation.isPending || multipleUpdateMutation.isPending || deleteProductMutation.isPending;

    // --- Détection changements (inchangé pour l'instant) ---
    const hasChanges = useMemo(() => { /* ... */ return shouldAutoSave }, [/* ... */ shouldAutoSave]);

    // --- Fonctions de Mise à Jour État Local (inchangé) ---
    const updateLocalData = useCallback((newData: Partial<ProductInterface>) => { /* ... */ }, []);
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { /* ... */ }, [updateLocalData]);
    const handleMarkdownChange = useCallback((value: string) => { /* ... */ }, [updateLocalData]);

    // --- Logique pour images ---
    const defaultFeatureValues = useMemo(() => {
        const defaultFeature = productFormState.features?.find(f => f.id === productFormState.default_feature_id || f.is_default);
        return defaultFeature?.values ?? [];
    }, [productFormState.features, productFormState.default_feature_id]);

    // 🚨 Correction: handleViewsUpdate doit créer la feature/value défaut si elle manque
    const handleViewsUpdate = useCallback((newViewsForValue: (string | Blob)[]) => {
         updateLocalData({
             features: (productFormState.features ?? []).map(f => {
                 // Cibler la feature par défaut (is_default ou ID temporaire/chargé)
                 if (!f.is_default && f.id !== productFormState.default_feature_id && f.id !== 'default_feature_temp' && f.id !== 'default_feature_loaded') {
                     return f;
                 }

                 let currentValues = [...(f.values ?? [])];
                 let targetValueIndex = currentImageIndex;
                 let targetValue = currentValues[targetValueIndex];

                 // Si l'index n'existe pas, créer une nouvelle value
                 if (!targetValue) {
                     targetValue = {
                         id: NEW_ID_START + Date.now() + targetValueIndex,
                         index: targetValueIndex,
                         text: `Image ${targetValueIndex + 1}`,
                         views: [], // Commencer avec tableau vide
                     } as ValueInterface;
                     // Insérer ou ajouter? Ajouter à la fin si index hors limite?
                     // Simplification: on assume que SwiperProducts ne permet pas d'ajouter à un index inexistant
                     // Donc targetValue devrait exister si l'UI est correcte.
                     // Pour plus de robustesse:
                     if (targetValueIndex >= currentValues.length) {
                         currentValues.push(targetValue);
                     } else {
                          currentValues[targetValueIndex] = targetValue;
                     }
                     logger.warn("Target value for image update did not exist, created new one.", { targetValueIndex, newValue: targetValue });
                 }

                 const updatedValue = {
                     ...targetValue,
                     views: newViewsForValue,
                     [EDITED_DATA]: EDITED_DATA
                 };
                 currentValues[targetValueIndex] = updatedValue;

                 return { ...f, values: currentValues, [EDITED_DATA]: EDITED_DATA, is_default: true }; // Assurer is_default
             })
         });
    }, [productFormState.features, productFormState.default_feature_id, currentImageIndex, updateLocalData]);


    // --- Validation (Améliorée pour la création) ---
     const validateForm = (): boolean => {
         logger.debug("Validating form...", { isNewProduct, formState: productFormState });
         const errors: { [key: string]: string } = {};
         let isValid = true;

         // Champs toujours requis
         if (!productFormState.name || productFormState.name.trim().length < 3) {
             errors.name = t('product.validation.nameRequired');
             isValid = false;
         }
         if (!productFormState.price || productFormState.price <= 0) {
             errors.price = t('product.validation.priceRequired');
             isValid = false;
         }
          // Vérifier prix barré seulement s'il est saisi
          if (productFormState.barred_price !== undefined && productFormState.barred_price !== null && productFormState.barred_price <= (productFormState.price || 0)) {
              errors.barred_price = t('product.validation.barredPriceHigher'); // Nouvelle clé
              isValid = false;
          }

         // Images requises seulement pour la création (on peut supprimer toutes les images en édition)
         // Vérifier s'il y a au moins une image (File ou string) dans la première value de la feature défaut
          const firstDefaultValueViews = defaultFeatureValues[0]?.views;
          if (!firstDefaultValueViews || firstDefaultValueViews.length === 0 || firstDefaultValueViews[0] === NEW_VIEW) {
              errors.images = t('product.validation.imageRequired');
              isValid = false;
          }

         setFieldErrors(errors);
         if (!isValid) logger.warn("Form validation failed", errors);
         return isValid;
     };

    // --- 🚀 Itération 2: handleSave (Fiabilisation Création) ---
    const handleSave = async (isAuto = false) => {
        if (isLoadingMutation) return;
        if (!validateForm()) {
            logger.warn("Save prevented by validation errors.");
            // toast.error(t('validationFailed'));
            return;
        }
        if (!isNewProduct && !hasChanges && !isAuto) {
             logger.info("Update skipped, no changes detected.");
             // toast.info(t('product.noChangesToSave'));
             return;
        }
        setIsAutoSaving(false);

        const formData = new FormData();

        // --- Construction FormData (Focus Création) ---
        if (isNewProduct) {
             // 1. Champs simples obligatoires
             formData.append('name', productFormState.name || ''); // Garanti par validateForm
             formData.append('price', String(productFormState.price || 0)); // Garanti par validateForm
             formData.append('description', productFormState.description || ''); // Optionnel
             if (productFormState.barred_price) {
                formData.append('barred_price', String(productFormState.barred_price));
             }
             formData.append('is_visible', String(productFormState.is_visible ?? true));
             formData.append('currency', productFormState.currency || 'FCFA'); // Devise par défaut

             // 2. Catégories (Optionnel)
             formData.append('categories_id', JSON.stringify(productFormState.categories_id ?? []));

            // 3. Images Principales (obligatoire via validation)
             // On prend les fichiers de la *première* value (index 0) de la feature par défaut
             const firstValue = defaultFeatureValues[0];
             const firstValueFiles = firstValue?.views?.filter(v => v instanceof File) as File[] ?? [];
             const fileKeys: string[] = [];

             if (firstValueFiles.length > 0) {
                  firstValueFiles.forEach((file, idx) => {
                      const key = `views_${idx}`; // Nom attendu par l'API create_product
                      formData.append(key, file);
                      fileKeys.push(key);
                  });
                  formData.append('views', JSON.stringify(fileKeys)); // Le JSON référant aux clés des fichiers
             } else {
                  // Ce cas ne devrait pas arriver grâce à validateForm, mais sécurité
                   logger.error("Validation passed but no image files found for creation.");
                    setFieldErrors(prev => ({ ...prev, images: t('product.validation.imageRequired') }));
                    return; // Arrêter
             }

             // 4. Appel Mutation Création
             logger.info("Calling createProduct mutation", Object.fromEntries(formData.entries()));
             createProductMutation.mutate(formData, {
                 onSuccess: (data) => {
                     logger.info("Product created successfully", data);
                      const createdProduct = data.product; // L'API retourne le produit complet
                      // Mettre à jour l'état local avec les données serveur
                      setProductFormState(createdProduct);
                      setOriginalProductData(createdProduct);
                      setFieldErrors({});
                      setShouldAutoSave(false);
                      // Mettre à jour l'URL
                      replaceLocation(`/products/${createdProduct.id}`); // Utiliser le vrai ID
                      // toast.success(data.message || t('product.createdSuccess'));
                 },
                 onError: (error: ApiError) => {
                     logger.error({ error }, "Product creation failed");
                     if (error.status === 422 && error.body?.errors) {
                         setFieldErrors(error.body.errors);
                     } else {
                          // toast.error(error.message || t('product.creationFailed'));
                     }
                 }
             });

        } else {
             // Mise à jour (Logique simplifiée de l'itération 1, sera étendue)
             if (!hasChanges && !isAuto) return; // Skip si pas de changement
             if (!productFormState.id) return; // Sécurité

             logger.warn("Update logic in handleSave only handles simple fields currently.");

              // --- Construction FormData pour Update Simple ---
               // Seulement les champs simples/catégories modifiés
              const simpleFieldsChanged = ['name', 'description', 'price', 'barred_price', 'is_visible', 'currency']
                  .some(key => productFormState[key as keyof ProductInterface] !== originalProductData?.[key as keyof ProductInterface]);
              const categoriesChanged = JSON.stringify(productFormState.categories_id ?? []) !== JSON.stringify(originalProductData?.categories_id ?? []);

              if(simpleFieldsChanged || categoriesChanged) {
                   formData.append('product_id', productFormState.id);
                   // Ajouter les champs modifiés (logique de l'itération 1)
                    const fieldsToProcess: (keyof ProductInterface)[] = ['name', 'description', 'price', 'barred_price', 'is_visible', 'currency'];
                    fieldsToProcess.forEach(key => { /* ... Ajouter si différent ... */ });
                    if (categoriesChanged) {
                         formData.append('categories_id', JSON.stringify(productFormState.categories_id ?? []));
                    }

                   logger.info("Calling updateProduct mutation", Object.fromEntries(formData.entries()));
                   updateProductMutation.mutate(formData, { /* ... onSuccess/onError ... */ });
              } else {
                   logger.info("Update requested but only feature/value changes detected (not handled yet).");
                   setShouldAutoSave(false); // Reset flag car on ne sauvegarde pas vraiment
              }
        }
    };
    // --- Fin Itération 2: handleSave ---


    // --- Rendu (Structure inchangée, passer les bonnes props) ---
    // ... (vérifications isLoading/isError/notFound inchangées) ...

    return (
        <div className="product-detail-page w-full flex flex-col bg-gray-50 min-h-screen">
            <Topbar back={true} />
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 pb-24">
                 {/* 🚨 Correction: Passer les vues de toutes les values de la feature défaut */}
                 <section className="views">
                     <SwiperProducts
                         // Mapper chaque value en son tableau de vues
                          viewsList={defaultFeatureValues.map(v => v.views ?? [])}
                         // setViews n'est plus utilisé directement, on utilise handleViewsUpdate
                         onViewsChange={(index, newViews) => {
                             // Mettre à jour la value spécifique à cet index
                              handleViewsUpdateSpecific(index, newViews); // Nouvelle fonction helper
                         }}
                         onDeleteView={(valueIndex, viewIndex) => {
                             // Supprimer une vue spécifique
                             handleDeleteSpecificView(valueIndex, viewIndex); // Nouvelle fonction helper
                         }}
                          onAddPlaceholder={(valueIndex) => {
                              // Ajouter un placeholder à une value
                              handleAddPlaceholder(valueIndex); // Nouvelle fonction helper
                          }}
                          onReorderValues={(newOrder) => {
                               // Réordonner les values
                               handleReorderValues(newOrder); // Nouvelle fonction helper
                          }}
                          initialIndex={currentImageIndex}
                          onIndexChange={setCurrentImageIndex}
                          allowMultiple={true} // Permettre l'ajout/suppression de slides (values)
                     />
                     {fieldErrors.images && <p className="mt-2 text-xs text-red-600">{fieldErrors.images}</p>}
                 </section>

                 {/* ... reste du JSX (sections infos, catégories, variantes, settings, commandes, bouton save) ... */}
                  {/* Bouton Flottant */}
                  <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50 transition-opacity duration-300 ${isNewProduct || hasChanges ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <SaveButton
                          loading={isLoadingMutation}
                          isNew={isNewProduct}
                          hasChanges={hasChanges}
                          // La validation est la condition principale
                          required={validateForm()}
                          // Le titre reflète si le formulaire est valide ou non
                           title={isNewProduct
                               ? (validateForm() ? t('product.createButtonValid') : t('product.createButtonInvalid'))
                               : (hasChanges
                                   ? (validateForm() ? t('product.saveButtonValid') : t('product.saveButtonInvalid'))
                                   : t('product.noChangesButton') // Pas de changements
                               )
                           }
                          onClick={() => handleSave(false)}
                          effect="color"
                      />
                  </div>
                  {/* ... etc ... */}

            </main>
        </div>
    );
}

// --- Ajouter les fonctions helper pour SwiperProducts ---
// (à placer dans le composant Page ou à externaliser si besoin)

const handleViewsUpdateSpecific = useCallback((valueIndex: number, newViews: (string | Blob)[]) => {
    // Logique similaire à handleViewsUpdate mais ciblant un index spécifique
     updateLocalData({
         features: (productFormState.features ?? []).map(f => {
              if (!f.is_default && f.id !== productFormState.default_feature_id && f.id !== 'default_feature_temp' && f.id !== 'default_feature_loaded') return f;

              let currentValues = [...(f.values ?? [])];
              if (valueIndex >= 0 && valueIndex < currentValues.length) {
                  currentValues[valueIndex] = {
                      ...currentValues[valueIndex],
                      views: newViews,
                      [EDITED_DATA]: EDITED_DATA
                  };
                  return { ...f, values: currentValues, [EDITED_DATA]: EDITED_DATA, is_default: true };
              } else {
                   logger.warn("handleViewsUpdateSpecific: Invalid index", { valueIndex, valuesCount: currentValues.length });
              }
              return f; // Retourner feature inchangée si index invalide
         })
     });
}, [productFormState.features, productFormState.default_feature_id, updateLocalData]);

const handleDeleteSpecificView = useCallback((valueIndex: number, viewIndex: number) => {
     updateLocalData({
         features: (productFormState.features ?? []).map(f => {
              if (!f.is_default && f.id !== productFormState.default_feature_id && f.id !== 'default_feature_temp' && f.id !== 'default_feature_loaded') return f;
              let currentValues = [...(f.values ?? [])];
              if (valueIndex >= 0 && valueIndex < currentValues.length) {
                   const targetValue = { ...currentValues[valueIndex] };
                   if (targetValue.views && viewIndex >= 0 && viewIndex < targetValue.views.length) {
                        // Supprimer la vue à l'index spécifié
                        const oldPreview = targetValue.views[viewIndex];
                        if (typeof oldPreview !== 'string' && oldPreview instanceof Blob) {
                             URL.revokeObjectURL(URL.createObjectURL(oldPreview)); // Révoquer si c'était une preview locale
                        }
                       targetValue.views = targetValue.views.filter((_, idx) => idx !== viewIndex);
                       targetValue[EDITED_DATA] = EDITED_DATA;
                       currentValues[valueIndex] = targetValue;
                       // Si la value n'a plus de vues, la supprimer complètement? Optionnel.
                       // if (targetValue.views.length === 0) {
                       //    currentValues = currentValues.filter((_, idx) => idx !== valueIndex);
                       // }
                       return { ...f, values: currentValues, [EDITED_DATA]: EDITED_DATA, is_default: true };
                   }
              }
               return f;
         })
     });
 }, [productFormState.features, productFormState.default_feature_id, updateLocalData]);

 const handleAddPlaceholder = useCallback((atIndex: number) => {
      // Ajouter une nouvelle Value vide à l'index spécifié
      updateLocalData({
          features: (productFormState.features ?? []).map(f => {
               if (!f.is_default && f.id !== productFormState.default_feature_id && f.id !== 'default_feature_temp' && f.id !== 'default_feature_loaded') return f;
               let currentValues = [...(f.values ?? [])];
               const newValue: ValueInterface = {
                  id: NEW_ID_START + Date.now() + atIndex,
                  index: atIndex, // L'index sera recalculé à la sauvegarde si nécessaire
                  text: `Image ${atIndex + 1}`,
                  views: [NEW_VIEW], // Placeholder pour indiquer ajout
               } as ValueInterface; // Cast partiel nécessaire
               currentValues.splice(atIndex, 0, newValue); // Insérer à l'index
                // Réindexer les valeurs suivantes
                currentValues = currentValues.map((val, idx) => ({ ...val, index: idx }));
               return { ...f, values: currentValues, [EDITED_DATA]: EDITED_DATA, is_default: true };
          })
      });
      // Optionnel: Changer l'index du swiper vers le nouvel item ajouté
      setCurrentImageIndex(atIndex);
 }, [productFormState.features, productFormState.default_feature_id, updateLocalData]);

  const handleReorderValues = useCallback((newOrderIndexes: number[]) => {
      // Réordonner les values dans la feature par défaut
       updateLocalData({
           features: (productFormState.features ?? []).map(f => {
                if (!f.is_default && f.id !== productFormState.default_feature_id && f.id !== 'default_feature_temp' && f.id !== 'default_feature_loaded') return f;
                let currentValues = [...(f.values ?? [])];
                // Créer le nouveau tableau ordonné
                const reorderedValues = newOrderIndexes.map(index => currentValues[index]);
                 // Réassigner les index corrects
                 const finalValues = reorderedValues.map((val, idx) => ({ ...val, index: idx, [EDITED_DATA]: EDITED_DATA }));
                return { ...f, values: finalValues, [EDITED_DATA]: EDITED_DATA, is_default: true };
           })
       });
  }, [productFormState.features, productFormState.default_feature_id, updateLocalData]);


// --- Le reste des composants (ProductSettings, etc.) reste inchangé pour cette itération ---

// --- Nouvelles clés i18n ---
/*
{
 "product": {
    // ... clés existantes ...
     "validation": {
         // ... clés existantes ...
         "barredPriceHigher": "Le prix barré doit être supérieur au prix normal."
     },
     "createButtonValid": "Créer le Produit",
     "saveButtonValid": "Enregistrer",
     "saveButtonInvalid": "Informations invalides",
     "noChangesToSave": "Aucune modification"
 },
 "common": {
      // ... clés existantes ...
      "comingSoon": "Bientôt disponible..."
 }
}
*/