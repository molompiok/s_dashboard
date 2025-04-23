// pages/commands/+Page.tsx
// import './Page.css'; // ❌ Supprimer

import { CommandeList } from '../../Components/CommandesList/CommandesList';
import { Topbar } from '../../Components/TopBar/TopBar';
// Ajouter un conteneur principal si besoin, ou intégrer Topbar et CommandeList dans un layout global

export { Page };

function Page() {
  return (
    // Conteneur principal pour la page des commandes
    // Utiliser flex flex-col pour organiser Topbar et CommandeList
    // Ajouter du padding, et centrer/limiter la largeur
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      <Topbar />
      {/* Conteneur pour le contenu principal de la page */}
      <div className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* CommandeList prend maintenant toute la largeur disponible dans ce conteneur */}
        <CommandeList />
      </div>
    </div>
  );
}