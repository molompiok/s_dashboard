// pages/products/@id/details/+Page.tsx

// --- Imports ---
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageContext } from '../../../../renderer/usePageContext';
import { useGlobalStore } from '../../../../api/stores/StoreStore';
import { useGetProduct, useGetDetailList, useCreateDetail, useUpdateDetail, useDeleteDetail } from '../../../../api/ReactSublymusApi';
import { DetailInterface, ProductInterface } from '../../../../api/Interfaces/Interfaces';
import { Topbar } from '../../../../Components/TopBar/TopBar';
import { StateDisplay } from '../../../../Components/StateDisplay/StateDisplay';
import { Indicator } from '../../../../Components/Indicator/Indicator';
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { MarkdownEditor2 } from '../../../../Components/MackdownEditor/MarkdownEditor';
import { MarkdownViewer } from '../../../../Components/MarkdownViewer/MarkdownViewer';
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { Confirm } from '../../../../Components/Confirm/Confirm';
import { getMedia } from '../../../../Components/Utils/StringFormater';
import { getFileType } from '../../../../Components/Utils/functions';
import { DETAIL_LIMIT, NO_PICTURE } from '../../../../Components/Utils/constants';
import { IoAdd, IoChevronDown, IoChevronUp, IoCloudUploadOutline, IoEllipsisHorizontal, IoPencil, IoTrash, IoWarningOutline, IoAlbumsOutline } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import logger from '../../../../api/Logger';
import { v4 } from 'uuid';
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer';
import { showErrorToast, showToast } from '../../../../Components/Utils/toastNotifications';
import { buttonStyleSimple } from '../../../../Components/Button/Style';
import Gallery from '../../../../Components/Gallery/Gallery';

export { Page };

// 🎨 SKELETON LOADER POUR LA PAGE
const PageSkeleton = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full min-h-screen flex flex-col animate-pulse">
      <div className="sticky top-0 z-20"><Topbar back title={t('common.loading')} /></div>
      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <div className="h-44 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
        <div className="h-16 bg-gray-200 dark:bg-white/5 rounded-lg flex items-center justify-between p-4">
          <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
          <div className="h-10 w-28 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
        </div>
        <div className="details flex flex-col gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
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

  const { data: product, isLoading: isLoadingProduct, isError: isProductError, error: productError } = useGetProduct({ product_id: productId, with_feature: true }, { enabled: !!productId });
  const { data: detailsData, isLoading: isLoadingDetails, refetch: refetchDetails } = useGetDetailList({ product_id: productId, limit: DETAIL_LIMIT + 5 }, { enabled: !!productId });

  const sortedDetails = useMemo(() => [...(detailsData?.list ?? [])].sort((a, b) => b.index - a.index), [detailsData?.list]);

  const createDetailMutation = useCreateDetail();
  const updateDetailMutation = useUpdateDetail();
  const deleteDetailMutation = useDeleteDetail();

  const handleOpenDetailPopup = (detail?: DetailInterface) => {
    const isCreating = !detail;
    openChild(<ChildViewer title={t(isCreating ? 'detail.addPopupTitle' : 'detail.editPopupTitle')}>
      <DetailInfo
        detail={detail ?? { id: `new-${v4()}`, product_id: productId }}
        onSave={(savedDetail) => {
          (isCreating ? createDetailMutation : updateDetailMutation).mutate(
            isCreating ? { detail_id: '', data: savedDetail } : { detail_id: savedDetail.id!, data: savedDetail },
            {
              onSuccess: () => {
                showToast(t(isCreating ? 'detail.createSuccess' : 'detail.updateSuccess'));
                openChild(null);
              },
              onError: (err) => showErrorToast(err),
            }
          );
        }}
        onCancel={() => openChild(null)}
      />
    </ChildViewer>, { background: 'rgba(30, 41, 59, 0.7)', blur: 4 });
  };

  const handleDelete = (detailId: string, detailTitle?: string) => openChild(<ChildViewer><ConfirmDelete
    title={t('detail.confirmDelete', { title: detailTitle || t('detail.thisDetail') })}
    onCancel={() => openChild(null)}
    onDelete={() => deleteDetailMutation.mutate({ detail_id: detailId }, {
      onSuccess: () => { showToast(t('detail.deleteSuccess'), 'WARNING'); openChild(null); },
      onError: (err) => { showErrorToast(err); openChild(null); }
    })}
  /></ChildViewer>, { background: 'rgba(30, 41, 59, 0.7)', blur: 4 });

  const handleMove = async (detail: DetailInterface, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? detail.index + 1 : detail.index - 1;
    const neighbor = sortedDetails.find(d => d.index === newIndex);
    if (!neighbor) return;

    await Promise.all([
      updateDetailMutation.mutateAsync({ detail_id: neighbor.id, data: { index: detail.index } }),
      updateDetailMutation.mutateAsync({ detail_id: detail.id, data: { index: newIndex } })
    ]).catch(err => showErrorToast(err));
  };

  // 🎨 GESTION DES ÉTATS
  if (isLoadingProduct || isLoadingDetails) return <PageSkeleton />;

  if (isProductError) {
    return <div className="w-full min-h-screen flex flex-col"><Topbar back title={t('common.error.title')} />
      <main className="flex-grow flex items-center justify-center p-4"><StateDisplay
        variant="danger" icon={IoWarningOutline}
        title={productError.status === 404 ? t('product.notFound') : t('common.error.title')}
        description={productError.message || t('common.error.genericDesc')}>
        <a href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl">{t('product.backToList')}</a>
      </StateDisplay></main>
    </div>;
  }

  if (!product) return <PageSkeleton />; // Fallback

  const isDetailMaxReached = (sortedDetails?.length || 0) >= DETAIL_LIMIT;
  const sectionStyle = "bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10";

  return (
    <div className="pb-[200px] w-full flex flex-col min-h-screen">
      <Topbar back={true} title={t('detail.pageTitle', { name: product.name })} />
      <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <ProductPreview product={product} />

        <div className={`${sectionStyle} flex items-center gap-3 flex-wrap justify-between p-4`}>
          <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">{t('detail.sectionTitle')}</h2>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">({sortedDetails.length} / {DETAIL_LIMIT})</span>
          <Indicator title={t('detail.addTooltipTitle')} description={t('detail.addTooltipDesc', { limit: DETAIL_LIMIT })} />
          <button type="button" onClick={() => handleOpenDetailPopup()} disabled={isDetailMaxReached} className={buttonStyleSimple + ' pr-4 ml-auto'}>
            <IoAdd size={18} />{t('detail.addButton')}
          </button>
        </div>

        <div className="details flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {sortedDetails.map((d, i) => <motion.div key={d.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.3, ease: "easeOut" }}><DetailItem
              detail={d} canUp={i > 0} canDown={i < sortedDetails.length - 1}
              onDelete={() => handleDelete(d.id, d.title)} onOption={() => handleOpenDetailPopup(d)}
              onDown={() => handleMove(d, 'down')} onUp={() => handleMove(d, 'up')}
            /></motion.div>)}
          </AnimatePresence>
          {!isLoadingDetails && sortedDetails.length === 0 && <StateDisplay variant="info" icon={IoAlbumsOutline} title={t('detail.emptyTitle')} description={t('detail.emptyDesc')}><button onClick={() => handleOpenDetailPopup()} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl"><IoAdd className='min-w-5 h-5' />{t('detail.addFirstButton')}</button></StateDisplay>}
        </div>
      </main>
    </div>
  );
}

