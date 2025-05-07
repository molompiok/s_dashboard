// pages/index/+Page.tsx
// import './index.css'; // ❌ Supprimer l'import CSS

import { Topbar } from '../../Components/TopBar/TopBar'; // Composant supposé déjà existant/refactorisé
import { HomeStat } from './HomeStat/HomeStat';
import { HomeManage } from './HomeManage/HomeManage';
import { CommandeList } from '../../Components/CommandesList/CommandesList';

export { Page }

function Page() {
  
  return (
    <div className='flex pb-48 min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-900'>
      <Topbar />
      <div className='w-full flex-grow flex flex-col items-center gap-4 p-4 md:p-6 lg:p-8'>
        <HomeStat />
        <HomeManage/>
        <CommandeList/>
      </div>
    </div>
  )
}