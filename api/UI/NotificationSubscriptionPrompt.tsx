import React, { useState, useEffect } from 'react';
import { useSubscribeToContext } from '../../api/ReactSublymusApi'; // Le hook de mutation
import { useAuthStore } from '../../api/stores/AuthStore';
import { BellRing, BellOff, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationManager } from '../stores/NotificationManager';
import { cn } from '../../Components/Utils/functions';
import { Button } from '../../Components/UI/Button';
import { usePageContext } from '../../renderer/usePageContext';

interface NotificationSubscriptionPromptProps {
  /** Le nom du contexte auquel s'abonner (ex: 'order_update') */
  contextName: string;
  /** L'ID de l'entité du contexte (ex: l'ID de la commande) */
  contextId: string;
  /** Le titre du prompt */
  title?: string;
  /** La description du prompt */
  description?: string;
  /** Callback appelé après un abonnement réussi et la fermeture du modal */
  onSuccessAndClose?: () => void;
  /** Le composant qui fermera le modal parent */
  closePrompt: () => void;
}

type PromptState = 'idle' | 'loading' | 'success' | 'permission_denied' | 'error';

export const NotificationSubscriptionPrompt: React.FC<NotificationSubscriptionPromptProps> = ({
  contextName,
  contextId,
  title,
  description,
  onSuccessAndClose,
  closePrompt,
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const subscribeMutation = useSubscribeToContext();
  const {PUBLIC_VAPID_KEY} = usePageContext()
  const [promptState, setPromptState] = useState<PromptState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const defaultTitle = t('notifications.prompt.defaultTitle', 'Restez Informé !');
  const defaultDescription = t('notifications.prompt.defaultDescription', 'Activez les notifications pour recevoir les mises à jour en temps réel concernant vos commandes.');

  const handleEnableNotifications = async () => {
    setPromptState('loading');
    setErrorMessage('');

    if (!user) {
        setErrorMessage(t('notifications.prompt.error.notLoggedIn', 'Vous devez être connecté pour activer les notifications.'));
        setPromptState('error');
        return;
    }
    
    // 1. Demander la permission si nécessaire
    let permission = await notificationManager.getPermissionState();
    if (permission === 'default') {
      permission = await notificationManager.requestPermission();
    }

    // 2. Gérer la permission refusée
    if (permission === 'denied') {
      setPromptState('permission_denied');
      return;
    }

    // 3. S'abonner et synchroniser avec le serveur
    if (permission === 'granted') {
      const subscribed = await notificationManager.subscribeAndSync(PUBLIC_VAPID_KEY);
      if (subscribed) {
        // 4. S'abonner au contexte spécifique
        subscribeMutation.mutate({ context_name: contextName, context_id: contextId }, {
          onSuccess: () => {
            setPromptState('success');
            setTimeout(() => {
              closePrompt();
              onSuccessAndClose?.();
            }, 3000); // Ferme après 3 secondes
          },
          onError: (err) => {
            setErrorMessage(err.message || t('notifications.prompt.error.contextFailed', 'Impossible de s\'abonner aux mises à jour pour cette commande.'));
            setPromptState('error');
          }
        });
      } else {
        setErrorMessage(t('notifications.prompt.error.subscriptionFailed', 'L\'activation des notifications a échoué. Veuillez réessayer.'));
        setPromptState('error');
      }
    }
  };
  
  const getIconAndColor = () => {
    switch (promptState) {
      case 'success':
        return { Icon: Check, color: 'text-emerald-500' };
      case 'permission_denied':
      case 'error':
        return { Icon: AlertTriangle, color: 'text-red-500' };
      case 'loading':
        return { Icon: Loader2, color: 'text-blue-500 animate-spin' };
      default: // idle
        return { Icon: BellRing, color: 'text-blue-500' };
    }
  };
  
  const { Icon, color } = getIconAndColor();

  return (
    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center">
      <div className={cn("w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4", color)}>
        <Icon size={32} />
      </div>

      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        {title || defaultTitle}
      </h3>

      {promptState === 'idle' && (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            {description || defaultDescription}
          </p>
          <Button 
            className="w-full" 
            onClick={handleEnableNotifications}
          >
            {t('notifications.prompt.enableAction', 'Activer les notifications')}
          </Button>
        </>
      )}

      {promptState === 'loading' && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('notifications.prompt.loading', 'Activation en cours...')}
        </p>
      )}

      {promptState === 'success' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t('notifications.prompt.success', 'Parfait ! Vous serez notifié des prochaines mises à jour.')}
        </p>
      )}
      
      {promptState === 'permission_denied' && (
        <div className="text-sm text-red-700 dark:text-red-400">
          <p className="font-semibold mb-2">{t('notifications.prompt.deniedTitle', 'Permissions bloquées')}</p>
          <p className="mb-3">{t('notifications.prompt.deniedMessage', 'Vous avez précédemment bloqué les notifications. Pour les activer, vous devez modifier les paramètres de votre navigateur.')}</p>
          <a 
            href="https://support.google.com/chrome/answer/3220216" // Lien exemple pour Chrome
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('notifications.prompt.howToActivateLink', 'Voir comment activer les notifications')}
          </a>
        </div>
      )}
      
      {promptState === 'error' && (
        <p className="text-sm text-red-700 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
};