// --- Composant DetailItem ---
const DetailItem = ({ detail, onDelete, onOption, onUp, onDown, canUp, canDown }: { onUp: () => void, onDown: () => void, canUp: boolean, canDown: boolean, detail: DetailInterface, onDelete: () => void, onOption: () => void }) => {
  const { t } = useTranslation();
  const view = detail?.view?.[0];
  const { openChild } = useChildViewer()
  return <div className="bg-white/60 flex dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-4  flex-col sx:flex-row gap-4 items-start">
    {view && <div onClick={()=>{
      openChild(view ?<Gallery onClose={()=>{
        openChild(null)
      }} media={[{
        src:getMedia({source:view,from:'api'}),
        type:getFileType(view)||'image'
      }]}/>:null,{
        blur: 3
      })
    }} className="w-full sx:max-w-[220px] aspect-video rounded-md flex-shrink-0 bg-gray-100 dark:bg-black/20 overflow-hidden">
      {getFileType(view) === 'image' ? <img src={getMedia({ source: view, from: 'api' })} alt={detail.title || ''} className="w-full h-full object-cover" /> : <video loop autoPlay muted playsInline className="w-full h-full object-cover" src={getMedia({ source: view, from: 'api' })} />}
    </div>}
    <div className="flex-grow min-w-0 w-full">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className={`text-base font-semibold text-gray-800 dark:text-gray-100 ${!detail.title ? 'italic text-gray-400' : ''}`}>{detail.title || t('detail.untitled')}</h3>
        <div className="options flex items-center gap-1 text-gray-400 dark:text-gray-500 flex-shrink-0">
          <button onClick={onUp} disabled={!canUp} title={t('common.moveUp')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><IoChevronUp /></button>
          <button onClick={onDown} disabled={!canDown} title={t('common.moveDown')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><IoChevronDown /></button>
          <button onClick={onOption} title={t('common.edit')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><IoEllipsisHorizontal /></button>
          <button onClick={onDelete} title={t('common.delete')} className="p-1.5 rounded-full hover:bg-red-100/50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-500 transition-colors"><IoTrash /></button>
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:white/60 prose prose-sm max-w-none dark:prose-invert prose prose-gray dark:prose-invert"><MarkdownViewer key={detail.updated_at || detail.id} markdown={detail.description || `*${t('detail.noDescription')}*`} /></div>
    </div>
  </div>;
}
const DetailInfo = ({ detail, onSave, onCancel }: { detail: Partial<DetailInterface>, onSave: (d: Partial<DetailInterface>) => void, onCancel: () => void }) => {
  const { t } = useTranslation()
  const [formState, setFormState] = useState(detail)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLocalPreview(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
    setFormState(prev => ({ ...prev, view: file ? [file] : detail.view }))
    e.target.value = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormState(prev => ({ ...prev, title: e.target.value }))

  const handleMarkdownChange = (value: string) =>
    setFormState(prev => ({ ...prev, description: value }))

  const handleConfirm = () => {
    if (!formState.title?.trim()) return
    onSave(formState)
  }

  const fileType = getFileType(formState.view?.[0]);
  const viewUrl = localPreview ? getMedia({ isBackground: fileType == 'image', source: localPreview, from: 'local' }) : getMedia({ isBackground: fileType == 'image', source: formState.view?.[0], from: 'api' })

  
  const showPlaceholder = !viewUrl
  const hasTitle = !!formState.title?.trim()
  const inputStyle = `
    px-4 w-full h-10 rounded-lg shadow-sm sm:text-sm
    bg-white dark:bg-gray-700
    border ${hasTitle ? 'border-gray-300 dark:border-gray-700' : 'border-red-500'}
    focus:border-teal-500 focus:ring-teal-500
    text-neutral-800 dark:text-neutral-100
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `
  const labelStyle = "block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1"

  return (
    <div className="p-4 sm:p-6 flex flex-col tab:flex-row gap-5 text-neutral-800 dark:text-neutral-100">
      <div className="w-full">
        <label className={labelStyle}>{t('detail.imageLabel')}</label>
        <label
          htmlFor="detail-view-input"
          className="
            relative block w-full aspect-video rounded-lg overflow-hidden cursor-pointer
            group border-2 border-dashed
            bg-gray-100 dark:bg-neutral-800/40
            border-gray-300 dark:border-gray-600
            hover:border-teal-500 dark:hover:border-teal-400
            transition
          "
        >
          {fileType === 'video' ?
            <video muted autoPlay loop playsInline className="w-full h-full object-cover block" src={viewUrl || ''} onError={(e) => {
              e.currentTarget.src = NO_PICTURE
            }}></video>
            :
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ background: viewUrl }}
            />
          }

          {showPlaceholder && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
              <IoCloudUploadOutline size={40} />
              <span className="mt-1 text-xs">{t('detail.selectImagePrompt')}</span>
            </div>
          )}

          {!showPlaceholder && (
            <div
              className="
                absolute bottom-2 right-2 p-1.5 rounded-full shadow
                bg-white/80 dark:bg-neutral-800/70 backdrop-blur-md
                text-gray-800 dark:text-gray-200
                opacity-0 group-hover:opacity-100 transition-opacity
              "
            >
              <RiImageEditFill size={18} />
            </div>
          )}

          <input
            id="detail-view-input"
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="w-full space-y-4">
        <div>
          <label className={`${labelStyle} flex justify-between`} htmlFor="input-detail-title">
            <span>{t('detail.titleLabel')}</span>
            <span
              className={`text-xs ${formState.title?.length && formState.title.length > 124
                ? 'text-red-500'
                : 'text-gray-400 dark:text-gray-500'
                }`}
            >
              {(formState.title?.length || 0)}/124
            </span>
          </label>
          <input
            id="input-detail-title"
            name="title"
            type="text"
            value={formState.title || ''}
            placeholder={t('detail.titlePlaceholder')}
            onChange={handleChange}
            className={inputStyle}
            maxLength={124}
          />
        </div>

        <div>
          <label className={labelStyle}>{t('detail.descriptionLabel')}</label>
          <MarkdownEditor2 value={formState.description || ''} setValue={handleMarkdownChange} />
        </div>

        <Confirm canConfirm={hasTitle} isLoading={isSaving} onCancel={onCancel} onConfirm={() => {
          setIsSaving(true)
          setTimeout(() => {
            setIsSaving(false)
          }, 5000);
          handleConfirm()
        }} />
      </div>
    </div>
  )
}
