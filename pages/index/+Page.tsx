// pages/index/+Page.tsx
// import './index.css'; // ❌ Supprimer l'import CSS

import { Topbar } from '../../Components/TopBar/TopBar'; // Composant supposé déjà existant/refactorisé
import { HomeStat } from './HomeStat/HomeStat';
import { HomeManage } from './HomeManage/HomeManage';
import { CommandeList } from '../../Components/CommandesList/CommandesList';
import { usePageContext } from '../../renderer/usePageContext';

export { Page }

function Page() {
  // La logique usePageContext reste inchangée
  const { urlParsed: { search } } = usePageContext();
  console.log(search);

  return (
    // Appliquer les classes Tailwind pour remplacer .home-page
    // w-full: width: 100%
    // min-h-screen: Assure que la page prend au moins la hauteur de l'écran (mieux que max-height: 100%)
    // flex flex-col: Pour empiler Topbar et content verticalement
    // bg-gray-100 dark:bg-gray-900: Un fond léger par défaut, adaptable au mode sombre
    <div className='flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-900'>
      {/* Topbar prendra toute la largeur */}
      <Topbar />

      {/* Appliquer les classes Tailwind pour remplacer .content */}
      {/* w-full: width: 100% */}
      {/* flex-grow: Pour que cette partie prenne l'espace vertical restant */}
      {/* flex flex-col: Empiler les sections verticalement */}
      {/* items-center: Centrer les éléments horizontalement (si leur largeur n'est pas 100%) */}
      {/* gap-4: Espacement entre les sections (remplace gap: 8px, ajuster si besoin -> gap-2) */}
      {/* p-4 ou px-4 py-4: Ajouter du padding autour du contenu principal */}
      <div className='w-full flex-grow flex flex-col items-center gap-4 p-4 md:p-6 lg:p-8'>
        {/* Les composants enfants prendront leur propre largeur ou seront en w-full */}
        <HomeStat />
        <HomeManage/>
        <CommandeList/>
      </div>
    </div>
  )
}