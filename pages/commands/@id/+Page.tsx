// pages/commands/@id/+Page.tsx

import { IoCheckmarkCircle, IoChevronForward, IoCloudDownloadOutline, IoCopyOutline, IoQrCode } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import { OrderStatus, PaymentMethod } from '../../../Components/Utils/constants'; // Garder enums
import { OrderStatusElement, statusColors } from '../../../Components/Status/Satus';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { copyToClipboard, FeatureType, getId, limit } from '../../../Components/Utils/functions'; // Garder utilitaires
import { CommandInterface, CommandItemInterface, EventStatus, ProductInterface, UserInterface, ValueInterface } from '../../../api/Interfaces/Interfaces'; // Garder Interfaces
import { FaTruck } from 'react-icons/fa';
import { IoCall, IoStorefront, IoMail, IoLocationSharp, IoPhonePortraitOutline, IoCard, IoCash, IoPricetag, IoCloseOutline } from 'react-icons/io5'; // Ajouter IoCash, IoCard
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { useEffect, useMemo, useState } from 'react'; // Ajouter useMemo
// import { useApp } from '../../../renderer/AppStore/UseApp'; // Supprimé si non utilisé
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer'; // Importer le hook useChildViewer
// import { getTransmit, useGlobalStore  } from '../../stores/StoreStore'; // Assurer chemin correct
import { useGlobalStore } from '../../../api/stores/StoreStore';
import { getTransmit } from '../../../api/stores/StoreStore';
import { usePageContext } from '../../../renderer/usePageContext';
import { markdownToPlainText } from '../../../Components/MarkdownViewer/MarkdownViewer';
import { getMedia } from '../../../Components/Utils/StringFormater';
import IMask from "imask";
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { DateTime } from 'luxon';
import "react-day-picker/style.css"; // Garder CSS DayPicker
import { useGetOrderDetails, useUpdateOrderStatus, queryClient } from '../../../api/ReactSublymusApi'; // ✅ Importer hooks API et queryClient
import logger from '../../../api/Logger'; // Assurer chemin correct
import { UseMutationResult } from '@tanstack/react-query';
import { ApiError } from '../../../api/SublymusApi';
import { Page as Receipt } from './receipt/+Page';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { showErrorToast, showToast } from '../../../Components/Utils/toastNotifications';
import { OrderDetailSkeleton } from '../../../Components/Skeletons/allsKeletons';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { Data } from '../../../renderer/AppStore/Data';
import { buttonStyle } from '../../../Components/Button/Style';
import { SpinnerIcon } from '../../../Components/Confirm/Spinner';

const allowedTransitionsClient: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED, OrderStatus.FAILED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELED, OrderStatus.FAILED], // Ici on propose les deux, le choix dépendra de with_delivery
    [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.PICKED_UP, OrderStatus.NOT_PICKED_UP],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.NOT_DELIVERED, OrderStatus.FAILED], // Enlever RETURNED ici ?
    [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
    [OrderStatus.PICKED_UP]: [OrderStatus.RETURNED],
    [OrderStatus.NOT_DELIVERED]: [OrderStatus.SHIPPED, OrderStatus.RETURNED, OrderStatus.CANCELED],
    [OrderStatus.NOT_PICKED_UP]: [OrderStatus.CANCELED],
}

export { Page };

