// pages/commands/@id/+Page.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContext } from '../../../renderer/usePageContext';
import { DateTime } from 'luxon';
import { QRCodeCanvas } from 'qrcode.react';
import IMask from "imask";
import { FaTruck } from 'react-icons/fa';
import { IoCheckmarkCircle, IoChevronForward, IoCloudDownloadOutline, IoCopyOutline, IoQrCode, IoCall, IoStorefront, IoMail, IoLocationSharp, IoPhonePortraitOutline, IoCard, IoCash, IoPricetag, IoCloseOutline, IoCheckmark, IoWarningOutline } from 'react-icons/io5';

import { ClientStatusColor, OrderStatus, PaymentMethod } from '../../../Components/Utils/constants';
import { getStatusClasses, OrderStatusElement, statusColors } from '../../../Components/Status/Satus';
import { BreadcrumbItem, Topbar } from '../../../Components/TopBar/TopBar';
import { copyToClipboard, FeatureType, getId, limit } from '../../../Components/Utils/functions';
import { CommandInterface, CommandItemInterface, EventStatus, ProductInterface, UserInterface, ValueInterface } from '../../../api/Interfaces/Interfaces';
import { useGetOrderDetails, useUpdateOrderStatus, queryClient } from '../../../api/ReactSublymusApi';
import { useGlobalStore, getTransmit } from '../../../api/stores/StoreStore';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { Confirm } from '../../../Components/Confirm/Confirm';
import { ConfirmDelete } from '../../../Components/Confirm/ConfirmDelete';
import { markdownToPlainText } from '../../../Components/MarkdownViewer/MarkdownViewer';
import { getMedia } from '../../../Components/Utils/StringFormater';
import { useWindowSize } from '../../../Hooks/useWindowSize';
import { useChildViewer } from '../../../Components/ChildViewer/useChildViewer';
import { showErrorToast, showToast } from '../../../Components/Utils/toastNotifications';
import { OrderDetailSkeleton } from '../../../Components/Skeletons/allsKeletons';
import { PageNotFound } from '../../../Components/PageNotFound/PageNotFound';
import { SpinnerIcon } from '../../../Components/Confirm/Spinner';
import { Page as Receipt } from './receipt/+Page';
import { Data } from '../../../renderer/AppStore/Data';
import logger from '../../../api/Logger';
import { navigate } from 'vike/client/router';
import { Mail, Phone } from 'lucide-react';
import { StateDisplay } from '../../../Components/StateDisplay/StateDisplay';
import { NotificationSubscriptionPrompt } from '../../../api/UI/NotificationSubscriptionPrompt';
import { notificationManager } from '../../../api/stores/NotificationManager';

// Transitions de statut autorisées
const allowedTransitionsClient: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED, OrderStatus.FAILED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELED, OrderStatus.FAILED],
    [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.PICKED_UP, OrderStatus.NOT_PICKED_UP],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.NOT_DELIVERED, OrderStatus.FAILED],
    [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
    [OrderStatus.PICKED_UP]: [OrderStatus.RETURNED],
    [OrderStatus.NOT_DELIVERED]: [OrderStatus.SHIPPED, OrderStatus.RETURNED, OrderStatus.CANCELED],
    [OrderStatus.NOT_PICKED_UP]: [OrderStatus.CANCELED],
};

export { Page, CommandProduct, CommandUser, CommandStatusHistory, CommandTop, PaymentMethodElement };

