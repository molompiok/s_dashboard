// pages/products/@id/variants/+Page.tsx

// --- Imports ---
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageContext } from '../../../../renderer/usePageContext';
import { useGetProduct, useMultipleUpdateFeaturesValues } from '../../../../api/ReactSublymusApi';
import { FeatureInterface, ProductInterface } from '../../../../api/Interfaces/Interfaces';
import { Topbar, BreadcrumbItem } from '../../../../Components/TopBar/TopBar';
import { StateDisplay } from '../../../../Components/StateDisplay/StateDisplay';
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview';
import { Feature } from '../../../../Components/Feature/Feature';
import { FeatureInfo } from '../../../../Components/FeatureInfo/FeatureInfo';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer';
import { showErrorToast, showToast } from '../../../../Components/Utils/toastNotifications';
import { limit } from '../../../../Components/Utils/functions';
import { getNewFeature } from '../../../../Components/Utils/parseData';
import { IoAdd, IoWarningOutline, IoColorPaletteOutline } from 'react-icons/io5';
import { Plus } from 'lucide-react';
import { ApiError } from '../../../../api/SublymusApi';
import { debounce } from '../../../../Components/Utils/functions';

export { Page };

const DEBOUNCE_TIME = 3000;
const sectionStyle = "bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-2 mob:p-4 sm:p-6";

// 🎨 SKELETON LOADER POUR LA PAGE
const PageSkeleton = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full min-h-screen flex flex-col animate-pulse">
      <div className="sticky top-0 z-20"><Topbar back title={t('common.loading')} /></div>
      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <div className="h-44 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
        <div className="h-16 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
          ))}
        </div>
      </main>
    </div>
  );
};