function Page() {
    const { t } = useTranslation(); // ✅ i18n
    const { currentStore } = useGlobalStore();
    const { openChild } = useChildViewer(); // Utiliser le hook pour ouvrir/fermer
    const size = useWindowSize();

    const { routeParams } = usePageContext();
    const command_id = routeParams?.['id'];

    // ✅ Utiliser le hook pour récupérer les détails
    const { data: command, isLoading, isError, error: apiError, refetch } = useGetOrderDetails(
        {
            order_id: command_id
        },
        { enabled: !!currentStore && !!command_id }
    );

    // ✅ Utiliser la mutation pour mettre à jour le statut

    const low = useMemo(() => size.width < 380, [size.width]);

    // ✅ Logique SSE (inchangée mais vérifiée)
    useEffect(() => {
        if (!currentStore?.api_url || !command_id) return;
        const transmit = getTransmit(currentStore.api_url);
        const channel = `store/${Data.apiUrl}/update_command`;
        logger.info(`Subscribing to SSE channel for order updates: ${channel}`);
        const subscription = transmit?.subscription(channel);
        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                subscription.onMessage<{ id: string }>((data) => {
                    console.log({ data });

                    if (data.id === command_id) {
                        console.log(`Received SSE update for current order ${command_id}. Invalidating...`);
                        refetch()
                    } else {
                        console.log(`Received SSE update for different order ${data.id}. Ignoring.`);
                    }
                });
            } catch (err) {
                logger.error({ channel, orderId: command_id, error: err }, "Failed to subscribe to order update SSE channel");
            }
        }
        subscribe();
        return () => {
            logger.info(`Unsubscribing from SSE channel: ${channel}`);
            subscription?.delete();
        };
    }, [currentStore?.id, currentStore?.api_url, command_id]);

    // --- Handlers (avec gestion chargement/erreur) ---
    const handleOpenStatusUpdate = () => {
        if (!command?.id || !command?.status) return;
        openChild(
            <ChildViewer title={t('order.updateStatusTitle')}>
                <StatusUpdatePopup
                    isDelivery={!!command.with_delivery}
                    currentStatus={command.status as OrderStatus}
                    orderId={command.id}
                    onClose={() => openChild(null)}
                />
            </ChildViewer>,
            { background: '#3455' }
        );
    };


    const commandRef = command?.reference || command?.id?.substring(0, 8); // Utiliser référence ou début ID
    const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        const crumbs: BreadcrumbItem[] = [
            { name: t('navigation.home'), url: '/' },
            { name: t('navigation.orders'), url: '/commands' }, // Lien vers la liste
        ];
        if (commandRef) {
            crumbs.push({ name: `#${commandRef}` }); // Référence/ID commande, pas de lien
        } else if (command?.id) {
            crumbs.push({ name: t('common.loading') });
        }
        return crumbs;
    }, [t, command?.id, commandRef]);

    const [isPageLoading, setIsPageLoading] = useState(true);
    useEffect(() => {
        setIsPageLoading(false)
    }, []);
    // --- Rendu ---
    if (isLoading || isPageLoading) return <OrderDetailSkeleton />
    if (isError) return <PageNotFound />
    if (!command) return <PageNotFound />

    return (
        <div className="w-full pb-48 flex flex-col min-h-screen">
            <Topbar back breadcrumbs={breadcrumbs} />
            <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <CommandTop command={command} />

                <h2 className="text-xl font-semibold text-gray-800 mb-0">{t('order.customerInfoTitle')}</h2>
                {command.user && <CommandUser command={command} user={command.user} />}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-0 mt-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {t('order.productListTitle')}
                        <span className="text-sm font-medium text-gray-500 ml-1">
                            ({t('dashboard.itemCount', { count: command.items?.length || 0 })})
                        </span>
                    </h2>
                    <span className="text-base sm:text-lg font-semibold text-gray-700">
                        {t('order.totalLabel')}: {Number(command.total_price || 0).toLocaleString()} {command.currency}
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    {command.items?.map((item) => <CommandProduct key={item.id} item={item} />)}
                </div>

                <div className="flex flex-col min-[360px]:flex-row justify-between items-start sm:items-center gap-2 mb-0 mt-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {t('order.statusEvolutionTitle')}
                    </h2>
                     {  (allowedTransitionsClient[command.status as OrderStatus]?.length||0)>0 && <button
                        onClick={handleOpenStatusUpdate}
                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer px-3 py-1 rounded border border-blue-300 hover:shadow-md hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('order.updateStatusButton')}
                    </button>}
                </div>
                <CommandStatusHistory events={command.events_status || []} low={low} />
            </div>
        </div>
    );
}

