// themes/mono/pages/profile/notifications/+Page.tsx
import React from 'react';
import { Layout as ThemeLayout } from '../../../renderer/Layout';
import { usePageContext } from '../../../renderer/usePageContext';
import NotificationStatusDashboard from '../NotificationStatusDashboard';
import { Bell, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from '../../../renderer/Link';

export function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();

  return (
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <Link href="/profile" className="inline-flex items-center text-sm text-primary hover:underline mb-6">
            <ArrowLeft size={16} className="mr-1" />
            {t('profile.backToProfile', 'Retour au profil')}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 sm:mb-8 flex items-center">
            <Bell size={28} className="mr-3 text-primary" />
            {t('profile.nav.notifications', 'Gestion des Notifications')}
          </h1>
          <div className="max-w-3xl">
            <NotificationStatusDashboard />
          </div>
        </div>
  );
}