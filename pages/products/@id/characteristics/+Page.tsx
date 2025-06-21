// pages/products/@id/characteristics/+Page.tsx

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageContext } from '../../../../renderer/usePageContext';
import {
    useGetProduct,
    useListProductCharacteristics,
    useCreateProductCharacteristic,
    useUpdateProductCharacteristic,
    useDeleteProductCharacteristic,
} from '../../../../api/ReactSublymusApi';
import { ProductCharacteristicInterface } from '../../../../api/Interfaces/Interfaces';
import { Topbar, BreadcrumbItem } from '../../../../Components/TopBar/TopBar';
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview';
import { StateDisplay } from '../../../../Components/StateDisplay/StateDisplay';
import { MarkdownEditor2 } from '../../../../Components/MackdownEditor/MarkdownEditor';
import { MarkdownViewer } from '../../../../Components/MarkdownViewer/MarkdownViewer';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { Confirm } from '../../../../Components/Confirm/Confirm';
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer';
import { showErrorToast, showToast } from '../../../../Components/Utils/toastNotifications';
import { limit } from '../../../../Components/Utils/functions';
import { IoAdd, IoChevronDown, IoChevronUp, IoPencil, IoTrash, IoWarningOutline, IoListCircleOutline, IoCloudUploadOutline } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import { getMedia } from '../../../../Components/Utils/StringFormater';
import { buttonStyleSimple } from '../../../../Components/Button/Style';

export { Page };

// --- SKELETON LOADER ---
const CharacteristicsPageSkeleton = () => {
    const SkeletonCard = ({ children }: { children: React.ReactNode }) => (
        <div className="bg-gray-100/80 dark:bg-white/5 rounded-lg border border-gray-200/50 dark:border-white/10 p-4">{children}</div>
    );
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            <Topbar back title="..." />
            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <div className="h-44 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
                <div className="flex justify-between items-center">
                    <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="h-10 w-40 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                </div>
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i}><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div><div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div></div></SkeletonCard>
                    ))}
                </div>
            </main>
        </div>
    );
};