// --- Composant Principal ---
function Page() {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const size = useWindowSize();
    const { routeParams } = usePageContext();
    const command_id = routeParams?.['id'];

    const { data: command, isLoading, isError, error: apiError, refetch } = useGetOrderDetails(
        { order_id: command_id }, { enabled: !!currentStore && !!command_id }
    );
    const { openChild } = useChildViewer();

    const low = useMemo(() => size.width < 380, [size.width]);

    useEffect(() => {
        if (!currentStore?.api_url || !command_id) return;
        const transmit = getTransmit(currentStore.api_url);
        const channel = `store/${currentStore.api_url}/update_command`;
        const subscription = transmit?.subscription(channel);
        async function subscribe() {
            if (!subscription) return;
            try {
                await subscription.create();
                subscription.onMessage<{ id: string }>((data) => {
                    if (data.id === command_id) {
                        logger.info(`SSE update for order ${command_id}. Refetching...`);
                        refetch();
                    }
                });
            } catch (err) { logger.error({ err }, "SSE subscribe failed"); }
        }
        subscribe();
        return () => { subscription?.delete(); };
    }, [currentStore, command_id, refetch]);
    
    // Ouvre le prompt automatiquement après un court délai
    useEffect(() => {
        const orderNotification = localStorage.getItem('notification:order');
        if(orderNotification){
            return
        }
        const timer = setTimeout(() => {
            openChild(
                <ChildViewer>
                    <NotificationSubscriptionPrompt
                        contextName="order_update" 
                        contextId={command_id}
                        closePrompt={() => openChild(null)}
                        onSuccessAndClose={() => {
                            console.log("Abonnement réussi et modal fermé !");
                            localStorage.setItem('notification:order','true');
                            showToast('Notification Activé');
                        }}
                    />
                </ChildViewer>,
                { background: 'rgba(0,0,0,0.5)', blur: 2 }
            );
        }, 2000); // Ouvre après 2 secondes

        return () => clearTimeout(timer);
    }, [openChild, command_id]);

    const handleOpenStatusUpdate = () => {
        if (!command?.id || !command?.status) return;
        openChild(
            <ChildViewer title={t('order.updateStatusTitle')}><StatusUpdatePopup
                isDelivery={!!command.with_delivery}
                currentStatus={command.status as OrderStatus}
                orderId={command.id}
                onClose={() => openChild(null)}
            /></ChildViewer>, { background: 'rgba(30, 41, 59, 0.7)', blur: 4 }
        );
    };

    const commandRef = command?.reference || command?.id?.substring(0, 8);
    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
        { name: t('navigation.home'), url: '/' },
        { name: t('navigation.orders'), url: '/commands' },
        { name: commandRef ? `#${commandRef}` : t('common.loading') },
    ], [t, commandRef]);

    // 1. État de Chargement Initial
    if (isLoading || !currentStore) {
        return <OrderDetailSkeleton />;
    }

    // 2. État d'Erreur (404, 403, 500, etc.)
    if (isError) {
        const isNotFound = apiError.status === 404;
        const title = isNotFound ? t('order.notFoundTitle') : t('common.error.title');
        const description = isNotFound ? t('order.notFoundDesc') : (apiError.message || t('common.error.genericDesc'));

        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back breadcrumbs={breadcrumbs} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay
                        variant="danger"
                        icon={IoWarningOutline}
                        title={title}
                        description={description}
                    >
                        <a href="/commands" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            {t('order.backToList')}
                        </a>
                    </StateDisplay>
                </main>
            </div>
        );
    }

    // 3. Cas où la requête réussit mais ne renvoie rien (sécurité)
    if (!command) {
        return (
            <div className="w-full min-h-screen flex flex-col">
                <Topbar back breadcrumbs={breadcrumbs} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <StateDisplay
                        variant="warning"
                        icon={IoWarningOutline}
                        title={t('order.notFoundTitle')}
                        description={t('order.notFoundDesc')}
                    >
                        <a href="/commands" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                            {t('order.backToList')}
                        </a>
                    </StateDisplay>
                </main>
            </div>
        );
    }


    return (
        <div className="w-full pb-48 flex flex-col min-h-screen">
            <Topbar back breadcrumbs={breadcrumbs} />
            <main className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
                <CommandTop command={command} />

                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('order.customerInfoTitle')}</h2>
                {command.user && <CommandUser command={command} user={command.user} />}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mt-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {t('order.productListTitle')}
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-2">({t('dashboard.itemCount', { count: command.items?.length || 0 })})</span>
                    </h2>
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {t('order.totalLabel')}: {Number(command.total_price || 0).toLocaleString()} {command.currency}
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    {command.items?.map((item) => <CommandProduct key={item.id} item={item} />)}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('order.statusEvolutionTitle')}</h2>
                    {(allowedTransitionsClient[command.status as OrderStatus]?.length || 0) > 0 &&
                        <button onClick={handleOpenStatusUpdate} className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 cursor-pointer px-3 py-1 rounded-lg border border-teal-500/30 hover:bg-teal-500/10 transition-colors">
                            {t('order.updateStatusButton')}
                        </button>}
                </div>
                <CommandStatusHistory events={command.events_status || []} low={low} />
            </main>
        </div>
    );
}

// --- SOUS-COMPOSANTS ---

