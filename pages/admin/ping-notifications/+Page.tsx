import React, { useState } from 'react';
import { Button } from '../../../Components/UI/Button';
import { Input } from '../../../Components/UI/Input';
import { usePingTestNotification } from '../../../api/ReactSublymusApi'; // Le hook qu'on vient de créer
import { useAuthStore } from '../../../api/stores/AuthStore'; // Pour vérifier le rôle admin
import { PingNotificationParams } from '../../../api/stores/NotificationManager'; // Le type de paramètres
import { Bell, UserSearch, FileText, Link, Tag, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { ClientCall } from '../../../Components/Utils/functions';

// Un composant simple pour la section
const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow mb-6">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b dark:border-slate-700 pb-3 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

export function Page() {
  const { t } = useTranslation();
  const { getUser } = useAuthStore();
  const pingMutation = usePingTestNotification();

  // --- États du formulaire ---
  const [targetUserId, setTargetUserId] = useState(getUser()?.id||'');
  const [isContextual, setIsContextual] = useState(false);
  const [contextName, setContextName] = useState('order_update');
  const [contextId, setContextId] = useState('noga');
  const [notifTitle, setNotifTitle] = useState('🔔 Notification de Test');
  const [notifBody, setNotifBody] = useState('Ceci est un message de test.');
  const [notifIcon, setNotifIcon] = useState(`https://picsum.photos/192/192?random=${Math.trunc(ClientCall(Math.random,0.02)*100)}`);
  const [notifImage, setNotifImage] = useState(`https://picsum.photos/72/72?random=${Math.trunc(ClientCall(Math.random,0.01)*100)}`);
  const [notifTag, setNotifTag] = useState('test-notification');
  const [notifDataUrl, setNotifDataUrl] = useState('/');

  // Protection de la page
  // Remplace 'isSuperAdmin' par la logique de permission réelle de ton `user` object
  const isAdmin = true//user?.roles?.some(role => role.name === 'OWNER' || role.name === 'ADMIN'); 
  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600">Accès non autorisé.</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      toast.error(t('notifications.test.error.userIdRequired', 'L\'ID de l\'utilisateur cible est requis.'));
      return;
    }
    if (!notifTitle) {
      toast.error(t('notifications.test.error.titleRequired', 'Le titre de la notification est requis.'));
      return;
    }

    const params: PingNotificationParams = {
      user_id: targetUserId,
      payload: {
        title: notifTitle,
        options: {
          body: notifBody || undefined,
          icon: notifIcon || undefined,
          image: notifImage || undefined,
          tag: notifTag || undefined,
          data: { url: notifDataUrl || '/' },
          // actions: [] // Ajouter la logique pour les actions plus tard
        },
      },
      context: isContextual ? { name: contextName, id: contextId } : null,
    };

    pingMutation.mutate(params, {
      onSuccess: (data) => toast.success(data.message),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="p-4  pb-48">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
        <Bell className="mr-3" /> Test d'Envoi de Notifications Push
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {pingMutation.error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 flex items-center gap-2">
                <AlertCircle size={18}/>
                <span>{pingMutation.error.message}</span>
            </div>
        )}

        <AdminSection title="Cible de la Notification">
          <Input
            label="ID de l'Utilisateur Cible"
            id="targetUserId"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Entrez l'UUID de l'utilisateur..."
            icon={UserSearch}
            required
          />
          <Checkbox
            label="Envoyer via un Contexte Spécifique"
            id="isContextual"
            checked={isContextual}
            onCheckedChange={(checked) => setIsContextual(Boolean(checked))}
          />
          {isContextual && (
            <div className="pl-6 border-l-2 dark:border-slate-700 space-y-4">
              <Input
                label="Nom du Contexte"
                id="contextName"
                value={contextName}
                onChange={(e) => setContextName(e.target.value)}
                placeholder="ex: order_update"
              />
              <Input
                label="ID du Contexte"
                id="contextId"
                value={contextId}
                onChange={(e) => setContextId(e.target.value)}
                placeholder="ex: ID de la commande"
              />
            </div>
          )}
        </AdminSection>

        <AdminSection title="Contenu de la Notification">
          <Input label="Titre" id="notifTitle" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} icon={FileText} required />
          <Input as="textarea" label="Corps du message" id="notifBody" value={notifBody} onChange={(e) => setNotifBody(e.target.value)} />
          <Input label="URL de l'icône" id="notifIcon" type="url" value={notifIcon} onChange={(e) => setNotifIcon(e.target.value)} icon={ImageIcon} placeholder="https://..." />
          <Input label="URL de l'image principale" id="notifImage" type="url" value={notifImage} onChange={(e) => setNotifImage(e.target.value)} icon={ImageIcon} placeholder="https://..." />
          <Input label="Tag (regroupement)" id="notifTag" value={notifTag} onChange={(e) => setNotifTag(e.target.value)} icon={Tag} />
          <Input label="URL à ouvrir au clic" id="notifDataUrl" type="text" value={notifDataUrl} onChange={(e) => setNotifDataUrl(e.target.value)} icon={Link} placeholder="/products/mon-produit" />
        </AdminSection>
        
        {/* TODO: Ajouter une section pour gérer dynamiquement les boutons d'action */}

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" isLoading={pingMutation.isPending}>
            <Bell className="mr-2" size={18}/>
            Envoyer la Notification de Test
          </Button>
        </div>
      </form>
    </div>
  );
}

// Supposons un composant Checkbox basique
const Checkbox: React.FC<{ label: string, id: string, checked: boolean, onCheckedChange: (checked: boolean) => void }> = ({ label, id, checked, onCheckedChange }) => (
    <div className="flex items-center">
        <input 
            id={id} 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onCheckedChange(e.target.checked)} 
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor={id} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">{label}</label>
    </div>
);