// pages/products/@id/faq/+Page.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { usePageContext } from '../../../../renderer/usePageContext';
import {
    useGetProduct,
    useListProductFaqs,
    useCreateProductFaq,
    useUpdateProductFaq,
    useDeleteProductFaq,
    useReorderProductFaqs,
} from '../../../../api/ReactSublymusApi';
import { FaqSourceInterface, ProductFaqInterface } from '../../../../api/Interfaces/Interfaces';
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
import {
    IoAdd,
    IoChevronDown,
    IoChevronUp,
    IoInformationCircleOutline,
    IoPencil,
    IoTrash,
    IoWarningOutline,
    IoChatbubblesOutline,
    IoCloseCircle,
    IoLinkOutline,
    IoReorderThree,
    IoEye,
    IoEyeOff,
    IoFilter,
    IoSearch,
    IoWarning,
    IoHourglass,
    IoCheckmarkCircle
} from 'react-icons/io5';
import { FaLayerGroup, FaGripVertical } from 'react-icons/fa';

export { Page };

// Types pour le tri et filtrage
type SortOption = 'manual' | 'alphabetical' | 'date' | 'group';
type ViewMode = 'expanded' | 'collapsed' | 'compact';

const SkeletonCard = () => (
    <div className="w-full bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 overflow-hidden animate-pulse">
        <div className="p-4 flex justify-between items-start gap-4">
            {/* Drag Handle */}
            <div className="flex items-start gap-3 flex-grow min-w-0">
                <div className="pt-1 text-gray-300 dark:text-gray-600">
                    <div className="w-3 h-4 rounded bg-gray-300 dark:bg-gray-700"></div>
                </div>

                {/* Title & Badge */}
                <div className="flex-grow min-w-0 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-gray-300 dark:bg-gray-700"></div>
                    <div className="h-4 w-24 rounded-full bg-indigo-200/50 dark:bg-indigo-500/30"></div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
        </div>

        {/* Contenu */}
        <div className="px-4 pb-4 flex flex-col gap-2">
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Sources */}
        <div className="px-4 pb-4 space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-300 dark:bg-gray-700"></div>
            <div className="h-3 w-3/5 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
    </div>
);