function CommandTop({ command, forRecipet }: { forRecipet?: boolean, command?: Partial<CommandInterface> }) {
    const { t } = useTranslation();
    const { openChild } = useChildViewer();
    const [copiedId, setCopiedId] = useState(false);

    const commandId = command?.id ?? '';
    const commandIdShort = getId(commandId);
    const qrCodeValue = commandId ? `${window.location.origin}/commands/${commandId}` : 'no-id';

    const handleCopy = (text: string) => copyToClipboard(text, () => {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    });

    return (
        <div className="w-full flex flex-wrap items-start gap-x-6 gap-y-4 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10">
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex flex-col">
                    <div className="p-1 bg-white rounded-md border border-gray-200 dark:border-gray-700">
                        <QRCodeCanvas value={qrCodeValue} size={80} bgColor="#ffffff" fgColor="#111827" level="Q" />
                    </div>
                    {!forRecipet && <button onClick={() => openChild(<ChildViewer><Receipt command={command} /></ChildViewer>)} className="flex items-center justify-center gap-2 mt-2 py-1.5 rounded-md text-sm text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 transition-colors"><IoCloudDownloadOutline />{t('receipt.name')}</button>}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('order.commandIdLabel')}</span>
                    <div className="flex items-center gap-1.5 group cursor-pointer" title={t('common.copy')} onClick={() => handleCopy(commandIdShort)}>
                        <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">{commandIdShort}</span>
                        <IoCopyOutline className={`w-4 h-4 transition-all ${copiedId ? 'text-green-500 scale-110' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                    {command?.reference && <div className="mt-1"><span className="text-xs text-gray-500 dark:text-gray-400">{t('order.referenceLabel')}</span><span className="block text-sm text-gray-700 dark:text-gray-300">{command.reference}</span></div>}
                </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><_Icon icon={command?.with_delivery ? FaTruck : IoStorefront} />{t(command?.with_delivery ? 'order.deliveryMode.home' : 'order.deliveryMode.pickup')}<OrderStatusElement status={command?.status as any} /></div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><PaymentMethodElement paymentMethod={command?.payment_method as any} /><OrderStatusElement status={command?.payment_status as any} /></div>
        </div>
    );
}

const _Icon = ({ icon: Icon }: { icon: React.ElementType }) => <Icon className='w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0' />;

function PaymentMethodElement({ paymentMethod }: { paymentMethod?: PaymentMethod }) {
    const { t } = useTranslation();
    let Icon = IoCard, textKey = 'order.paymentMethod.card';
    if (paymentMethod === PaymentMethod.CASH) { Icon = IoCash; textKey = 'order.paymentMethod.cash'; }
    if (paymentMethod === PaymentMethod.MOBILE_MONEY) { Icon = IoPhonePortraitOutline; textKey = 'order.paymentMethod.mobile'; }
    return <><_Icon icon={Icon} /> {t(textKey)}</>;
}

function CommandUser({ user, command }: { command: Partial<CommandInterface>, user: Partial<UserInterface> }) {
    const { t, i18n } = useTranslation();
    const maskedPhone = command.phone_number && command.formatted_phone_number ? IMask.pipe(command.phone_number, { mask: command.formatted_phone_number }) : command.phone_number;
    const mapQuery = command.delivery_latitude && command.delivery_longitude ? `${command.delivery_latitude},${command.delivery_longitude}` : command.delivery_address;
    const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : undefined;
    const telLink = command.phone_number ? `tel:${command.phone_number}` : undefined;
    const mailLink = user.email ? `mailto:${user.email}?subject=${t('order.emailSubject', { ref: command.reference ?? command.id })}` : undefined;

    // Statut client
    const statusColor = (ClientStatusColor as any)[user.status || 'CLIENT'] ?? '#6B7280'; // Fallback gris


    return (
        <div className="user-info flex flex-col items-center mob:items-start  mob:flex-row gap-1.5 flex-grow min-w-0 text-center md:text-left">
            <div className="relative w-24 h-24 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold text-4xl flex items-center justify-center shrink-0 border-4 border-white/80 dark:border-gray-800/50 shadow"
                style={{ background: getMedia({ isBackground: true, source: user.photo?.[0], from: 'api' }) }}>
                {!user.photo?.[0] && (user.full_name?.substring(0, 2).toUpperCase() || '?')}
                <span
                    className="absolute bottom-1 right-1 block h-4 w-4  rounded-full ring-2 ring-white"
                    style={{ backgroundColor: statusColor }} // Appliquer couleur statut
                    title={t(`clientStatus.${user.status?.toLowerCase() || 'client'}`, user.status || 'NEW')} // 🌍 i18n
                ></span>
            </div>
            <div className="flex flex-col gap-3 mob:items-start  flex-grow min-w-0 text-center sm:text-left">

                <h2 className="text-xl font-semibold dark:text-gray-200 text-gray-900 truncate">{user.full_name}</h2>
                {/* Email */}
                {user.email && (
                    <a href={`mailto:${user.email}`} className="flex items-center  gap-2 text-sm dark:text-gray-300 text-gray-600 hover:text-blue-600 w-fit md:mx-0">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                    </a>
                )}
                {/* Téléphone */}
                {maskedPhone && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center md:justify-start gap-1 sm:gap-4">
                        <a href={`tel:${maskedPhone}`} className="flex items-center justify-center md:justify-start gap-2 text-sm  dark:text-gray-300 text-gray-600 hover:text-blue-600">
                            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-300 " />
                            <span className="truncate">{maskedPhone}</span>
                        </a>
                        {/* Icônes Actions Téléphone */}
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1 sm:mt-0">
                            {/* Ajouter les liens comme dans CommandUser */}
                            <a href={`tel:${maskedPhone}`} title={t('order.callAction')} className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/telephone.png'} alt="Call" className="w-6 h-6" /></a>
                            <a href={`https://wa.me/${maskedPhone}`} title={t('order.whatsappAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/social.png'} alt="WhatsApp" className="w-6 h-6" /></a>
                            <a href={`https://t.me/${maskedPhone}`} title={t('order.telegramAction')} target="_blank" rel="noreferrer" className="p-1 rounded-full hover:bg-gray-200"><img src={'/res/social/telegram.png'} alt="Telegram" className="w-6 h-6" /></a>
                        </div>
                    </div>
                )}
                {/* Infos Pied de Carte */}

            </div>
            <div className="user-card-foot flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs  dark:text-gray-300 text-gray-500 mt-2">
                <p><span>{t('clientDetail.statusLabel')}:</span> <strong className='px-2 py-0.5 rounded-full text-xs' style={{ backgroundColor: `${statusColor}33`, color: statusColor }}>{t(`clientStatus.${user.status?.toLowerCase() || 'client'}`, user.status || 'NEW')}</strong></p>
                {/* <p><span>Rôles:</span> {user.roles?.map(r => r.name).join(', ') || 'Aucun'}</p> */}
                <p><span>{t('clientDetail.memberSinceLabel')}:</span> {DateTime.fromISO(user.created_at || '').setLocale(i18n.language).toLocaleString(DateTime.DATE_MED)}</p>
            </div>
        </div>
    );
}

