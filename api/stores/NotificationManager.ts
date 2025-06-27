// api/Interfaces/Interfaces.ts

import { SublymusApi } from "../SublymusApi";

// ... (interfaces existantes) ...
// api/Interfaces/Interfaces.ts

// Rappel de PushPayloadOptions et PushPayload (déjà dans PushNotificationService.ts, mais utile pour le client aussi)
export interface PushPayloadOptionsInterface { // Suffixe Interface pour éviter conflit si importé depuis service
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  vibrate?: number[];
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: { action: string; title: string; icon?: string; url?: string }[];
  data?: any;
}
export interface PushPayloadInterface {
  title: string;
  options: PushPayloadOptionsInterface;
}


export type PingNotificationResponse = {
  success: boolean;
  message: string;
  error?: string; // En cas d'échec
};

export interface UserBrowserSubscriptionInterface {
  id: string;
  user_id: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  user_agent_raw: string | null;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: string | null;
  is_active: boolean;
  last_used_at: string | null; // ISO Date String
  created_at: string; // ISO Date String
  updated_at: string; // ISO Date String
}

export interface UserNotificationContextSubscriptionInterface {
  id: string;
  user_id: string;
  user_browser_subscription_id: string | null;
  context_name: string;
  context_id: string;
  is_active: boolean;
  created_at: string; // ISO Date String
  updated_at: string; // ISO Date String
}

// Payload pour l'enregistrement d'un appareil (ce que le client envoie)
export interface RegisterDevicePayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  // Le user-agent sera extrait par le serveur à partir des headers de la requête
}

// Pour la souscription à un contexte
export interface SubscribeToContextPayload {
    context_name: string;
    context_id: string;
    user_browser_subscription_id?: string; // Optionnel: pour lier à un appareil spécifique
    is_active?: boolean; // Optionnel, défaut à true
}