// --- SKELETON LOADER ---
const FaqPageSkeleton = () => {
    return (
        <div className="w-full min-h-screen flex flex-col animate-pulse">
            <Topbar back title="..." />
            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-4">
                <div className="h-22 bg-gray-200 dark:bg-white/5 rounded-lg"></div>
                <div className="flex justify-between items-center">
                    <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="h-7 w-1/3 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                </div>
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
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

    // États pour le tri et filtrage
    const [sortOption, setSortOption] = useState<SortOption>('manual');
    const [viewMode, setViewMode] = useState<ViewMode>('collapsed');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [isReorderMode, setIsReorderMode] = useState(false);

    const { data: product, isLoading: isLoadingProduct, isError: isProductError, error: productError } = useGetProduct({ product_id: productId, with_feature: true }, { enabled: !!productId });
    const { data: faqsDataFetched, isLoading: isLoadingFaqs } = useListProductFaqs({ product_id: productId! }, { enabled: !!productId });

    const [faqsData, setFaqData] = useState(faqsDataFetched)

    useEffect(() => {
        setFaqData(faqsDataFetched)
    }, [faqsDataFetched])

    const createFaqMutation = useCreateProductFaq();
    const updateFaqMutation = useUpdateProductFaq();
    const deleteFaqMutation = useDeleteProductFaq();
    const reorderFaqsMutation = useReorderProductFaqs();



    // Logique de tri et filtrage améliorée
    const { sortedFaqs, groups } = useMemo(() => {
        let faqs = [...(faqsData?.list ?? [])];

        // Filtrage par recherche
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            faqs = faqs.filter(faq =>
                faq.title.toLowerCase().includes(query) ||
                faq.content.toLowerCase().includes(query) ||
                (faq.group && faq.group.toLowerCase().includes(query))
            );
        }

        // Filtrage par groupe
        if (selectedGroup) {
            faqs = faqs.filter(faq => faq.group === selectedGroup);
        }

        // Tri
        switch (sortOption) {
            case 'manual':
                faqs.sort((a, b) => a.index - b.index);
                break;
            case 'alphabetical':
                faqs.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'date':
                faqs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'group':
                faqs.sort((a, b) => {
                    if (!a.group && !b.group) return 0;
                    if (!a.group) return 1;
                    if (!b.group) return -1;
                    return a.group.localeCompare(b.group);
                });
                break;
        }

        // Extraction des groupes uniques
        const uniqueGroups = [...new Set(faqs.map(f => f.group).filter(Boolean))];

        return { sortedFaqs: faqs, groups: uniqueGroups };
    }, [faqsData, sortOption, searchQuery, selectedGroup]);

    const handleOpenFaqPopup = (faq?: ProductFaqInterface) => {
        openChild(<ChildViewer title={t(faq ? 'faq.editTitle' : 'faq.createTitle')}>
            <FaqForm
                existingGroups={groups as any}
                productId={productId!}
                faq={faq}
                onSave={(data) => {
                    (faq ? updateFaqMutation : createFaqMutation).mutate(
                        { faqId: faq?.id as any, data },
                        {
                            onSuccess: () => {
                                showToast(t(faq ? 'faq.updateSuccess' : 'faq.createSuccess'));
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

    const handleDelete = (faq: ProductFaqInterface) => {
        openChild(<ChildViewer><ConfirmDelete
            title={t('faq.confirmDelete', { title: limit(faq.title, 20) })}
            onCancel={() => openChild(null)}
            onDelete={() => deleteFaqMutation.mutate({ faqId: faq.id }, {
                onSuccess: () => { showToast(t('faq.deleteSuccess'), 'WARNING'); openChild(null); },
                onError: (err) => { showErrorToast(err); openChild(null); }
            })}
        /></ChildViewer>);
    };

    // Nouvelle logique de réorganisation par drag & drop
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(sortedFaqs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Mise à jour des indices
        const updatedItems = items.map((item, index) => ({
            ...item,
            index: index
        }));

        faqsData && setFaqData({ ...faqsData, list: updatedItems })

        reorderFaqsMutation.mutate({
            product_id: productId!,
            faqs: updatedItems.map(item => ({ id: item.id, index: item.index }))
        }, {
            onError: (err) => showErrorToast(err),

        });
    };

    const handleQuickMove = (faqId: string, currentIndex: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
        updateFaqMutation.mutate({ faqId, data: { index: newIndex } }, {
            onError: (err) => showErrorToast(err),
        });
    };

    // Gestion des raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsReorderMode(false);
                setSearchQuery('');
                setSelectedGroup('');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- GESTION DES ÉTATS D'INTERRUPTION ---
    if (isLoadingProduct || isLoadingFaqs) return <FaqPageSkeleton />;
    if (isProductError) return <StateDisplay variant="danger" icon={IoWarningOutline} title="Erreur Produit" description={productError.message} />;
    if (!product) return <StateDisplay variant="danger" icon={IoWarningOutline} title="Produit non trouvé" description="Impossible de charger les informations du produit." />;

    const breadcrumbs: BreadcrumbItem[] = [
        { name: t('navigation.products'), url: '/products' },
        { name: limit(product.name, 20), url: `/products/${product.id}` },
        { name: t('faq.breadcrumb') }
    ];

    return (
        <div className="w-full min-h-screen flex flex-col pb-24">
            <Topbar back title={t('faq.pageTitle')} breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <ProductPreview product={product} />

                {/* Contrôles améliorés */}
                <div className="space-y-4">
                    {/* Header avec titre et bouton principal */}
                    <div className="flex flex-wrap justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {t('faq.listTitle')}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({sortedFaqs.length})
                            </span>
                        </h2>
                        <button
                            onClick={() => handleOpenFaqPopup()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <IoAdd size={18} />
                            {t('faq.addButton')}
                        </button>
                    </div>

                    {/* Barre de recherche et filtres */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Recherche */}
                        <div className="relative flex-grow">
                            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('faq.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex flex-grow gap-2 sl2:gap-4 sl2:items-center flex-col  sl2:flex-row ">
                            {/* Filtre par groupe */}
                            {groups.length > 0 && (
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                >
                                    <option value="">{t('faq.allGroups')}</option>
                                    {groups.map(group => (
                                        <option key={group} value={group as any}>{group}</option>
                                    ))}
                                </select>
                            )}

                            {/* Options de tri */}
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            >
                                <option value="manual">{t('faq.sort.manual')}</option>
                                <option value="alphabetical">{t('faq.sort.alphabetical')}</option>
                                <option value="date">{t('faq.sort.date')}</option>
                                <option value="group">{t('faq.sort.group')}</option>
                            </select>
                        </div>

                    </div>

                    {/* Contrôles de vue */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'expanded' ? 'collapsed' : 'expanded')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {viewMode === 'expanded' ? <IoEyeOff size={16} /> : <IoEye size={16} />}
                                {t(viewMode === 'expanded' ? 'faq.collapseAll' : 'faq.expandAll')}
                            </button>

                            {sortOption === 'manual' && (
                                <button
                                    onClick={() => setIsReorderMode(!isReorderMode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isReorderMode
                                        ? 'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/30'
                                        : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <IoReorderThree size={16} />
                                    {t(isReorderMode ? 'faq.exitReorder' : 'faq.reorderMode')}
                                </button>
                            )}
                        </div>

                        {/* Indicateurs de filtrage actif */}
                        {(searchQuery || selectedGroup) && (
                            <div className="flex items-center flex-wrap gap-2">
                                {searchQuery && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                        {t('faq.searchActive')}: "{searchQuery}"
                                    </span>
                                )}
                                {selectedGroup && (
                                    <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                        {t('faq.groupFilter')}: {selectedGroup}
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedGroup('');
                                    }}
                                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    {t('dashboard.reset')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Liste des FAQs avec drag & drop */}
                <div className="flex flex-col gap-3">
                    {isReorderMode && sortOption === 'manual' ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="faqs">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        <AnimatePresence initial={false}>
                                            {sortedFaqs.map((faq, idx) => (
                                                <Draggable key={faq.id} draggableId={String(faq.id)} index={idx}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps} // ← MANQUANT dans ton code actuel !
                                                            className={` ${snapshot.isDragging ? 'shadow-lg mb-3 scale-105' : ''}`}
                                                        >
                                                            <motion.div
                                                                layout
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                className='mb-3'
                                                            >
                                                                <FaqItem
                                                                    canDown={idx > 0}
                                                                    canUp={idx < sortedFaqs.length - 1}
                                                                    faq={faq}
                                                                    viewMode={viewMode}
                                                                    isReorderMode={isReorderMode}
                                                                    onDelete={() => handleDelete(faq)}
                                                                    onEdit={() => handleOpenFaqPopup(faq)}
                                                                    onMoveUp={() => idx > 0 && handleQuickMove(faq.id, faq.index, 'up')}
                                                                    onMoveDown={() => idx < sortedFaqs.length - 1 && handleQuickMove(faq.id, faq.index, 'down')}
                                                                />
                                                            </motion.div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        </AnimatePresence>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                    ) : (
                        <AnimatePresence initial={false}>
                            {sortedFaqs.map((faq, idx) => (
                                <motion.div
                                    key={faq.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FaqItem
                                        faq={faq}
                                        canDown={idx > 0}
                                        canUp={idx < sortedFaqs.length - 1}
                                        viewMode={viewMode}
                                        isReorderMode={false}
                                        onDelete={() => handleDelete(faq)}
                                        onEdit={() => handleOpenFaqPopup(faq)}
                                        onMoveUp={() => idx > 0 && handleQuickMove(faq.id, faq.index, 'up')}
                                        onMoveDown={() => idx < sortedFaqs.length - 1 && handleQuickMove(faq.id, faq.index, 'down')}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {!isLoadingFaqs && sortedFaqs.length === 0 && (
                        <StateDisplay
                            variant="info"
                            icon={IoChatbubblesOutline}
                            title={searchQuery || selectedGroup ? t('faq.noResults') : t('faq.emptyTitle')}
                            description={searchQuery || selectedGroup ? t('faq.noResultsDesc') : t('faq.emptyDesc')}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

// Composant FaqItem amélioré
const FaqItem = ({
    faq,
    viewMode,
    isReorderMode,
    dragHandleProps,
    onDelete,
    onEdit,
    onMoveUp,
    onMoveDown,
    canUp,
    canDown,
}: {
    canUp: boolean,
    canDown: boolean,
    faq: ProductFaqInterface;
    viewMode: ViewMode;
    isReorderMode: boolean;
    dragHandleProps?: any;
    onDelete: () => void;
    onEdit: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(viewMode === 'expanded');
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [needsSeeMore, setNeedsSeeMore] = useState(false);

    useEffect(() => {
        setIsExpanded(viewMode === 'expanded');
    }, [viewMode]);

    useEffect(() => {
        if ((faq.content.length || 0) > 100) {
            setNeedsSeeMore(true);
        }
    }, [faq.content]);


    return (
        <div className={`bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 overflow-hidden transition-all duration-200 hover:shadow-md ${isReorderMode ? 'cursor-grab active:cursor-grabbing' : ''
            }`}>
            <div className="p-4 flex justify-between items-start gap-4">
                <div className="flex items-start gap-3 flex-grow min-w-0">
                    {/* Drag handle pour le mode réorganisation */}
                    {isReorderMode && (
                        <div {...dragHandleProps} className="pt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <FaGripVertical size={16} />
                        </div>
                    )}

                    <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                            {faq.title}
                        </h3>
                        {faq.group && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">
                                <FaLayerGroup />
                                {faq.group}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {!isReorderMode && (
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 shrink-0">
                        <button
                            onClick={onMoveUp}
                            disabled={!canUp}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('faq.moveUp')}
                        >
                            <IoChevronUp className="min-w-4 h-4"/>
                        </button>
                        <button
                            onClick={onMoveDown}
                            disabled={!canDown}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('faq.moveDown')}
                        >
                            <IoChevronDown className="min-w-4 h-4"/>
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-1.5 rounded-full hover:bg-blue-100/50 dark:hover:bg-blue-900/40 hover:text-blue-500 transition-colors"
                            title={t('common.edit')}
                        >
                            <IoPencil className="min-w-4 h-4"/>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-full hover:bg-red-100/50 dark:hover:bg-red-900/40 hover:text-red-500 transition-colors"
                            title={t('common.delete')}
                        >
                            <IoTrash className="min-w-4 h-4"/>
                        </button>
                    </div>
                )}
            </div>

            {/* Contenu */}
            <div className={`px-4 flex flex-col items-start gap-3 transition-all duration-300 ease-in-out`}>
                <div ref={contentRef} className="prose prose-sm max-w-none dark:prose-invert text-gray-600 dark:text-gray-300">
                    <MarkdownViewer key={isExpanded.toString()} markdown={isExpanded ? faq.content : limit(faq.content, 100)} />
                </div>
                {needsSeeMore && (
                    <span className='text-teal-600 dark:text-teal-400 px-4 py-0.5 cursor-pointer bg-teal-400/20 rounded-md' onClick={() => setIsExpanded((prev => !prev))}>{isExpanded ? t('common.seeLess') : t('common.seeMore')}</span>
                )}
            </div>

            {/* Sources */}
            {(faq.sources && faq.sources.length > 0) ? (
                <div className="px-4 pb-4 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {t('faq.sourcesTitle')}
                    </h4>
                    <ul className="flex flex-col gap-1.5">
                        {faq.sources.map((source, i) => (
                            <li key={i}>
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline transition-colors"
                                >
                                    <IoLinkOutline />
                                    {source.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : <div className="px-4 pb-4 space-y-2"></div>}

        </div>
    );
};


// FORMULAIRE FAQ AMÉLIORÉ
const FaqForm = ({
    productId,
    faq,
    onSave,
    onCancel,
    existingGroups
}: {
    productId: string,
    faq?: ProductFaqInterface,
    onSave: (data: any) => void,
    onCancel: () => void,
    existingGroups: string[]
}) => {
    const { t } = useTranslation();

    // États du formulaire
    const [title, setTitle] = useState(faq?.title || '');
    const [content, setContent] = useState(faq?.content || '');
    const [group, setGroup] = useState(faq?.group || '');
    const [sources, setSources] = useState<Partial<FaqSourceInterface>[]>(
        faq?.sources?.length ? faq.sources : [{ label: '', url: '' }]
    );
    const [isLoading, setLoading] = useState(false);

    // États pour l'autocomplétion des groupes
    const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
    const [filteredGroups, setFilteredGroups] = useState<string[]>([]);
    const groupInputRef = useRef<HTMLInputElement>(null);

    // Validation en temps réel
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

    // Gestion de l'autocomplétion des groupes
    const handleGroupChange = (value: string) => {
        setGroup(value);
        if (value.trim()) {
            const filtered = existingGroups.filter(g =>
                g.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredGroups(filtered);
            setShowGroupSuggestions(filtered.length > 0);
        } else {
            setShowGroupSuggestions(false);
        }
    };

    const selectGroup = (selectedGroup: string) => {
        setGroup(selectedGroup);
        setShowGroupSuggestions(false);
        groupInputRef.current?.blur();
    };

    // Validation
    const validateField = (field: string, value: string) => {
        const newErrors = { ...errors };

        switch (field) {
            case 'title':
                if (!value.trim()) {
                    newErrors.title = t('faq.validation.titleRequired');
                } else if (value.length < 5) {
                    newErrors.title = t('faq.validation.titleTooShort');
                } else {
                    delete newErrors.title;
                }
                break;
            case 'content':
                if (!value.trim()) {
                    newErrors.content = t('faq.validation.contentRequired');
                } else if (value.length < 10) {
                    newErrors.content = t('faq.validation.contentTooShort');
                } else {
                    delete newErrors.content;
                }
                break;
        }

        setErrors(newErrors);
    };

    const handleBlur = (field: string, value: string) => {
        setTouched({ ...touched, [field]: true });
        validateField(field, value);
        
    };

    // Gestion des sources
    const handleSourceChange = (index: number, field: 'label' | 'url', value: string) => {
        const newSources = [...sources];
        newSources[index] = { ...newSources[index], [field]: value };
        setSources(newSources);
    };

    const addSource = () => {
        if (sources.length < 5) {
            setSources([...sources, { label: '', url: '' }]);
        }
    };

    const removeSource = (index: number) => {
        if (sources.length > 1) {
            setSources(sources.filter((_, i) => i !== index));
        }
    };

    // Validation des sources
    const validateSources = () => {
        return sources.every(source => {
            if (!source.label?.trim() && !source.url?.trim()) return true; // Source vide OK
            return source.label?.trim() && source.url?.trim(); // Si une partie remplie, tout doit être rempli
        });
    };

    // Sauvegarde
    const handleSave = async () => {
        // Validation finale
        validateField('title', title);
        validateField('content', content);

        if (!title.trim() || !content.trim()) {
            showErrorToast(new Error(t('faq.validation.allFieldsRequired')));
            return;
        }

        if (!validateSources()) {
            showErrorToast(new Error(t('faq.validation.invalidSources')));
            return;
        }

        setLoading(true);

        try {
            const validSources = sources.filter(s => s.label?.trim() && s.url?.trim());

            await onSave({
                product_id: productId,
                title: title.trim(),
                content: content.trim(),
                group: group.trim() || null,
                sources: validSources.length > 0 ? validSources : null
            });
        } catch (error) {
            setLoading(false);
        }
    };

    // Raccourcis clavier
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isLoading && title.trim() && content.trim()) {
                        handleSave();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [title, content, isLoading]);

    // Styles
    const labelStyle = "block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2";
    const inputBaseStyle = "block w-full rounded-xl shadow-sm bg-white dark:bg-gray-800 border-2 transition-all duration-200 sm:text-sm p-3";
    const inputStyle = `${inputBaseStyle} border-gray-200 dark:border-gray-700 `;
    const inputErrorStyle = `${inputBaseStyle} border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20`;

    const getInputStyle:any = (field: string) => {
        return touched[field] && errors[field] ? inputErrorStyle : inputStyle;
    };

    const canSave = title.trim() && content.trim() && Object.keys(errors).length === 0 && validateSources();
    
    return (
        <div className="max-w-4xl mx-auto">
            <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="p-4 sm:p-6">
                    {/* Question et Groupe */}
                    <div className="grid mob:grid-cols-2 mb-6 gap-4">
                        {/* Question */}
                        <div className="lg:col-span-2">
                            <label htmlFor="faqTitle" className={labelStyle}>
                                {t('faq.questionLabel')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="faqTitle"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={(e) => handleBlur('title', e.target.value)}
                                placeholder={t('faq.questionPlaceholder')}
                                className={getInputStyle('title')}
                                maxLength={200}
                            />
                            <div className="flex justify-between items-center mt-2">
                                {touched.title && errors.title && (
                                    <span className="text-sm text-red-500 flex items-center gap-1">
                                        <IoWarning className="w-4 h-4" />
                                        {errors.title}
                                    </span>
                                )}
                                <span className={`text-xs ${title.length > 180 ? 'text-red-500' : 'text-gray-400'} ml-auto`}>
                                    {title.length}/200
                                </span>
                            </div>
                        </div>

                        {/* Groupe */}
                        <div className="relative">
                            <label htmlFor="faqGroup" className={labelStyle}>
                                {t('faq.groupLabel')}
                                <span className="text-xs font-normal text-gray-500 ml-1">
                                    ({t('common.optionalField')})
                                </span>
                            </label>
                            <input
                                ref={groupInputRef}
                                id="faqGroup"
                                type="text"
                                value={group}
                                onChange={(e) => handleGroupChange(e.target.value)}
                                onFocus={() => {
                                    if (existingGroups.length > 0) {
                                        setFilteredGroups(existingGroups);
                                        setShowGroupSuggestions(true);
                                    }
                                }}
                                onBlur={() => {
                                    // Délai pour permettre le clic sur les suggestions
                                    setTimeout(() => setShowGroupSuggestions(false), 150);
                                }}
                                placeholder={t('faq.groupPlaceholder')}
                                className={inputStyle}
                            />

                            {/* Suggestions de groupes */}
                            {showGroupSuggestions && filteredGroups.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                    {filteredGroups.map((suggestionGroup, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => selectGroup(suggestionGroup)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                        >
                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                {suggestionGroup}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Réponse */}
                    <div className="mb-3">
                        <label htmlFor="faqContent" className={labelStyle}>
                            {t('faq.answerLabel')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MarkdownEditor2
                                value={content}
                                setValue={(text) => {
                                    setErrors({ ...errors, content: '' })
                                    setContent(text);
                                }
                                }
                                onBlur={(value) => handleBlur('content', value||' ')}
                            />
                            {touched.content && errors.content && (
                                <span className="text-sm text-red-500 flex items-center gap-1 mt-2">
                                    <IoWarning className="w-4 h-4" />
                                    {errors.content}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Sources */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <label className={labelStyle}>
                                {t('faq.sourcesTitle')}
                                <span className="text-xs font-normal text-gray-500 ml-1">
                                    ({t('common.optionalField')})
                                </span>
                            </label>
                            <span className="text-xs text-gray-400">
                                {sources.filter(s => s.label?.trim() && s.url?.trim()).length}/5
                            </span>
                        </div>

                        <div className="space-y-4">
                            {sources.map((source, index) => (
                                <div key={index} className="group">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mt-1">
                                            <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                                                {index + 1}
                                            </span>
                                        </div>

                                        <div className="flex-grow grid mob:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={source.label || ''}
                                                onChange={(e) => handleSourceChange(index, 'label', e.target.value)}
                                                placeholder={t('faq.sourceLabelPlaceholder')}
                                                className={inputStyle}
                                            />
                                            <input
                                                type="url"
                                                value={source.url || ''}
                                                onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
                                                placeholder={t('faq.sourceUrlPlaceholder')}
                                                className={inputStyle}
                                            />
                                        </div>

                                        {sources.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSource(index)}
                                                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                title={t('faq.removeSource')}
                                            >
                                                <IoCloseCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {sources.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addSource}
                                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <IoAdd className="w-5 h-5" />
                                    {t('faq.addSourceButton')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex pb-12 px-4  flex-col sm:flex-row items-center gap-4 sm:justify-end">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                        >
                            {t('common.cancel')}
                        </button>

                        <button
                            type="submit"
                            disabled={!canSave || isLoading}
                            className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${canSave && !isLoading
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25'
                                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <IoHourglass className="w-4 h-4 animate-spin" />
                                    {t('common.saving')}
                                </>
                            ) : (
                                <>
                                    <IoCheckmarkCircle className="w-4 h-4" />
                                    {faq ? t('common.update') : t('common.save')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};