function CommandProduct({ item, openProduct = true }: { openProduct?: boolean, item: CommandItemInterface }) {
    const { t } = useTranslation();
    const imageUrl = item.product?.features?.find(f => f.is_default)?.values?.[0]?.views?.[0] || item.product?.features?.[0]?.values?.[0]?.views?.[0];

    return (
        <div className={`relative p-3 pb-8 rounded-xl flex flex-col sm:flex-row items-start gap-3 shadow-sm border ${item.status === OrderStatus.RETURNED ? 'bg-red-500/5 border-red-500/10' : 'bg-white/80 dark:bg-white/5 border-gray-200/80 dark:border-white/10'}`}>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg shrink-0 bg-cover bg-center bg-gray-200 dark:bg-gray-700" style={{ background: getMedia({ isBackground: true, source: imageUrl, from: 'api' }) }}></div>
            <div className="flex-grow flex flex-col gap-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 truncate">{item.product?.name || t('common.unknownProduct')}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{markdownToPlainText(item.product?.description || '')}</p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end shrink-0 mt-1 sm:mt-0">
                        <h4 className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{item.quantity} x {Number(item.price_unit || 0).toLocaleString()} {item.currency}</h4>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap flex items-center gap-1"><IoPricetag className="w-3 h-3 text-gray-400 dark:text-gray-500" />{(item.quantity * (item.price_unit || 0)).toLocaleString()} {item.currency}</h3>
                    </div>
                </div>
                {item.bind_name && typeof item.bind_name === 'object' && Object.keys(item.bind_name).length > 0 && <ul className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                    {Object.entries(item.bind_name).map(([key, value]) => {
                        const [featureName, featureType] = key.split(':'); const valueText = typeof value === 'string' ? value : (value as ValueInterface)?.text; const valueKey = typeof value === 'string' ? null : (value as ValueInterface)?.key;
                        if (!featureName || !valueText) return null;
                        return <li key={key} className="flex items-center border border-gray-200 dark:border-gray-700 rounded text-xs leading-none max-w-full"><span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-1 rounded-l">{limit(featureName, 12)}</span>{valueKey && featureType === FeatureType.COLOR && <span className="w-3 h-3 rounded-full mx-1.5 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: valueKey }}></span>}<span className="text-gray-800 dark:text-gray-200 px-1.5 py-1 truncate rounded-r">{limit(valueText, 16)}</span></li>;
                    })}
                </ul>}
            </div>
            {openProduct && <a onClick={() => navigate(`/products/${item.product_id}`)} className="absolute bottom-1 right-1 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-teal-600 dark:text-teal-400 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer hover:shadow-md flex items-center gap-1 transition-all"><IoChevronForward className="w-3 h-3" />{t('product.seeProduct')}</a>}
        </div>
    );
}

