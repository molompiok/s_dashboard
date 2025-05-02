// pages/products/+Page.tsx
// import './Page.css'; // Supprimer si existait

import { BreadcrumbItem, Topbar } from '../../Components/TopBar/TopBar';
import { CategoriesList } from '../../Components/CategoriesList/CategoriesList';
import { ProductList } from '../../Components/ProductList/ProductList';
import { useTranslation } from 'react-i18next';
// import { useTranslation } from 'react-i18next'; // Ajouter si besoin de traduire des textes spécifiques à cette page

export { Page };

function Page() {
  const { t } = useTranslation();
  const breadcrumbs: BreadcrumbItem[] = [
    { name: t('navigation.home'), url: '/' },
    { name: t('navigation.products') }, // Dernier élément sans URL
];
  return (
    // Conteneur principal: pleine largeur, fond léger, organisation en colonne
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      <Topbar back={true} breadcrumbs={breadcrumbs} />
      {/* Conteneur pour le contenu principal avec padding et centrage */}
      <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6"> {/* Ajouter gap */}
        {/* Les composants enfants utiliseront leur propre logique et styles Tailwind */}
        <CategoriesList />
        <ProductList />
      </main>
    </div>
  );
}