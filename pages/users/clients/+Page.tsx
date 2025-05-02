//pages/users/clients/+Page.tsx
import { ClientList } from "../../../Components/ClientList/ClientList"


export {Page}

import React from 'react';
import './+Page.css';
import { BreadcrumbItem, Topbar } from "../../../Components/TopBar/TopBar";
import { useTranslation } from "react-i18next";

const Page: React.FC = () => {
  const { t } = useTranslation();
  const breadcrumbs: BreadcrumbItem[] = [
    { name: t('navigation.home'), url: '/' },
    { name: t('navigation.users'), url: '/users' }, // Page parente "Utilisateurs" ou "Équipes"
    { name: t('navigation.clients') }, // Page actuelle
];

  return (
    <div className="clients-page">
      <Topbar breadcrumbs={breadcrumbs}/>
      <ClientList initialClients={[]}/>
    </div>
  );
};