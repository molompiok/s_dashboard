import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../api/stores/AuthStore';
import { useListUserDevices, useRemoveDevice } from '../../api/ReactSublymusApi';
import { Bell, BellOff, CheckCircle, AlertTriangle, XCircle, Loader2, Smartphone, Monitor, Tablet, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useChildViewer } from '../../Components/ChildViewer/useChildViewer';
import { notificationManager } from '../../api/stores/NotificationManager';
import { ChildViewer } from '../../Components/ChildViewer/ChildViewer';
import { ConfirmDelete } from '../../Components/Confirm/ConfirmDelete';
import { Button } from '../../Components/Button/Button';
import { usePageContext } from '../../renderer/usePageContext';

// Sous-composant pour une étape de la vérification
const StatusStep: React.FC<{
  title: string;
  status: 'loading' | 'success' | 'warning' | 'error';
  description: string;
  action?: React.ReactNode;
}> = ({ title, status, description, action }) => {
  const statusConfig = {
    loading: { icon: <Loader2 className="animate-spin text-slate-400" />, color: 'text-slate-500 dark:text-slate-400' },
    success: { icon: <CheckCircle className="text-emerald-500" />, color: 'text-emerald-600 dark:text-emerald-400' },
    warning: { icon: <AlertTriangle className="text-amber-500" />, color: 'text-amber-600 dark:text-amber-400' },
    error: { icon: <XCircle className="text-red-500" />, color: 'text-red-600 dark:text-red-400' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className={`flex items-start p-4 border-l-4 rounded-r-md ${currentStatus.color.replace('text-', 'bg-').replace('600', '50').replace('500','50')} ${currentStatus.color.replace('text-', 'border-')}`}>
      <div className={`flex-shrink-0 w-6 h-6 ${currentStatus.color}`}>{currentStatus.icon}</div>
      <div className="ml-4 flex-grow">
        <h4 className={`font-semibold ${currentStatus.color}`}>{title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
};

// Icône de l'appareil
const DeviceIcon: React.FC<{ type?: string | null }> = ({ type }) => {
    switch(type) {
        case 'mobile': return <Smartphone size={24} className="text-slate-500 dark:text-slate-400" />;
        case 'tablet': return <Tablet size={24} className="text-slate-500 dark:text-slate-400" />;
        default: return <Monitor size={24} className="text-slate-500 dark:text-slate-400" />;
    }
};

const NotificationStatusDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { openChild } = useChildViewer();
    const {VITE_PUBLIC_VAPID_KEY} = usePageContext()
  // États locaux pour suivre le statut de chaque étape
  const [swStatus, setSwStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'subscribed' | 'unsubscribed' | 'error'>('loading');

  // Hook pour lister les appareils enregistrés sur le serveur
  const { data: serverDevices, isLoading: isLoadingDevices, refetch: refetchDevices } = useListUserDevices({ enabled: !!token });
  const removeDeviceMutation = useRemoveDevice();

  const checkAllStatuses = useCallback(async () => {
    setSwStatus('loading');
    setPermissionStatus(await notificationManager.getPermissionState());
    setSubscriptionStatus('loading');
    
    const isSwReady = await notificationManager.isPushManagerSupported();
    setSwStatus(isSwReady ? 'success' : 'error');

    if (isSwReady) {
      const sub = await notificationManager.getCurrentSubscription();
      setSubscriptionStatus(sub ? 'subscribed' : 'unsubscribed');
    } else {
      setSubscriptionStatus('error');
    }
  }, []);

  useEffect(() => {
    notificationManager.initialize().then(() => {
      checkAllStatuses();
    });
  }, [checkAllStatuses]);

  const handleEnableNotifications = async () => {
    setSubscriptionStatus('loading');
    const success = await notificationManager.subscribeAndSync(VITE_PUBLIC_VAPID_KEY);
    if (success) {
      toast.success(t('notifications.subscriptionSuccess', 'Notifications activées avec succès !'));
      await refetchDevices(); // Rafraîchir la liste des appareils
    } else {
      toast.error(t('notifications.subscriptionFailed', 'Impossible d\'activer les notifications.'));
    }
    checkAllStatuses();
  };
  
  const handleDisableNotifications = async () => {
    setSubscriptionStatus('loading');
    const success = await notificationManager.unsubscribeDevice();
    if (success) {
      toast.success(t('notifications.unsubscriptionSuccess', 'Notifications désactivées pour cet appareil.'));
      await refetchDevices();
    } else {
      toast.error(t('notifications.unsubscriptionFailed', 'Erreur lors de la désactivation.'));
    }
    checkAllStatuses();
  };
  
  const handleRemoveDevice = (deviceId: string) => {
    removeDeviceMutation.mutate({ deviceId }, {
        onSuccess: () => toast.success(t('notifications.deviceRemovedSuccess', 'Appareil supprimé.')),
        onError: (err) => toast.error(err.message || t('notifications.deviceRemoveFailed', 'Erreur de suppression.')),
    });
  }

  const confirmRemoveDevice = (deviceId: string, browserName: string) => {
    openChild(
      <ChildViewer>
        <ConfirmDelete
          title={t('notifications.confirmRemoveDeviceTitle', 'Supprimer cet appareil ?')}
          description={t('notifications.confirmRemoveDeviceDesc', 'Voulez-vous vraiment supprimer "{{name}}" de votre liste d\'appareils autorisés ? Vous ne recevrez plus de notifications sur ce navigateur.', { name: browserName })}
          onCancel={() => openChild(null)}
          onDelete={() => {
            handleRemoveDevice(deviceId);
            openChild(null);
          }}
          isLoading={removeDeviceMutation.isPending}
        />
      </ChildViewer>,
      { background: '#00000080', blur: 3 }
    );
  };

  const permissionStepAction = () => {
    if (permissionStatus === 'default') {
      return <Button size="sm" onClick={handleEnableNotifications}>{t('notifications.allow', 'Autoriser les notifications')}</Button>;
    }
    if (permissionStatus === 'denied') {
      return <p className="text-xs text-red-700 dark:text-red-400 mt-2">{t('notifications.permissionDeniedHelp', 'Vous devez autoriser les notifications dans les paramètres de votre navigateur.')}</p>;
    }
    return null;
  };
  
  const subscriptionStepAction = () => {
    if (swStatus !== 'success' || permissionStatus !== 'granted') return null;
    if (subscriptionStatus === 'unsubscribed') {
      return <Button size="sm" onClick={handleEnableNotifications}>{t('notifications.enableOnDevice', 'Activer sur cet appareil')}</Button>;
    }
    if (subscriptionStatus === 'subscribed') {
      return <Button size="sm" variant="danger" onClick={handleDisableNotifications}>{t('notifications.disableOnDevice', 'Désactiver sur cet appareil')}</Button>;
    }
    return null;
  }

  return (
    <div className="space-y-4">
      <StatusStep
        title={t('notifications.step1.title', 'Compatibilité du Navigateur')}
        status={swStatus}
        description={
          swStatus === 'success' ? t('notifications.step1.desc.success', 'Votre navigateur est compatible avec les notifications push.') :
          swStatus === 'error' ? t('notifications.step1.desc.error', 'Votre navigateur ne supporte pas les notifications ou le Service Worker n\'a pas pu démarrer.') :
          t('notifications.step1.desc.loading', 'Vérification de la compatibilité...')
        }
      />
      <StatusStep
        title={t('notifications.step2.title', 'Permission de Notification')}
        status={
          permissionStatus === 'granted' ? 'success' :
          permissionStatus === 'denied' ? 'error' : 'warning'
        }
        description={
          permissionStatus === 'granted' ? t('notifications.step2.desc.granted', 'Vous avez autorisé les notifications.') :
          permissionStatus === 'denied' ? t('notifications.step2.desc.denied', 'Vous avez bloqué les notifications pour ce site.') :
          t('notifications.step2.desc.default', 'L\'autorisation est requise pour recevoir des notifications.')
        }
        action={permissionStepAction()}
      />
       <StatusStep
        title={t('notifications.step3.title', 'Abonnement de l\'Appareil')}
        status={
          subscriptionStatus === 'subscribed' ? 'success' :
          swStatus !== 'success' || permissionStatus !== 'granted' ? 'warning' :
          subscriptionStatus === 'unsubscribed' ? 'warning' :
          subscriptionStatus === 'loading' ? 'loading' : 'error'
        }
        description={
          subscriptionStatus === 'subscribed' ? t('notifications.step3.desc.subscribed', 'Cet appareil est abonné et prêt à recevoir des notifications.') :
          swStatus !== 'success' || permissionStatus !== 'granted' ? t('notifications.step3.desc.blocked', 'L\'abonnement est impossible tant que les étapes précédentes ne sont pas validées.') :
          subscriptionStatus === 'unsubscribed' ? t('notifications.step3.desc.unsubscribed', 'Cet appareil n\'est pas encore abonné aux notifications.') :
          t('notifications.step3.desc.loading', 'Vérification de l\'abonnement...')
        }
        action={subscriptionStepAction()}
      />

      {token && (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">{t('notifications.registeredDevicesTitle', 'Vos Appareils Enregistrés')}</h3>
            {isLoadingDevices && <Loader2 className="animate-spin text-slate-500" />}
            {!isLoadingDevices && serverDevices && serverDevices.length > 0 && (
                <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg divide-y dark:divide-slate-700">
                    {serverDevices.map(device => (
                        <div key={device.id} className="p-3 sm:p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <DeviceIcon type={device.device_type} />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{device.browser_name || 'Navigateur'} sur {device.os_name || 'OS inconnu'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('notifications.lastUsed', 'Dernière utilisation : {{date, relativetime}}', { date: new Date(device.last_used_at || device.created_at) })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                               {device.is_active ? 
                                <Bell size={18} className="text-emerald-500" /> :
                                <BellOff size={18} className="text-slate-400" />
                               }
                               <Button variant="ghost" onClick={() => confirmRemoveDevice(device.id, `${device.browser_name} sur ${device.os_name}`)} disabled={removeDeviceMutation.isPending && removeDeviceMutation.variables?.deviceId === device.id}>
                                    {removeDeviceMutation.isPending && removeDeviceMutation.variables?.deviceId === device.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} className="text-slate-500 hover:text-red-500"/>}
                               </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!isLoadingDevices && (!serverDevices || serverDevices.length === 0) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('notifications.noDevicesRegistered', 'Aucun appareil n\'est enregistré sur votre compte.')}</p>
            )}
        </div>
      )}
    </div>
  );
};

export default NotificationStatusDashboard;