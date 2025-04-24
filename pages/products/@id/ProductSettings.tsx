// pages/products/@id/ProductSettings.tsx (ou un chemin similaire)

import { Swiper, SwiperSlide } from 'swiper/react';
import { Grid, Pagination } from 'swiper/modules'; // Modules Swiper utilisés
import { useWindowSize } from '../../../Hooks/useWindowSize'; // Hook pour responsive
import { getImg } from '../../../Components/Utils/StringFormater'; // Utilitaire image
import { useTranslation } from 'react-i18next'; // ✅ i18n

// Importer les styles Swiper nécessaires (ajuster selon l'installation)
import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/pagination';
import { useMemo } from 'react';
// Optionnel: Ajouter un CSS spécifique si besoin pour Swiper (pagination, etc.)
// import './ProductSettings.css';

// Définition de la structure des cartes de paramètres
interface SettingCard {
    name: string; // Identifiant unique de l'action/paramètre
    showKey: string; // Clé i18n pour le nom affiché
    url: string; // Chemin de l'icône
    color: string; // Couleur de fond (Tailwind ou Hex/RGB)
    shadowColor?: string; // Couleur de l'ombre (Tailwind ou Hex/RGB)
    // Ajouter d'autres props si nécessaire (ex: condition d'affichage)
}

// Données des cartes (comme précédemment, mais avec showKey)
// TODO: S'assurer que les clés i18n existent dans le fichier de traduction
const Settings: SettingCard[] = [
    { name: 'price-stock', showKey: 'productSettings.priceStock', url: '/res/icons/money.png', color: 'bg-green-500', shadowColor: 'shadow-green-500/40' },
    { name: 'details', showKey: 'productSettings.details', url: '/res/icons/details.png', color: 'bg-slate-500', shadowColor: 'shadow-slate-500/40' },
    { name: 'promo', showKey: 'productSettings.promo', url: '/res/icons/promo.png', color: 'bg-orange-500', shadowColor: 'shadow-orange-500/40' },
    // { name: 'inventory', showKey: 'productSettings.inventory', url: '/res/icons/inventory.png', color: 'bg-indigo-500', shadowColor: 'shadow-indigo-500/40' },
    // { name: 'affiliation', showKey: 'productSettings.affiliation', url: '/res/icons/affiliation.png', color: 'bg-purple-500', shadowColor: 'shadow-purple-500/40' },
    { name: 'show-stats', showKey: 'productSettings.stats', url: '/res/icons/stats.png', color: 'bg-blue-500', shadowColor: 'shadow-blue-500/40' },
    { name: 'comments', showKey: 'productSettings.comments', url: '/res/icons/comments.png', color: 'bg-amber-500', shadowColor: 'shadow-amber-500/40' },
    { name: 'delete', showKey: 'productSettings.delete', url: '/res/icons/delete.png', color: 'bg-red-500', shadowColor: 'shadow-red-500/40' },
];

// Props du composant
interface ProductSettingsProps {
    onSelected: (settingName: string) => void; // Callback quand une carte est cliquée
}

export function ProductSettings({ onSelected }: ProductSettingsProps) {
    const { t } = useTranslation(); // ✅ i18n
    const windowWidth = useWindowSize().width; // Obtenir la largeur de la fenêtre

    // Calculer le nombre de slides visibles (responsive)
    const slidesPerView = useMemo(() => {
        if (windowWidth < 450) return 2.2; // Plus de slides visibles sur mobile
        if (windowWidth < 640) return 3.2; // sm
        if (windowWidth < 768) return 3.5; // md
        if (windowWidth < 1024) return 4.5; // lg
        return 5.5; // xl et plus
    }, [windowWidth]);

    return (
        // Utiliser Swiper avec les modules Grid et Pagination
        <Swiper
            slidesPerView={slidesPerView}
            grid={{
                rows: 2,
                fill: 'row' // Remplir par ligne
            }}
            spaceBetween={15} // Espace entre les cartes
            pagination={{
                clickable: true,
                // Optionnel: styliser la pagination avec des classes Tailwind
                // el: '.swiper-pagination-custom', // Sélecteur pour conteneur custom
                // bulletClass: 'swiper-pagination-bullet-custom',
                // bulletActiveClass: 'swiper-pagination-bullet-active-custom',
            }}
            modules={[Grid, Pagination]}
            className="product-settings-swiper py-4" // Ajouter padding vertical pour pagination
            style={{ overflow: 'visible' }} // Permettre aux ombres de déborder
        >
            {Settings.map(setting => (
                <SwiperSlide key={setting.name} className="h-auto pb-8"> {/* Ajouter padding bottom pour pagination */}
                    {/* Carte cliquable */}
                    <button // Utiliser un bouton pour l'accessibilité
                        type="button"
                        onClick={() => onSelected(setting.name)}
                        // Appliquer les styles Tailwind
                        className={`setting w-full aspect-square rounded-xl p-3 flex flex-col justify-between items-center cursor-pointer transition duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${setting.shadowColor ?? 'shadow-md'} hover:shadow-lg`}
                        // Style inline pour la couleur de fond dynamique
                        style={{ backgroundColor: setting.color.startsWith('bg-') ? undefined : setting.color }}
                        // Ajouter la classe de couleur Tailwind si elle existe
                        {...(setting.color.startsWith('bg-') && { className: `${setting.color}` })}
                    >
                         {/* Icône */}
                        <img
                             src={setting.url} // Utiliser getImg pour les chemins relatifs
                             alt={t(setting.showKey)} // Texte alternatif traduit
                             className="w-10 h-10 sm:w-12 sm:h-12 object-contain filter drop-shadow-sm" // Ajuster taille icône + ombre légère
                         />
                         {/* Nom */}
                          <span className="name text-white text-xs sm:text-sm font-medium text-center mt-1 leading-tight px-1">
                              {t(setting.showKey)} {/* Traduire le nom */}
                          </span>
                    </button>
                </SwiperSlide>
            ))}
            {/* Ajouter des slides vides si le nombre de settings n'est pas un multiple de rows * slidesPerView? Non, Swiper Grid gère ça. */}
             {/* Conteneur pour pagination custom si besoin */}
             {/* <div className="swiper-pagination-custom text-center mt-4"></div> */}
        </Swiper>
    );
}

