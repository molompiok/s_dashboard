// pages/products/@id/details/+Page.tsx (Adapter chemin si nécessaire)

// --- Imports ---
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePageContext } from '../../../../renderer/usePageContext';
import { useGlobalStore } from '../../../stores/StoreStore';
// ✅ Importer les hooks API nécessaires
import {
    useGetProductList, // Pour charger le produit
    useGetDetailList, // Pour charger les détails
    useCreateDetail,
    useUpdateDetail,
    useDeleteDetail,
} from '../../../../api/ReactSublymusApi';
import { DetailInterface, ListType, ProductInterface } from '../../../../Interfaces/Interfaces';
import { Topbar } from '../../../../Components/TopBar/TopBar';
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound';
import { Indicator } from '../../../../Components/Indicator/Indicator';
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete';
import { MarkdownEditor2 } from '../../../../Components/MackdownEditor/MarkdownEditor';
import { MarkdownViewer } from '../../../../Components/MarkdownViewer/MarkdownViewer'; // Pour affichage
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview';
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer';
import { Confirm } from '../../../../Components/Confirm/Confirm'; // Pour popup DetailInfo
import { getImg } from '../../../../Components/Utils/StringFormater';
import { getFileType, limit } from '../../../../Components/Utils/functions'; // Garder limit
import { DETAIL_LIMIT } from '../../../../Components/Utils/constants';
import { IoAdd, IoChevronDown, IoChevronUp, IoCloudUploadOutline, IoEllipsisHorizontal, IoPencil, IoTrash } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion'; // Garder pour animation
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../../../api/Logger';
import { v4 } from 'uuid'; // Pour ID temporaire
import { useChildViewer } from '../../../../Components/ChildViewer/useChildViewer';
import { useMyLocation } from '../../../../Hooks/useRepalceState';


export { Page };

