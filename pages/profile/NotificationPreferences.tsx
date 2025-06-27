// themes/mono/components/Profile/NotificationPreferences.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../api/stores/AuthStore';
import { BellRing, BellOff, Trash2, Loader2, AlertTriangle, CheckCircle, Smartphone, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Importer les hooks de mutation pour les actions sur les devices
import {
  useListUserDevices,
  useUpdateDeviceStatus,
  useRemoveDevice,
  // Ajoute ici les hooks pour les contextes si tu les gères depuis cette UI
} from '../../api/ReactSublymusApi';
import { notificationManager, UserBrowserSubscriptionInterface } from '../../api/stores/NotificationManager';
import { Button } from '../../Components/Button/Button';
import { usePageContext } from '../../renderer/usePageContext';

const NotificationPreferences: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const { VITE_PUBLIC_VAPID_KEY } = usePageContext()
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribedToServer, setIsSubscribedToServer] = useState(false); // Si l'appareil actuel est enregistré sur le serveur
  const [isProcessing, setIsProcessing] = useState(false); // Pour les actions globales (subscribe/unsubscribe)

  // Hooks pour gérer les appareils listés
  const { data: devicesResponse, isLoading: isLoadingDevices, refetch: refetchDevices, error: devicesError } =
    useListUserDevices({ enabled: !!token });

  const updateDeviceStatusMutation = useUpdateDeviceStatus();
  const removeDeviceMutation = useRemoveDevice();

  const checkCurrentSubscription = useCallback(async () => {
    if (!token) return;
    const currentPushSubscription = await notificationManager.getCurrentSubscription();
    if (currentPushSubscription && devicesResponse?.find(d => d.endpoint === currentPushSubscription.endpoint && d.is_active)) {
      setIsSubscribedToServer(true);
    } else {
      setIsSubscribedToServer(false);
    }
  }, [token, devicesResponse]);

  useEffect(() => {
    notificationManager.getPermissionState().then(setPermission);
    checkCurrentSubscription();
  }, [checkCurrentSubscription]);

  useEffect(() => { // Réévaluer quand la liste des devices du serveur change
    checkCurrentSubscription();
  }, [devicesResponse, checkCurrentSubscription]);


  const handleRequestPermissionAndSubscribe = async () => {
    setIsProcessing(true);
    const perm = await notificationManager.requestPermission();
    setPermission(perm);
    if (perm === 'granted') {
      const success = await notificationManager.subscribeAndSync(VITE_PUBLIC_VAPID_KEY);
      if (success) {
        setIsSubscribedToServer(true);
        refetchDevices(); // Rafraîchir la liste des appareils
        // Afficher un toast de succès
      } else {
        // Afficher un toast d'erreur
      }
    }
    setIsProcessing(false);
  };

  const handleUnsubscribeCurrentDevice = async () => {
    setIsProcessing(true);
    // D'abord, trouver l'ID de l'appareil actuel sur le serveur
    const currentPushSub = await notificationManager.getCurrentSubscription();
    if (currentPushSub && devicesResponse) {
      const currentDeviceOnServer = devicesResponse.find(d => d.endpoint === currentPushSub.endpoint);
      if (currentDeviceOnServer) {
        await removeDeviceMutation.mutateAsync({ deviceId: currentDeviceOnServer.id });
        // Ensuite, se désabonner localement du PushManager
        await notificationManager.unsubscribeDevice();
        setIsSubscribedToServer(false);
        refetchDevices();
      } else {
        // Juste désabonner localement si non trouvé sur serveur (devrait pas arriver si isSubscribedToServer est vrai)
        await notificationManager.unsubscribeDevice();
        setIsSubscribedToServer(false);
      }
    } else {
      // Juste désabonner localement si pas d'infos serveur ou de souscription locale
      await notificationManager.unsubscribeDevice();
      setIsSubscribedToServer(false);
    }
    setIsProcessing(false);
  };

  const handleToggleDeviceStatus = async (deviceId: string, currentStatus: boolean) => {
    await updateDeviceStatusMutation.mutateAsync({ deviceId, data: { is_active: !currentStatus } }, {
      onSuccess: () => refetchDevices()
    });
  };

  const handleRemoveDevice = async (deviceId: string) => {
    // Confirmer avant suppression
    if (window.confirm(t('notifications.confirmRemoveDevice', 'Voulez-vous vraiment supprimer cet appareil de vos notifications ?'))) {
      await removeDeviceMutation.mutateAsync({ deviceId }, {
        onSuccess: () => refetchDevices()
      });
    }
  };


  if (!token) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('notifications.loginToManage', 'Connectez-vous pour gérer vos préférences de notification.')}
        </p>
      </div>
    );
  }

  const renderDeviceList = () => {
    if (isLoadingDevices) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
    if (devicesError) return <div className="p-4 text-red-600 dark:text-red-400"><AlertTriangle className="inline mr-2" />{t('notifications.errorListDevices', 'Erreur de chargement des appareils.')}</div>;
    if (!devicesResponse || devicesResponse.length === 0) {
      return <p className="text-sm text-slate-500 dark:text-slate-400 italic p-4">{t('notifications.noDevicesRegistered', 'Aucun appareil enregistré pour les notifications.')}</p>;
    }

    return (
      <div className="space-y-3 mt-4">
        {devicesResponse.map((device: UserBrowserSubscriptionInterface) => (
          <div key={device.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
            <div className="flex items-center">
              <Smartphone size={20} className="mr-3 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {device.browser_name || t('notifications.unknownBrowser', 'Navigateur inconnu')}
                  {device.os_name && ` (${device.os_name})`}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('notifications.lastUsed', 'Dernière utilisation')}: {device.last_used_at ? new Date(device.last_used_at).toLocaleDateString() : t('common.never', 'Jamais')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={device.is_active ? "ghost" : "primary"}
                onClick={() => handleToggleDeviceStatus(device.id, device.is_active)}
                // isLoading={updateDeviceStatusMutation.isPending && updateDeviceStatusMutation.variables?.deviceId === device.id}
                className={device.is_active ? "border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-300 dark:hover:bg-amber-700/50" : ""}
              >
                {device.is_active
                  ? <><BellOff size={14} className="mr-1 sm:mr-2" />{t('common.disable', 'Désactiver')}</>
                  : <><BellRing size={14} className="mr-1 sm:mr-2" />{t('common.enable', 'Activer')}</>
                }
              </Button>
              <Button
                size='sm'
                variant="ghost"
                onClick={() => handleRemoveDevice(device.id)}
                // isLoading={removeDeviceMutation.isPending && removeDeviceMutation.variables?.deviceId === device.id}
                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-700/50"
                title={t('common.delete', 'Supprimer')}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">{t('notifications.currentDeviceTitle', 'Notifications pour cet appareil')}</h3>
      {permission === 'denied' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300 rounded-md text-sm">
          <AlertTriangle size={18} className="inline mr-2" />
          {t('notifications.permissionDenied', 'Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres de votre navigateur.')}
        </div>
      )}
      {permission === 'default' && (
        <Button onClick={handleRequestPermissionAndSubscribe}
          // isLoading={isProcessing} 
          variant="primary">
          <BellRing size={16} className="mr-2" />
          {t('notifications.enableOnThisDevice', 'Activer les notifications sur cet appareil')}
        </Button>
      )}
      {permission === 'granted' && (
        <>
          {isSubscribedToServer ? (
            <div className="flex items-center p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 rounded-md text-sm">
              <CheckCircle size={18} className="mr-2" /> {t('notifications.subscribedOnThisDevice', 'Notifications activées pour cet appareil.')}
              <Button onClick={handleUnsubscribeCurrentDevice}
                //   isLoading={isProcessing} 
                size="sm" variant="ghost" className="ml-auto text-sm !p-0">
                {t('common.disable', 'Désactiver')}
              </Button>
            </div>
          ) : (
            <Button onClick={handleRequestPermissionAndSubscribe}
              // isLoading={isProcessing} 
              variant="primary">
              <BellRing size={16} className="mr-2" />
              {t('notifications.enableOnThisDevice', 'Activer les notifications sur cet appareil')}
            </Button>
          )}
        </>
      )}

      <hr className="my-6 dark:border-slate-700" />

      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">{t('notifications.registeredDevicesTitle', 'Appareils enregistrés')}</h3>
      {renderDeviceList()}

      {/* TODO: Section pour gérer les abonnements aux contextes de notification */}
      {/* <hr className="my-6 dark:border-slate-700"/>
      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">{t('notifications.contextSubscriptionsTitle', 'Abonnements aux notifications par contexte')}</h3>
      <p className="text-sm text-slate-500 italic">{t('common.comingSoon', 'Bientôt disponible...')}</p> */}
    </div>
  );
};

export default NotificationPreferences;