// --- COMPOSANT PRINCIPAL ---
function Page() {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const { routeParams } = usePageContext();
    const productId = routeParams?.['id'];

    const { data: product, isLoading: isLoadingProduct, isError: isProductError, error: productError } = useGetProduct({ product_id: productId, with_all: true }, { enabled: !!productId });
    const { data: characteristicsData, isLoading: isLoadingCharacteristics } = useListProductCharacteristics({ product_id: productId! }, { enabled: !!productId });
    
    const characteristics = useMemo(() => [...(characteristicsData?.list ?? [])].sort((a, b) => b.index - a.index), [characteristicsData]);
    
    const createMutation = useCreateProductCharacteristic();
    const updateMutation = useUpdateProductCharacteristic();
    const deleteMutation = useDeleteProductCharacteristic();

    const handleOpenPopup = (characteristic?: ProductCharacteristicInterface) => {
        openChild(<ChildViewer title={t(characteristic ? 'characteristic.editTitle' : 'characteristic.createTitle')}>
            <CharacteristicForm
                productId={productId!}
                characteristic={characteristic}
                onSave={(data) => {
                    (characteristic?.id ? updateMutation : createMutation).mutate(
                        characteristic?.id ? { characteristicId: characteristic.id, data } : { characteristicId:'', data },
                        {
                            onSuccess: () => {
                                showToast(t(characteristic ? 'characteristic.updateSuccess' : 'characteristic.createSuccess'));
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

    const handleDelete = (c: ProductCharacteristicInterface) => openChild(<ChildViewer><ConfirmDelete
        title={t('characteristic.confirmDelete', { name: c.name })}
        onCancel={() => openChild(null)}
        onDelete={() => deleteMutation.mutate({ characteristicId: c.id }, {
            onSuccess: () => { showToast(t('characteristic.deleteSuccess'), 'WARNING'); openChild(null); },
            onError: (err) => { showErrorToast(err); openChild(null); }
        })}
    /></ChildViewer>);

    const handleMove = (c: ProductCharacteristicInterface, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? c.index + 1 : c.index - 1;
        updateMutation.mutate({ characteristicId: c.id, data: { index: newIndex } }, { onError: showErrorToast });
    };

    if (isLoadingProduct || isLoadingCharacteristics) return <CharacteristicsPageSkeleton />;
    if (isProductError) return <StateDisplay variant="danger" icon={IoWarningOutline} title="Erreur Produit" description={productError.message} />;
    if (!product) return <StateDisplay description='' variant="danger" icon={IoWarningOutline} title="Produit non trouvé" />;

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.products'), url: '/products' },
        { name: limit(product.name, 20), url: `/products/${product.id}` },
        { name: t('characteristic.breadcrumb') }
    ];

    return (
        <div className="w-full min-h-screen flex flex-col pb-24">
            <Topbar back title={t('characteristic.pageTitle')} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <ProductPreview isLoading={isLoadingProduct} product={product} />
                <div className="flex flex-wrap gap-2 justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('characteristic.listTitle')}</h2>
                    <button onClick={() => handleOpenPopup()} className={buttonStyleSimple}><IoAdd size={18} />{t('characteristic.addButton')}</button>
                </div>
                <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                        {characteristics.map((c, idx) => (
                            <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <CharacteristicItem
                                    characteristic={c}
                                    onDelete={() => handleDelete(c)}
                                    onEdit={() => handleOpenPopup(c)}
                                    onMoveUp={() => idx > 0 && handleMove(c, 'up')}
                                    onMoveDown={() => idx < characteristics.length - 1 && handleMove(c, 'down')}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!isLoadingCharacteristics && characteristics.length === 0 && <StateDisplay
                        variant="info" icon={IoListCircleOutline}
                        title={t('characteristic.emptyTitle')} description={t('characteristic.emptyDesc')}
                    ><button onClick={() => handleOpenPopup()} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl"><IoAdd className='min-w-4 h-4'/>{t('characteristic.addFirstButton')}</button></StateDisplay>}
                </div>
            </main>
        </div>
    );
}

// --- SOUS-COMPOSANTS ---

const CharacteristicItem = ({ characteristic: c, onDelete, onEdit, onMoveUp, onMoveDown }: { characteristic: ProductCharacteristicInterface, onDelete: () => void, onEdit: () => void, onMoveUp: () => void, onMoveDown: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const iconUrl = getMedia({ source: c.icon?.[0], from: 'api' });

    return (
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 overflow-hidden">
            <div className="p-4 flex justify-between items-start gap-4">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                    {iconUrl && <div className="w-10 h-10 rounded-lg bg-cover bg-center bg-gray-200 dark:bg-gray-700 shrink-0" style={{ backgroundImage: `url(${iconUrl})` }}></div>}
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{c.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.value_text || `${c.quantity || ''} ${c.unity || ''}`}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 shrink-0">
                    <button onClick={onMoveUp} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><IoChevronUp /></button>
                    <button onClick={onMoveDown} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><IoChevronDown /></button>
                    <button onClick={onEdit} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><IoPencil /></button>
                    <button onClick={onDelete} className="p-1.5 rounded-full hover:bg-red-100/50 dark:hover:bg-red-900/40 hover:text-red-500"><IoTrash /></button>
                </div>
            </div>
            {c.description && <>
                <div className={`px-4 transition-all duration-300 ${isExpanded ? 'pb-4' : 'max-h-0 overflow-hidden'}`}>
                    <div className="prose prose-sm max-w-none dark:prose-invert text-gray-600 dark:text-gray-300 border-t border-gray-200/80 dark:border-white/10 pt-3"><MarkdownViewer markdown={c.description} /></div>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-center text-xs font-medium py-2 border-t border-gray-200/80 dark:border-white/10 text-teal-600 dark:text-teal-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">{isExpanded ? 'Masquer la description' : 'Afficher la description'}</button>
            </>}
        </div>
    );
};

const CharacteristicForm = ({ productId, characteristic, onSave, onCancel }: { productId: string, characteristic?: ProductCharacteristicInterface, onSave: (data: any) => void, onCancel: () => void }) => {
    const { t } = useTranslation();
    const [formState, setFormState] = useState<Partial<ProductCharacteristicInterface>>(characteristic || {});
    const [localIconPreview, setLocalIconPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file)  return;
        setLocalIconPreview(prev => { if (prev) URL.revokeObjectURL(prev); return file ? URL.createObjectURL(file) : null; });
        setFormState(prev => ({ ...prev, icon: [file] }));
        e.target.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleMarkdownChange = (value: string) => setFormState(prev => ({ ...prev, description: value }));

    const handleSave = () => {
        if (!formState.name?.trim()) { showErrorToast(new Error(t('characteristic.validation.nameRequired'))); return; }
        onSave({ ...formState, product_id: productId });
    };

    const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5";
    const inputStyle = "block w-full rounded-lg shadow-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-teal-500 focus:ring-teal-500 sm:text-sm transition-colors p-2.5";
    const iconUrl = localIconPreview || getMedia({ source: formState.icon?.[0], from: 'api' });

    return (
        <div className="p-4 sm:p-6 flex flex-col gap-5 text-gray-800 dark:text-gray-100">
            <div className="flex items-start gap-4">
                <div>
                    <label className={labelStyle}>{t('characteristic.iconLabel')}</label>
                    <label htmlFor="char-icon-input" className="relative block w-24 h-24 rounded-lg cursor-pointer overflow-hidden group bg-gray-100 dark:bg-black/20 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500">
                        {iconUrl && <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${iconUrl})` }}></div>}
                        {!iconUrl && <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-500"><IoCloudUploadOutline size={32} /></div>}
                        {iconUrl && <div className="absolute bottom-1 right-1 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100"><RiImageEditFill size={16} /></div>}
                        <input id="char-icon-input" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                    </label>
                </div>
                <div className="flex-grow">
                    <label htmlFor="charName" className={labelStyle}>{t('characteristic.nameLabel')}</label>
                    <input id="charName" name="name" type="text" value={formState.name || ''} onChange={handleChange} placeholder={t('characteristic.namePlaceholder')} className={inputStyle} />
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="charValueText" className={labelStyle}>{t('characteristic.valueLabel')}</label>
                    <input id="charValueText" name="value_text" type="text" value={formState.value_text || ''} onChange={handleChange} placeholder={t('characteristic.valuePlaceholder')} className={inputStyle} />
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label htmlFor="charQuantity" className={labelStyle}>{t('characteristic.quantityLabel')}</label>
                        <input id="charQuantity" name="quantity" type="number" value={formState.quantity ?? ''} onChange={handleChange} placeholder="1" className={inputStyle} />
                    </div>
                    <div className="w-1/3">
                        <label htmlFor="charUnity" className={labelStyle}>{t('characteristic.unityLabel')}</label>
                        <input id="charUnity" name="unity" type="text" value={formState.unity || ''} onChange={handleChange} placeholder="kg, cm, L" className={inputStyle} />
                    </div>
                </div>
            </div>
            <div>
                <label className={labelStyle}>{t('characteristic.descriptionLabel')}</label>
                <MarkdownEditor2 value={formState.description || ''} setValue={handleMarkdownChange} />
            </div>
            <Confirm onCancel={onCancel} onConfirm={handleSave} canConfirm={!!formState.name?.trim()} />
        </div>
    );
};