// --- Composant Principal ---
function Page() {
    const { t } = useTranslation(); // ✅ i18n
    const { openChild } = useChildViewer();
    const { routeParams } = usePageContext();
    const { currentStore } = useGlobalStore();

    const [createRequired, setCreateRequired] = useState<Partial<DetailInterface>>()
    const { params, myLocation, replaceLocation, nextPage } = useMyLocation()
    const productId = params[1]

    // --- Récupération Données ---
    // Produit
    const { data: productData, isLoading: isLoadingProduct, isError } = useGetProductList(
        { product_id: productId, with_feature: true }, // Pas besoin des features ici a priori
        { enabled: !!productId && productId !== 'new' }
    );
    const product = productData?.list?.[0];

    // Détails
    const { data: detailsData, isLoading: isLoadingDetails, refetch: refetchDetails,
        isError: isFetchError,
        error: fetchError,
    } = useGetDetailList(
        { product_id: productId, limit: DETAIL_LIMIT + 5 }, // Fetcher un peu plus pour être sûr
        { enabled: !!productId && productId !== 'new' }
    );
    // Trier les détails par index côté client pour l'affichage et la logique up/down
    const sortedDetails = useMemo(() =>
        [...(detailsData?.list ?? [])].sort((a, b) => b.index - a.index),
        [detailsData?.list]
    );

    // --- Mutations ---
    const createDetailMutation = useCreateDetail();
    const updateDetailMutation = useUpdateDetail();
    const deleteDetailMutation = useDeleteDetail();
    // updateDetail est géré dans le popup DetailInfo

    // --- État & Handlers ---
    const isLoading = isLoadingProduct || isLoadingDetails;

    const handleOpenDetailPopup = (detail?: DetailInterface) => {
        const isCreating = !detail;
        openChild(
            <ChildViewer title={isCreating ? t('detail.addPopupTitle') : t('detail.editPopupTitle')}>
                <DetailInfo
                    // Donner un ID temporaire et product_id pour la création
                    detail={detail ?? { id: `new-${v4()}`, product_id: productId }}
                    onSave={(savedDetail) => {
                        if (isCreating) {
                            setCreateRequired(savedDetail)
                        } else {
                            console.log();

                            if (savedDetail.id) {
                                updateDetail(savedDetail.id, savedDetail)
                            }
                        }
                        openChild(null);
                        // Afficher toast succès?
                    }}
                    onCancel={() => openChild(null)}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };

    const handleDelete = (detailId: string, detailTitle?: string) => {
        openChild(
            <ChildViewer>
                <ConfirmDelete
                    title={t('detail.confirmDelete', { title: detailTitle || t('detail.thisDetail') })}
                    onCancel={() => openChild(null)}
                    onDelete={() => {
                        deleteDetailMutation.mutate({
                            detail_id: detailId
                        }, {
                            onSuccess: () => {
                                logger.info(`Detail ${detailId} deleted`);
                                // L'invalidation se fait maintenant dans le hook useDeleteDetail
                                // refetchDetails(); // Plus besoin si useDeleteDetail invalide bien
                                openChild(null);
                                // Afficher toast succès?
                            },
                            onError: (error) => {
                                logger.error({ error }, `Failed to delete detail ${detailId}`);
                                openChild(null);
                                // Afficher toast erreur?
                            }
                        });
                    }}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };

    // Handlers pour Up/Down (simplifié, appelle l'API directement)
    const handleMove = async (detailToMove: DetailInterface, direction: 'up' | 'down') => {
        const currentIndex = detailToMove.index;
        const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;

        // Trouver le détail voisin avec lequel échanger l'index
        const neighborDetail = sortedDetails.find(d => d.index === newIndex);

        if (newIndex < 0 || newIndex >= sortedDetails.length || !neighborDetail) {
            logger.warn("Cannot move detail, invalid index or neighbor not found", { detailId: detailToMove.id, direction, newIndex });
            return;
        }

        // Appeler la mutation d'update pour les deux détails pour échanger leur index
        // C'est un peu lourd, idéalement l'API gérerait ça atomiquement.
        // On utilise une promesse pour attendre les deux MAJ.
        try {
            // Mettre à jour le détail voisin avec l'index du détail actuel
            await updateDetail(neighborDetail.id, { index: currentIndex });
            // Mettre à jour le détail actuel avec le nouvel index
            await updateDetail(detailToMove.id, { index: newIndex });
            // Recharger la liste après succès
        } catch (error) {
            logger.error("Failed to swap detail indexes", error);
            // Afficher une erreur à l'utilisateur
        }
    };

    // Fonction helper pour appeler updateDetail (sera dans DetailInfo mais utilisée ici aussi)
    const updateDetail = (detailId: string, data: Partial<DetailInterface>) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });
        // **Important**: Il faut aussi envoyer l'ID dans le corps pour le schéma de validation updateDetailSchema
        formData.append('id', detailId);
        // Pas besoin de passer l'ID dans l'URL pour l'API updateDetail telle que définie
        return updateDetailMutation.mutateAsync({
            detail_id: detailId,
            data
        }, {
            onSuccess() {
                refetchDetails();
            },
        }); // Utiliser la mutation
    };
    const createDetail = (data: Partial<DetailInterface>) => {
        return createDetailMutation.mutateAsync({
            data
        }); // Utiliser la mutation
    };

    useEffect(() => {
        if (createRequired) {
            createDetail(createRequired)
            setCreateRequired(undefined)
        }
    }, [createRequired])


    // --- Rendu ---
    if (isLoading) return <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>;
    if (isFetchError && fetchError?.status === 404) return <PageNotFound title={t('product.notFound')} description={fetchError?.message} />;
    if (isFetchError) return <div className="p-6 text-center text-red-500">{fetchError?.message || t('error_occurred')}</div>;
    if (!product) return <PageNotFound title={t('product.notFound')} description={t('product.loadError')} />;


    const isDetailMaxReached = (sortedDetails?.length || 0) >= DETAIL_LIMIT;

    return (
        <div className="page-detail w-full flex flex-col bg-gray-100 min-h-screen">
            <Topbar back={true} title={t('detail.pageTitle', { name: product.name }).toString()} />

            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

                {/* Aperçu Produit */}
                {/* Utiliser mb-6 */}
                <div className="mb-6">
                    <ProductPreview product={product} />
                </div>


                {/* Section Ajout Détail */}
                {/* Utiliser p-4 bg-white rounded-lg shadow-sm border */}
                <div className="add flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                        {t('detail.sectionTitle')}
                        <span className='text-sm font-normal text-gray-500'>({sortedDetails.length} / {DETAIL_LIMIT})</span>
                        <Indicator title={t('detail.addTooltipTitle')} description={t('detail.addTooltipDesc', { limit: DETAIL_LIMIT })} />
                    </h2>
                    <button
                        type="button"
                        onClick={() => handleOpenDetailPopup()}
                        disabled={isDetailMaxReached}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoAdd size={18} className="-ml-1" />
                        {t('detail.addButton')}
                    </button>
                </div>

                {/* Liste des Détails */}
                {/* Utiliser flex flex-col gap-4 */}
                <div className="details flex flex-col gap-4">
                    <AnimatePresence initial={false}> {/* initial=false pour éviter anim au chargement */}
                        {sortedDetails.map((d, i) => (
                            <motion.div
                                key={d.id}
                                layout // Animation d'ordre
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="origin-top" // Pour l'animation d'exit
                            >
                                <DetailItem // Renommer Detail en DetailItem pour éviter conflit
                                    detail={d}
                                    canUp={i > 0} // Peut monter si pas le dernier
                                    canDown={i < sortedDetails.length - 1} // Peut descendre si pas le premier
                                    onDelete={() => handleDelete(d.id, d.title)}
                                    onOption={() => handleOpenDetailPopup(d)}
                                    onDown={() => handleMove(d, 'down')}
                                    onUp={() => handleMove(d, 'up')}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Message si aucun détail */}
                    {!isLoadingDetails && sortedDetails.length === 0 && (
                        <PageNotFound
                            image='/res/font.png'
                            description={t('detail.emptyDesc')}
                            title={t('detail.emptyTitle')}
                        // forward={t('detail.emptyLink')}
                        // iconForwardAfter={<IoChevronForward/>}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}


// --- Composant DetailItem (Ancien Detail) ---
function DetailItem({ detail, onDelete, onOption, onUp, onDown, canDown, canUp }: {
    canDown?: boolean;
    canUp?: boolean;
    onDown: () => void;
    onUp: () => void;
    onOption: () => void;
    onDelete: () => void;
    detail: Partial<DetailInterface>;
}) {
    const { t } = useTranslation();
    const view = detail?.view?.[0];
    const { currentStore } = useGlobalStore()

    return (
        // Utiliser bg-white, rounded-lg, shadow-sm, border, p-4, flex flex-col md:flex-row gap-4
        <div className="detail-item bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 items-start">
            {/* Image/Video */}
            {/* Utiliser w-full md:w-40 lg:w-48, aspect-square, rounded-md, flex-shrink-0 */}
            {view && ( // Afficher seulement si une vue existe
                <div className="w-full md:w-40 lg:w-48 aspect-square rounded-md flex-shrink-0 bg-gray-100 overflow-hidden">
                    {getFileType(view) === 'image' ? (
                        <img src={getImg(view, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1]} alt={detail.title || 'Detail view'} className="w-full h-full object-cover" />
                    ) : (
                        <video loop autoPlay muted playsInline className="w-full h-full object-cover" src={getImg(view, undefined, currentStore?.url).match(/url\("?([^"]+)"?\)/)?.[1]} />
                    )}
                </div>
            )}

            {/* Contenu Texte + Actions */}
            {/* Utiliser flex-grow min-w-0 */}
            <div className="flex-grow min-w-0 w-full">
                {/* Titre et Options */}
                <div className="flex justify-between items-start gap-2 mb-2">
                    <h2 className={`text-base font-semibold text-gray-800 ${!detail.title ? 'italic text-gray-400' : ''}`}>
                        {detail.title || t('detail.untitled')}
                    </h2>
                    {/* Options (Up/Down/Delete/Edit) */}
                    <div className="options flex items-center gap-1 text-gray-400 flex-shrink-0">
                        <button onClick={onUp} disabled={!canUp} title={t('common.moveUp')} className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                            <IoChevronUp />
                        </button>
                        <button onClick={onDown} disabled={!canDown} title={t('common.moveDown')} className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed">
                            <IoChevronDown />
                        </button>
                        <button onClick={onOption} title={t('common.edit')} className="p-1 rounded-full hover:bg-gray-100 hover:text-gray-600">
                            <IoEllipsisHorizontal />
                        </button>
                        <button onClick={onDelete} title={t('common.delete')} className="p-1 rounded-full hover:bg-red-50 hover:text-red-600">
                            <IoTrash />
                        </button>
                    </div>
                </div>
                {/* Description (Markdown Viewer) */}
                {/* Ajouter une classe prose pour le style markdown si nécessaire */}
                <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                    <MarkdownViewer key={(detail.updated_at || '') + detail.id} markdown={detail.description || t('detail.noDescription')} />
                </div>
            </div>
        </div>
    );
}


// --- Composant DetailInfo (Popup d'édition/création) ---
function DetailInfo({ detail: initialDetail, onSave, onCancel }: {
    onCancel: () => void;
    detail: Partial<DetailInterface>; // Inclut id, product_id potentiellement
    onSave: (detailData: Partial<DetailInterface>) => void; // Retourne seulement les données modifiées/nouvelles
}) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    // État local du formulaire
    const [collected, setCollected] = useState<Partial<DetailInterface & { prevView?: string }>>({
        ...initialDetail,
        // Séparer le fichier de la preview
        prevView: typeof initialDetail?.view?.[0] === 'string' ? initialDetail.view[0] : undefined,
    });
    const [localPreview, setLocalPreview] = useState<string | undefined>(
        typeof initialDetail?.view?.[0] === 'object' ? URL.createObjectURL(initialDetail.view[0]) : undefined
    );
    // Erreurs potentielles (validation plus simple ici)
    const [titleError, setTitleError] = useState(false);

    // Nettoyer la preview locale
    useEffect(() => {
        return () => {
            if (localPreview) URL.revokeObjectURL(localPreview);
        };
    }, [localPreview]);

    // Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.[0]) {
            // Si l'utilisateur annule, remettre l'image originale si elle existait
            setCollected(prev => ({ ...prev, view: initialDetail.view ?? [] }));
            setLocalPreview(undefined); // Supprimer la preview locale
            return;
        }
        const file = files[0];
        const previewUrl = URL.createObjectURL(file);

        // Révoquer l'ancienne preview locale si elle existait
        if (localPreview) URL.revokeObjectURL(localPreview);

        setCollected(prev => ({ ...prev, view: [file] })); // Remplacer par le nouveau fichier
        setLocalPreview(previewUrl);
        // Reset erreur si nécessaire
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCollected(prev => ({ ...prev, [name]: value }));
        if (name === 'title') setTitleError(value.trim().length === 0); // Erreur si titre vide
    };

    const handleMarkdownChange = (value: string) => {
        setCollected(prev => ({ ...prev, description: value }));
    };

    const handleConfirm = () => {
        // Validation simple
        const isTitleValid = collected.title && collected.title.trim().length > 0;
        setTitleError(!isTitleValid);
        if (!isTitleValid) return;

        // Construire l'objet de données à sauvegarder
        const dataToSave: Partial<DetailInterface> = {
            id: collected.id, // Peut être undefined si nouveau
            product_id: collected.product_id,
            title: collected.title,
            description: collected.description,
            type: collected.type // Garder le type si défini
        };

        // Ne pas inclure 'view' si c'est la même string qu'initialement
        const currentViewFile = collected.view?.[0];
        const initialViewUrl = typeof initialDetail?.view?.[0] === 'string' ? initialDetail.view[0] : null;

        if (currentViewFile instanceof File) {
            // Si un nouveau fichier a été sélectionné, on le met dans les données à sauvegarder
            // L'API s'attend à recevoir le fichier dans FormData, pas ici directement.
            // On signale juste qu'il y a un fichier à traiter.
            dataToSave.view = collected.view; // Contient le File object
        } else if (collected.view === undefined || collected.view?.length === 0) {
            // Si l'utilisateur a supprimé l'image (et qu'il y en avait une avant)
            if (initialViewUrl) {
                dataToSave.view = []; // Envoyer tableau vide pour indiquer suppression
            }
        }
        // Si collected.view contient une string et est différent de l'initial, on le garde (ne devrait pas arriver avec ce code)
        else if (typeof currentViewFile === 'string' && currentViewFile !== initialViewUrl) {
            dataToSave.view = collected.view;
        }

        onSave(dataToSave); // Envoyer les données modifiées/nouvelles
    };

    // Affichage de l'image (preview locale ou URL serveur)
    const viewUrlForDisplay = localPreview ? getImg(localPreview) : (typeof collected?.view?.[0] === 'string' ? getImg(collected.view[0], undefined, currentStore?.url) : getImg('/res/empty/drag-and-drop.png', '70%'));
    const showPlaceholder = !localPreview && (!collected?.view || collected.view.length === 0 || typeof collected.view[0] !== 'string');

    
    return (
        // Utiliser flex flex-col gap-4 ou 5, padding
        <div className="detail-info p-4 sm:p-6 flex flex-col gap-5">
            <div>
                <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='detail-view-input'>
                    {t('detail.imageLabel')}
                </label>
                <label htmlFor='detail-view-input' className={`relative block w-full aspect-video rounded-lg cursor-pointer overflow-hidden group bg-gray-100 border  hover:bg-gray-200`}>
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-150"
                        style={{ background: viewUrlForDisplay }}
                    ></div>
                    {showPlaceholder && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500">
                            <IoCloudUploadOutline size={40} />
                            <span className="mt-1 text-xs">{t('detail.selectImagePrompt')}</span>
                        </div>
                    )}
                    {!showPlaceholder && (
                        <div className="absolute bottom-2 right-2 p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow text-gray-600 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <RiImageEditFill size={18} />
                        </div>
                    )}
                    <input id='detail-view-input' name="view" type="file" accept='image/*,video/*' className="sr-only" onChange={handleFileChange} />
                </label>
            </div>

            {/* Titre */}
            <div>
                <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-detail-title'>
                    <span>{t('detail.titleLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                    <span className={`text-xs ${(collected.title?.trim()?.length || 0) > 124 ? 'text-red-600' : 'text-gray-400'}`}>
                        {(collected.title?.trim()?.length || 0)} / 124
                    </span>
                </label>
                <input
                    id='input-detail-title'
                    name="title"
                    className={`block w-full rounded-md shadow-sm sm:text-sm h-10 ${titleError ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                    type="text"
                    value={collected.title || ''}
                    placeholder={t('detail.titlePlaceholder')}
                    onChange={handleTextChange}
                />
                {titleError && <p className="mt-1 text-xs text-red-600">{t('detail.validation.titleRequired')}</p>}
            </div>

            {/* Description */}
            <div>
                <label className='block text-sm font-medium text-gray-700 mb-1 flex justify-between items-center' htmlFor='input-detail-description'>
                    <span>{t('detail.descriptionLabel')} <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" /></span>
                    <span className={`text-xs ${(collected.description?.trim()?.length || 0) > 2000 ? 'text-red-600' : 'text-gray-400'}`}>
                        {(collected.description?.trim()?.length || 0)} / 2000
                    </span>
                </label>
                <MarkdownEditor2
                    value={collected.description || ''}
                    setValue={handleMarkdownChange}
                // error={!!fieldErrors.description}
                />
                {/* {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>} */}
            </div>

            {/* Confirmation */}
            <Confirm
                // Actif seulement si titre valide (et image si nouveau?)
                canConfirm={!!collected.title?.trim()}
                onCancel={onCancel}
                confirm={t('common.ok')}
                onConfirm={handleConfirm}
            // iconConfirmLeft={mutation.isPending ? <Spinner /> : undefined} // Gérer état chargement si mutation passée en prop
            />
        </div>
    );
}