export interface PingNotificationParams {
  user_id: string;
  payload: {
    title: string;
    options: {
      body?: string;
      icon?: string;
      image?: string;
      tag?: string;
      data?: { url?: string };
      actions?: { action: string; title: string; url?: string }[];
    };
  };
  context?: {
    name: string;
    id: string;
  } | null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class NotificationManager {
  private api: SublymusApi | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isInitializing = false; // Pour éviter les initialisations multiples

  constructor() {
    this.initialize();
  }

  public async initialize(): Promise<void> {
    console.log('---- est ce qu\'on rentre ici -1');
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) ) {
      return;
    }
    console.log('---- est ce qu\'on rentre ici -2');
    this.isInitializing = true;
    console.log('[NotificationManager] Initializing...',);
    try {
      this.serviceWorkerRegistration = await this.registerServiceWorker();
    } catch (error) {
        console.error('[NotificationManager] Error during SW ready/registration:', error);
    } finally {
        this.isInitializing = false;
    }
  }

  public setApi(apiInstance: SublymusApi): void {
    this.api = apiInstance;
  }

  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[NotificationManager] Service Worker not supported.');
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
      console.log('[NotificationManager] Service Worker registered successfully.');
      return registration;
    } catch (error) {
      console.error('[NotificationManager] Service Worker registration failed:', error);
      return null;
    }
  }

  public async getPermissionState(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    if (!await this.isPushManagerSupported()) {
        console.warn('[NotificationManager] Push Manager not supported, cannot request permission.');
        return 'denied';
    }
    try {
        const permission = await Notification.requestPermission();
        console.log(`[NotificationManager] Notification permission status: ${permission}`);
        return permission;
    } catch (error) {
        console.error('[NotificationManager] Error requesting notification permission:', error);
        return 'denied';
    }
  }

  public async isPushManagerSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!this.serviceWorkerRegistration) {
      // Tenter une initialisation si ce n'est pas déjà fait
      if (!this.isInitializing) await this.initialize(); 
      if (!this.serviceWorkerRegistration) { // Re-vérifier après tentative d'init
        console.warn('[NotificationManager] Service Worker not available for Push Manager check.');
        return false;
      }
    }
    return 'pushManager' in this.serviceWorkerRegistration;
  }

  public async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!await this.isPushManagerSupported() || !this.serviceWorkerRegistration) return null;
    return this.serviceWorkerRegistration.pushManager.getSubscription();
  }

  /**
   * S'abonne (ou se réabonne) et envoie/met à jour l'abonnement sur le serveur.
   * Retourne true en cas de succès, false sinon.
   */
  public async subscribeAndSync(PUBLIC_VAPID_KEY:string): Promise<boolean> {
    if (!this.api) {
      console.error('[NotificationManager] API not set. Cannot sync subscription.');
      return false;
    }
    if (!await this.isPushManagerSupported() || !this.serviceWorkerRegistration) {
      console.warn('[NotificationManager] Push not supported or SW not ready.');
      return false;
    }

    const permission = await this.getPermissionState();
    if (permission !== 'granted') {
      console.log(`[NotificationManager] Notification permission is ${permission}. Cannot subscribe.`);
      // Tu pourrais vouloir appeler requestPermission() ici ou laisser l'UI le faire.
      return false;
    }

    try {
      let subscription = await this.getCurrentSubscription();
      if (!subscription) {
        console.log('[NotificationManager] No existing subscription found, creating new one...');
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
        });
        console.log('[NotificationManager] New Push Subscription successful.');
      } else {
        console.log('[NotificationManager] Existing Push Subscription found.');
      }
      
      // Envoyer l'abonnement (nouveau ou existant) au serveur
      console.log('########################',subscription.toJSON() as any);
      
      await this.api.notifications.registerDevice(subscription.toJSON() as any);
      console.log('[NotificationManager] Push Subscription synced with server.');
      return true;

    } catch (error) {
      console.error('[NotificationManager] Error during subscribeAndSync:', error);
      if ((error as DOMException)?.name === 'AbortError') {
        console.warn('[NotificationManager] Subscription process aborted, possibly due to permission change or SW issue.');
      }
      return false;
    }
  }

  /**
   * Se désabonne des notifications pour cet appareil et informe le serveur.
   */
  public async unsubscribeDevice(): Promise<boolean> {
    if (!this.api) {
      console.error('[NotificationManager] API not set. Cannot unsubscribe.');
      return false;
    }
    const subscription = await this.getCurrentSubscription();
    if (!subscription) {
      console.log('[NotificationManager] No active subscription to unsubscribe from this device.');
      return true; // Considéré comme un succès car pas d'abonnement
    }

    try {
      const wasUnsubscribed = await subscription.unsubscribe();
      if (wasUnsubscribed) {
        console.log('[NotificationManager] Unsubscribed from Push Manager successfully.');
        // Informer le serveur de supprimer cet appareil/abonnement
        // On a besoin de l'ID de l'appareil ici. Le plus simple est de laisser
        // le backend supprimer par endpoint si l'ID n'est pas connu côté client facilement.
        // Ou, l'endpoint /notifications/device pourrait accepter l'objet subscription pour trouver et supprimer.
        // Pour un MVP, on peut dire que le backend nettoiera les abonnements invalides lors du prochain envoi.
        // Idéalement, on enverrait l'endpoint au serveur pour qu'il le supprime.
        // Supposons que registerDevice avec un subscription null/vide le désactive ou le supprime.
        // Alternative: Une méthode dédiée removeDeviceByEndpoint dans l'API.
        // Pour l'instant, on se contente de la désinscription locale.
        // await this.api.notifications.removeDeviceByEndpoint({ endpoint: subscription.endpoint });
      } else {
        console.warn('[NotificationManager] PushManager unsubscribe returned false.');
      }
      return wasUnsubscribed;
    } catch (error) {
      console.error('[NotificationManager] Error unsubscribing from Push Manager:', error);
      return false;
    }
  }

  // --- Méthodes pour les appareils et contextes (utilisent les hooks React Query via `this.api`) ---
  // Ces méthodes sont des wrappers. L'utilisation directe des hooks dans les composants est aussi une option.

  public async listMyDevicesApi(): Promise<UserBrowserSubscriptionInterface[]> {
    if (!this.api) throw new Error("API not set in NotificationManager");
    return this.api.notifications.listDevices().then((res:any) => res); // Adapter au type de retour réel
  }

  public async updateDeviceStatusApi(deviceId: string, isActive: boolean): Promise<any> {
    if (!this.api) throw new Error("API not set in NotificationManager");
    return this.api.notifications.updateDeviceStatus({ deviceId, data: { is_active: isActive }});
  }
  
  public async removeDeviceApi(deviceId: string): Promise<any> {
    if (!this.api) throw new Error("API not set in NotificationManager");
    return this.api.notifications.removeDevice({ deviceId });
  }

  public async subscribeToContextApi(contextName: string, contextId: string, deviceId?: string): Promise<any> {
    if (!this.api) throw new Error("API not set in NotificationManager");
    return this.api.notifications.subscribeToContext( { context_name: contextName, context_id: contextId, user_browser_subscription_id: deviceId });
  }
  
  public async unsubscribeFromContextApi(subscriptionContextId: string): Promise<any> {
    if (!this.api) throw new Error("API not set in NotificationManager");
    return this.api.notifications.unsubscribeFromContext({ subscriptionId: subscriptionContextId });
  }

  public async listMyContextSubscriptionsApi(params?: { context_name?: string; context_id?: string }): Promise<any> {
    if (!this.api) throw new Error("API not set in NotificationManager");
    return this.api.notifications.listContextSubscriptions(params);
  }

}

// Exporter une instance unique pour une utilisation facile dans l'application
export  const notificationManager = new NotificationManager();
 