// --- Composant Principal ---
function Page() {
  const { t } = useTranslation();
  const { openChild } = useChildViewer();
  const { routeParams } = usePageContext();
  const productId = routeParams?.['id'];

  const { data: product, isLoading: isLoadingProduct, isError: isProductError, error: productError, refetch } = useGetProduct({ product_id: productId, with_feature: true }, { enabled: !!productId });
  const multipleUpdateMutation = useMultipleUpdateFeaturesValues();

  const [s] = useState({
    features: [] as FeatureInterface[] | undefined,
    product: undefined as ProductInterface | undefined
  });

  useEffect(() => {
    if (product) {
      s.product = product;
    }
  }, [product]);

  const updateFeatures = () => {
    try {
      const f = s.features;
      s.features = undefined;
      if (product && f) {
        multipleUpdateMutation.mutate(
          {
            currentFeatures: f,
            initialFeatures: product.features || [],
            product_id: product.id,
          },
          {
            onSuccess: (data) => {
              try {
                if (!data.product?.id) return;
                if (s.features) {
                  updateFeatures();
                  return;
                }
                s.product = data.product;
                showToast("Fonctionnalités mises à jour avec succès");
                refetch();
              } catch (error) {
              }
            },
            onError: (error: ApiError) => {
              showErrorToast(error);
            },
          }
        );
      }
    } catch (error) { }
  };

  const handleFeaturesUpdate = (features: FeatureInterface[]) => {
    s.features = features;
    debounce(() => {
      updateFeatures();
    }, 'feature_update', DEBOUNCE_TIME);
  };

  // 🎨 GESTION DES ÉTATS
  if (isLoadingProduct) return <PageSkeleton />;

  if (isProductError) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        <Topbar back title={t('common.error.title')} />
        <main className="flex-grow flex items-center justify-center p-4">
          <StateDisplay
            variant="danger"
            icon={IoWarningOutline}
            title={productError.status === 404 ? t('product.notFound') : t('common.error.title')}
            description={productError.message || t('common.error.genericDesc')}
          >
            <a href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl">
              {t('product.backToList')}
            </a>
          </StateDisplay>
        </main>
      </div>
    );
  }

  if (!product) return <PageSkeleton />;

  const features = product.features || [];
  const breadcrumbs: BreadcrumbItem[] = [
    { name: t('navigation.products'), url: '/products' },
    { name: limit(product.name, 20), url: `/products/${product.id}` },
    { name: t('product.step.variants') }
  ];

  const handleFeatureChange = (updatedFeature: FeatureInterface) => {
    if (!updatedFeature) return;
    const newFeatures = product.features?.map(f => f.id === updatedFeature.id ? updatedFeature : f);
    handleFeaturesUpdate(newFeatures || []);
  };

  const handleAddFeature = () => {
    openChild(
      <ChildViewer title={t('feature.createTitle')}>
        <FeatureInfo
          feature={{ ...getNewFeature(), index: features.length }}
          onChange={f => {
            handleFeaturesUpdate([...(product.features || []), f as FeatureInterface]);
            openChild(null);
          }}
          onCancel={() => openChild(null)}
        />
      </ChildViewer>
    );
  };

  const handleMove = async (feature: FeatureInterface, direction: 'up' | 'down') => {
    product.features?.sort((a, b) => ((a.index || 0) - (b.index || 0))).map((f, i) => {
      if (f.index !== i) {
        f.index = i;
        f._request_mode = 'edited';
      }
      return f;
    });

    feature.values?.sort((a, b) => ((a.index || 0) - (b.index || 0))).map((v, i) => {
      if (v.index !== i) {
        v.index = i;
        v._request_mode = 'edited';
      }
      return v;
    });

    const newIndex = direction === 'up' ? (feature.index || 0) - 1 : (feature.index || 0) + 1;
    const neighbor = product.features?.find(d => d.index === newIndex);

    if (!neighbor) return;

    neighbor.index = feature.index;
    neighbor._request_mode = 'edited';
    feature.index = newIndex;
    feature._request_mode = 'edited';

    handleFeaturesUpdate(product.features || []);
  };

  return (
    <div className="pb-[200px] w-full flex flex-col min-h-screen">
      <Topbar back={true} title={t('product.step.variants')} breadcrumbs={breadcrumbs} />
      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <ProductPreview product={product} isLoading={false} />

        <div className={`${sectionStyle} space-y-6`}>
          <div className='flex items-center flex-wrap sl:flex-nowrap'>
            <h2 className="inline text-xl font-bold text-gray-900 dark:text-white">
              {t('product.step.variants')}
            </h2>
            <div className="flex items-center text-gray-900 dark:text-white flex-wrap w-full">
              <span className="ml-2">{features.length} / 5</span>
              <button
                onClick={handleAddFeature}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-teal-700/20 hover:bg-teal-700/60 text-teal-600 rounded-lg transition-colors duration-200 font-medium"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {features.sort((a, b) => ((a.index || 0) - (b.index || 0))).map((f, i) =>
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Feature
                    key={f.id}
                    feature={f}
                    setFeature={(updater) => handleFeatureChange(updater(f) as FeatureInterface)}
                    onDelete={() => {
                      handleFeaturesUpdate(
                        (product.features || [])
                          .filter(_f => _f.id !== f.id)
                          .sort((a, b) => ((a.index || 0) - (b.index || 0)))
                          .map((f, i) => {
                            if (f.index !== i) {
                              f.index = i;
                              f._request_mode = 'edited';
                            }
                            return f;
                          })
                      );
                    }}
                    onDown={() => handleMove(f, 'down')}
                    onUp={() => handleMove(f, 'up')}
                    canUp={i > 0}
                    canDown={i < features.length - 1}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleAddFeature}
            className="add-new w-full h-18 gap-4 flex group/btn items-center justify-center rounded-xl border-2 border-dashed border-gray-400/50 dark:border-gray-500/50 text-gray-600 dark:text-gray-400 hover:border-teal-500/70 dark:hover:border-teal-400/70 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all duration-200 backdrop-blur-sm"
          >
            <Plus size={16} />
            {t('product.addVariantButton')}
          </button>
        </div>
      </main>
    </div>
  );
}