function CommandStatusHistory({ events, low }: { events: EventStatus[], low: boolean }) {
    const { t, i18n } = useTranslation();
    const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(a.change_at).getTime() - new Date(b.change_at).getTime()), [events]);

    return (
        <div className="flex flex-col">
            {sortedEvents.map((k, i, arr) => {
                const eventDate = DateTime.fromISO(k.change_at); const currentLocale = i18n.language;
                const formattedDate = eventDate.isValid ? eventDate.setLocale(currentLocale).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY) : 'N/A';
                const formattedTime = eventDate.isValid ? eventDate.setLocale(currentLocale).toLocaleString(DateTime.TIME_SIMPLE) : '';
                const classes = getStatusClasses(k.status)
                return <div key={i} className="flex gap-3 sm:gap-4"><div className="hidden sm:flex flex-col items-end w-32 text-right shrink-0 pt-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formattedDate}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span>
                </div><div className="flex flex-col items-center self-stretch">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs z-10 shadow  ${classes.bg}`} ><IoCheckmark className={`w-5 h-5 ${classes.text}`} /></span>
                        {i < arr.length - 1 && <div className="w-0.5 flex-grow bg-gray-300 dark:bg-gray-600 my-1"></div>}
                    </div><div className="flex-grow pb-6"><div className="flex justify-between items-center mb-1 flex-wrap gap-x-2">
                        <OrderStatusElement status={k.status as any} />
                        {low && <div className="text-right"><span className="block text-xs font-medium text-gray-700 dark:text-gray-300">{formattedDate}</span><span className="block text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span></div>}
                    </div>{k.message && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{k.message}</p>}
                        {k.user_provide_change_id && k.user_role && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('order.statusChangedBy', { role: t(`roles.${k.user_role}`, k.user_role) })}</p>}</div></div>;
            })}
        </div>
    );
}

function StatusUpdatePopup({ currentStatus, orderId, onClose, isDelivery }: { currentStatus: OrderStatus, orderId: string, onClose: () => void, isDelivery: boolean }) {
    const { t } = useTranslation();
    const mutation = useUpdateOrderStatus();
    const [selected, setSelected] = useState<OrderStatus | undefined>();
    const validNextStatuses = useMemo(() => {
        const next = allowedTransitionsClient[currentStatus] || [];
        if (currentStatus === OrderStatus.PROCESSING) return next.filter(s => isDelivery ? s !== OrderStatus.READY_FOR_PICKUP : s !== OrderStatus.SHIPPED);
        return next;
    }, [currentStatus, isDelivery]);

    const handleUpdate = () => {
        if (selected) mutation.mutate({ user_order_id: orderId, status: selected }, {
            onSuccess: () => { showToast(t('order.updateSuccess')); onClose(); },
            onError: (err) => showErrorToast(err),
        })
    };

    return (
        <div className="p-4 sm:p-6 flex flex-col gap-5 text-gray-800 dark:text-gray-100">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('order.currentStatusLabel')}: <OrderStatusElement status={currentStatus} /></p>
            {validNextStatuses.length > 0 ? <div className="flex flex-wrap gap-3 items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">{t('order.nextStatus')}:</p>
                <div className='w-full'></div>
                {validNextStatuses.map((nextStatus) => <button key={nextStatus} type="button" onClick={() => setSelected(nextStatus)} disabled={mutation.isPending} className="disabled:opacity-50 cursor-pointer disabled:cursor-wait transition hover:scale-105"><OrderStatusElement status={nextStatus} isSelected={selected === nextStatus} /></button>)}
            </div> : <p className="text-center text-gray-500 dark:text-gray-400 italic">{t('order.noNextStatus')}</p>}
            {selected && <button onClick={handleUpdate} disabled={mutation.isPending} className="mt-6 w-full gap-4 flex items-center justify-center py-2 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors">
                {mutation.isPending ? <SpinnerIcon /> : t('common.save')}
            </button>}
            <button onClick={onClose} disabled={mutation.isPending} className="w-full text-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors">{t('common.cancel')}</button>
        </div>
    );
}