// =========================================
// == SOUS-COMPOSANTS POUR LA PAGE DETAIL ==
// =========================================

// --- Composant CommandTop ---
export function CommandTop({ command, forRecipet }: { forRecipet?: boolean, command?: Partial<CommandInterface> }) {
    const { t } = useTranslation();
    const commandId = command?.id ?? '';
    const commandIdShort = getId(commandId);
    const [copiedId, setCopiedId] = useState(false);
    const { openChild } = useChildViewer()
    const handleCopy = (textToCopy: string | undefined) => {
        if (!textToCopy) return;
        copyToClipboard(textToCopy, () => {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 1500); // Réinitialiser après 1.5s
        });
    };

    const qrCodeValue = commandId ? `${window.location.origin}/commands/${commandId}` : 'no-command-id';

    return (
        <div className="w-full flex flex-wrap items-start gap-x-6 gap-y-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* QR Code & ID */}
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex flex-col">
                    <QRCodeCanvas value={qrCodeValue} size={80} bgColor="#ffffff" fgColor="#374151" level="Q" className="border border-gray-200 rounded p-1" />

                    {
                        !forRecipet && <div className='flex items-center cursor-pointer gap-2 text-gray-600 border justify-center mt-2 py-1 border-gray-200 rounded-md bg-teal-100 hover:bg-teal-200'
                            onClick={() => {
                                openChild(<ChildViewer>
                                    <Receipt command={command} i18nIsDynamicList />
                                </ChildViewer>,
                                    { background: '#3455' }
                                )
                            }}>
                            <IoCloudDownloadOutline size={22} />
                            <span className='text-sm'>{t('receipt.name')}</span>
                        </div>
                    }

                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">{t('order.commandIdLabel')}</span>
                    <div className='flex items-center gap-1.5 group cursor-pointer' title={t('common.copy')} onClick={() => handleCopy(commandIdShort)}>
                        <IoQrCode className='w-4 h-4 text-gray-400' />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{commandIdShort}</span>
                        <IoCopyOutline className={`w-4 h-4 transition-all ${copiedId ? 'text-green-500 scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                    {command?.reference && (
                        <div className="mt-1">
                            <span className="text-xs text-gray-500">{t('order.referenceLabel')}</span>
                            <span className="block text-sm text-gray-600">{command.reference}</span>
                        </div>
                    )}

                </div>
            </div>
            {/* Mode Livraison */}
            <div className="flex items-center gap-2 text-sm">
                {command?.with_delivery ? <FaTruck className='w-5 h-5 text-gray-500 flex-shrink-0' /> : <IoStorefront className='w-5 h-5 text-gray-500 flex-shrink-0' />}
                <span className='text-gray-700'>{command?.with_delivery ? t('order.deliveryMode.home') : t('order.deliveryMode.pickup')}</span>
                <OrderStatusElement status={(command?.status as any) ?? 'PENDING'} />
            </div>
            {/* Paiement */}
            <div className="flex items-center gap-2 text-sm">
                <PaymentMethodElement paymentMethod={command?.payment_method as any} />
                <OrderStatusElement status={(command?.payment_status as any) ?? 'PENDING'} />
            </div>
        </div>
    );
}

// --- Composant PaymentMethodElement ---
export function PaymentMethodElement({ paymentMethod }: { paymentMethod?: PaymentMethod }) {
    const { t } = useTranslation();
    let Icon = IoCard;
    let textKey = 'order.paymentMethod.card';
    switch (paymentMethod) {
        case PaymentMethod.CASH: Icon = IoCash; textKey = 'order.paymentMethod.cash'; break;
        case PaymentMethod.MOBILE_MONEY: Icon = IoPhonePortraitOutline; textKey = 'order.paymentMethod.mobile'; break;
        case PaymentMethod.PAYPAL: /* Icon = PaypalIcon; */ textKey = 'order.paymentMethod.paypal'; break;
    }
    return (
        <>
            <Icon className='w-5 h-5 text-gray-500 flex-shrink-0' />
            <span className='text-gray-700'>{t(textKey)}</span>
        </>
    );
}

// --- Composant CommandUser ---
export function CommandUser({ user, command }: { command: Partial<CommandInterface>, user: Partial<UserInterface> }) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore()
    const maskedPhone = command.phone_number && command.formatted_phone_number
        ? IMask.pipe(command.phone_number, { mask: command.formatted_phone_number })
        : command.phone_number;
    const mapQuery = command.delivery_latitude && command.delivery_longitude ? `${command.delivery_latitude},${command.delivery_longitude}` : (command.pickup_latitude && command.pickup_longitude ? `${command.pickup_latitude},${command.pickup_longitude}` : command.delivery_address || command.pickup_address);
    const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : undefined;
    const telLink = command.phone_number ? `tel:${command.phone_number}` : undefined;
    const waLink = command.phone_number ? `https://wa.me/${command.phone_number}` : undefined;
    const tgLink = command.phone_number ? `https://t.me/${command.phone_number}` : undefined;
    const mailLink = user.email ? `mailto:${user.email}?subject=${t('order.emailSubject', { ref: command.reference ?? command.id })}` : undefined;

    return (
        <div className="flex flex-col min-[420px]:flex-row max-[420px]:items-center items-start gap-4 p-4 bg-white rounded-lg shadow-min-[500px] border border-gray-200">
            <div
                className={`w-24 h-24 flex items-center ${user.photo?.[0] ? '' : 'gb-gray-300'} font-bold text-gray-500 justify-center text-4xl rounded-full object-cover border-4 border-white shadow`}
                style={{ background: user.photo?.[0] ? getMedia({ isBackground: true, source: user.photo[0], from: 'api' }) : 'var(--color-gray-100)' }}
            >
                {!user.photo?.[0] && (user.full_name?.substring(0, 2).toUpperCase() || '?')}
            </div>
            <div className="max-[420px]:items-centerflex flex-col gap-3 flex-grow min-w-0">
                <h2 className="text-lg font-semibold text-gray-800 truncate" title={user.full_name}>{user.full_name || t('common.anonymous')}</h2>
                {/* Téléphone */}
                {maskedPhone && (
                    <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between gap-1 min-[500px]:gap-2">
                        <a href={telLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-min-[500px] text-gray-700 hover:text-blue-600 min-w-0">
                            <IoCall className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{maskedPhone}</span>
                        </a>
                        <div className="flex items-center gap-2 mt-1 min-[500px]:mt-0 flex-shrink-0">
                            {telLink && <a href={telLink} title={t('order.callAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/telephone.png'} alt="Call" className="w-5 h-5" /></a>}
                            {waLink && <a href={waLink} title={t('order.whatsappAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/social.png'} alt="WhatsApp" className="w-5 h-5" /></a>}
                            {tgLink && <a href={tgLink} title={t('order.telegramAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/telegram.png'} alt="Telegram" className="w-5 h-5" /></a>}
                        </div>
                    </div>
                )}
                {/* Email */}
                {user.email && (
                    <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between gap-1 min-[500px]:gap-2">
                        <a href={mailLink} className="flex items-center gap-2 text-min-[500px] text-gray-700 hover:text-blue-600 min-w-0">
                            <IoMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                        </a>
                        <div className="flex items-center gap-2 mt-1 min-[500px]:mt-0 flex-shrink-0">
                            {mailLink && <a href={mailLink} title={t('order.emailAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/gmail.png'} alt="Email" className="w-5 h-5" /></a>}
                        </div>
                    </div>
                )}
                {/* Adresse */}
                {(command.delivery_address || command.pickup_address) && (
                    <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between gap-1 min-[500px]:gap-2">
                        <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-min-[500px] text-gray-700 hover:text-blue-600 min-w-0">
                            <IoLocationSharp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="flex-grow">{command.delivery_address || command.pickup_address}</span>
                        </a>
                        <div className="flex items-center gap-2 mt-1 min-[500px]:mt-0 flex-shrink-0">
                            {mapUrl && <a href={mapUrl} title={t('order.mapAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/maps.png'} alt="Map" className="w-5 h-5" /></a>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Composant CommandProduct ---
export function CommandProduct({ item, openProduct = true }: { openProduct?: boolean, item: CommandItemInterface }) {
    const { t } = useTranslation();
    const isReturn = item.status === OrderStatus.RETURNED; // Utiliser l'enum
    const { currentStore } = useGlobalStore();
    const [copiedId, setCopiedId] = useState(false);

    // Simplification: Accès plus direct à l'image via le modèle préchargé
    const imageUrl = item.product?.features?.find(f => f.is_default)?.values?.[0]?.views?.[0] ?? item.product?.features?.[0]?.values?.[0]?.views?.[0];

    const handleCopy = (textToCopy: string | undefined) => {
        if (!textToCopy) return;
        copyToClipboard(textToCopy, () => {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 1500);
        });
    };

    return (
        <div className={`relative p-3 pb-8 rounded-xl flex flex-col sm:flex-row items-start gap-3 shadow-sm border ${isReturn ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
            }`}>
            {/* Image */}
            <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex-shrink-0 bg-cover bg-center bg-gray-200"
                style={{ background: getMedia({ isBackground: true, source: imageUrl, from: 'api' }) }} // Passer URL base store pour images relatives
            ></div>
            {/* Infos */}
            <div className="flex-grow flex flex-col gap-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div className="flex-grow min-w-0">
                        <h2 className='font-semibold text-base text-gray-800 truncate' title={item.product?.name}>
                            {item.product?.name ?? t('common.unknownProduct')}
                        </h2>
                        <p className='text-xs text-gray-500 mt-0.5 line-clamp-2' title={markdownToPlainText(item.product?.description || '')}>
                            {markdownToPlainText(item.product?.description || '')}
                        </p>
                        <p className='text-xs text-gray-400 mt-0.5 flex items-center gap-1 group cursor-pointer'
                            title={t('common.copyId')}
                            onClick={() => handleCopy(getId(item?.product_id))}>
                            ID: {getId(item.product_id)}
                            <IoCopyOutline className={`w-3 h-3 transition-all ${copiedId ? 'text-green-500 scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-60'}`} />
                        </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end flex-shrink-0 mt-1 sm:mt-0">
                        <h3 className='text-xs text-gray-600 whitespace-nowrap'>
                            {item.quantity} <IoCloseOutline className="inline -mt-px" /> {Number(item.price_unit || 0).toLocaleString()} {item.currency}
                        </h3>
                        <h2 className='text-sm font-medium text-gray-800 whitespace-nowrap flex items-center gap-1'>
                            <IoPricetag className="w-3 h-3 text-gray-400" /> {(item.quantity * (item.price_unit || 0)).toLocaleString()} {item.currency}
                        </h2>
                    </div>
                </div>
                {/* Variantes */}
                {item.bind_name && typeof item.bind_name === 'object' && Object.keys(item.bind_name).length > 0 && ( // Vérifier typeof object
                    <ul className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                        {Object.entries(item.bind_name).map(([key, value]) => {
                            // Extraction plus robuste des infos de la clé et valeur
                            const [featureName, featureType] = key.split(':');
                            const valueText = typeof value === 'string' ? value : (value as ValueInterface)?.text;
                            const valueKey = typeof value === 'string' ? null : (value as ValueInterface)?.key;
                            const valueIcon = typeof value === 'string' ? null : (value as ValueInterface)?.icon?.[0];

                            if (!featureName || !valueText) return null; // Ne pas afficher si infos manquantes

                            return (
                                <li key={key} className="flex items-center border border-gray-200 rounded text-xs leading-none max-w-full">
                                    <span className='bg-gray-100 text-gray-600 px-1.5 py-1 rounded-l'>{limit(featureName, 12)}</span>
                                    {valueIcon && <span className='w-5 h-5 rounded mx-1 bg-cover bg-center' style={{ background: getMedia({ isBackground: true, source: valueIcon }) }}></span>}
                                    {valueKey && featureType === FeatureType.COLOR && <span className='w-3 h-3 rounded-full mx-1.5 border border-gray-300' style={{ backgroundColor: valueKey }}></span>}
                                    <span className='text-gray-800 px-1.5 py-1 truncate rounded-r' title={valueText || undefined}>{limit(valueText, 16)}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            {isReturn && <span className='absolute top-2 right-2'><OrderStatusElement status={item.status?.toUpperCase() as any} /></span>}
            {
                openProduct && <a href={`/products/${item.product_id}`} className="absolute bottom-1 right-1 px-2 py-0.5 rounded-lg border border-gray-200 text-xs text-blue-600 bg-white/80 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-300 cursor-pointer hover:shadow-md flex items-center gap-1">
                    {t('order.viewProduct')}
                    <IoChevronForward className="w-3 h-3" />
                </a>
            }
        </div>
    );
}

// --- Composant CommandStatusHistory ---
export function CommandStatusHistory({ events, low }: { events: EventStatus[], low: boolean }) {
    const { t, i18n } = useTranslation(); // ✅ i18n
    // S'assurer que les événements sont triés du plus récent au plus ancien
    const sortedEvents = useMemo(() => [...events].sort((a, b) => DateTime.fromISO(a.change_at).toMillis() - DateTime.fromISO(b.change_at).toMillis()), [events]);

    return (
        <div className="flex flex-col">
            {sortedEvents.map((k, i, arr) => {
                const eventDate = DateTime.fromISO(k.change_at);
                // Utiliser la locale de i18next si possible
                const currentLocale = i18n.language;
                const formattedDate = eventDate.isValid ? eventDate.setLocale(currentLocale).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY) : 'N/A';
                const formattedTime = eventDate.isValid ? eventDate.setLocale(currentLocale).toLocaleString(DateTime.TIME_SIMPLE) : '';

                return (
                    <div key={`${k.change_at}-${k.status}-${i}`} className="flex gap-3 sm:gap-4">
                        {/* Date Col */}
                        {!low && (
                            <div className="hidden sm:flex flex-col items-end w-32 text-right flex-shrink-0 pt-1">
                                <span className="text-xs font-medium text-gray-700">{formattedDate}</span>
                                <span className="text-xs text-gray-500">{formattedTime}</span>
                            </div>
                        )}
                        {/* Step Col */}
                        <div className="flex flex-col items-center self-stretch">
                            {/* Icône (utiliser une icône plus pertinente peut-être) */}
                            <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs z-10 shadow" style={{ backgroundColor: (statusColors as any)[k.status.toUpperCase()] ?? '#9CA3AF' }}>
                                <IoCheckmarkCircle />
                            </span>
                            {/* Barre */}
                            {i < arr.length - 1 && <div className="w-0.5 flex-grow bg-gray-300 my-1"></div>}
                        </div>
                        {/* Info Col */}
                        <div className="flex-grow pb-6">
                            <div className="flex justify-between items-center mb-1 flex-wrap gap-x-2"> {/* flex-wrap pour mobile */}
                                <OrderStatusElement status={k.status as any} />
                                {low && (
                                    <div className="text-right">
                                        <span className="block text-xs font-medium text-gray-700">{formattedDate}</span>
                                        <span className="block text-xs text-gray-500">{formattedTime}</span>
                                    </div>
                                )}
                            </div>
                            {k.message && <p className="text-sm text-gray-600 mt-1">{k.message}</p>}
                            {/* Afficher l'acteur du changement */}
                            {k.user_provide_change_id && k.user_role && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('order.statusChangedBy', { role: t(`roles.${k.user_role}`, k.user_role) })}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// --- Composant Popup StatusUpdatePopup ---
export function StatusUpdatePopup({ currentStatus, orderId, onClose, isDelivery }: {
    currentStatus: OrderStatus;
    orderId: string;
    onClose: () => void;
    isDelivery: boolean;
}) {
    const { t } = useTranslation();
    const mutation = useUpdateOrderStatus();
    const [selected, setSelected] = useState<OrderStatus|undefined>() 
    const getValidNextStatuses = (current: OrderStatus, deliveryMode: boolean): OrderStatus[] => {
        const possibleNext = allowedTransitionsClient[current] || [];

        // Filtrer en fonction du mode (livraison/retrait) si nécessaire
        if (current === OrderStatus.PROCESSING) {
            return possibleNext.filter(status =>
                deliveryMode ? status !== OrderStatus.READY_FOR_PICKUP : status !== OrderStatus.SHIPPED
            );
        }
        // Ajouter d'autres logiques de filtrage si besoin

        return possibleNext;
    };

    const validNextStatuses = useMemo(() => getValidNextStatuses(currentStatus, isDelivery), [currentStatus, isDelivery]);

    const handleUpdate = (newStatus: OrderStatus) => {
        mutation.mutate(
            { user_order_id: orderId, status: newStatus },
            {
                onSuccess: () => {
                    logger.info("Order status update success, closing popup.");
                    showToast("Statut de la commande mis à jour avec succès"); // ✅ Toast succès
                    onClose();
                },
                onError: (error) => {
                    logger.error({ orderId, newStatus, error }, "Order status update mutation failed.");
                    showErrorToast(error); // ❌ Toast erreur
                    // onClose(); // On ne ferme pas pour laisser l'utilisateur voir l'erreur
                },
            }
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl  w-full"> {/* Augmenté max-w un peu */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('order.updateStatusTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">
                {t('order.currentStatusLabel')}: <OrderStatusElement status={currentStatus} />
            </p>

            {validNextStatuses.length > 0 ? (
                <div className='flex flex-wrap gap-3 items-center'>
                    <p className="text-sm text-gray-500  mr-2">
                        {t('order.nextStatus')}:
                    </p>
                    {validNextStatuses.map((nextStatus) => (
                        <button
                            key={nextStatus}
                            type="button"
                            onClick={() =>setSelected(nextStatus)}
                            disabled={mutation.isPending} // Désactiver seulement pendant la mutation
                            className={`disabled:opacity-50 cursor-pointer disabled:cursor-wait transition hover:scale-105`}
                        >
                            {/* Utiliser le composant StatusElement pour l'affichage */}
                            <OrderStatusElement status={nextStatus} isSelected={selected==nextStatus} />
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 italic">{t('order.noNextStatus')}</p>
            )}

            {mutation.isError && (
                <p className="text-red-600 text-sm mt-4 text-center">
                    {t('order.updateFailed')}: {mutation.error.message || t('error_occurred')}
                </p>
            )}
           {
            selected &&  <button
                onClick={()=> selected && handleUpdate(selected)}
                disabled={mutation.isPending} // Désactiver aussi pendant chargement
                className="mt-6 w-full gap-4 text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white hover:bg-bleu-600 bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {
                    mutation.isPending && <SpinnerIcon/>
                }
                {mutation.isPending ? t('common.saving') : t('common.save')}
            </button>
           }
            <button
                onClick={onClose}
                disabled={mutation.isPending} // Désactiver aussi pendant chargement
                className="mt-2 w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {t('common.cancel')}
            </button>
        </div>
    );
}
