// pages/commands/+Page.tsx

import { useTranslation } from 'react-i18next';
import { CommandeList } from '../../Components/CommandesList/CommandesList';
import { BreadcrumbItem, Topbar } from '../../Components/TopBar/TopBar';

export { Page };

function Page() {
  const {t} = useTranslation()
  const breadcrumbs: BreadcrumbItem[] = [
    { name: t('navigation.home'), url: '/' },
    { name: t('navigation.orders') }, // Page actuelle
];
  return (
    <div className="commands  pb-[200px] w-full min-h-screen flex flex-col">
      <Topbar back  breadcrumbs={breadcrumbs}/>
      <div className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <CommandeList />
      </div>
    </div>
  );
}