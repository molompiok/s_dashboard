// pages/index/HomeManage/HomeManage.tsx
// import './HomeManage.css'; // ❌ Supprimer l'import CSS
import { IoBagHandle, IoStorefront, IoFolderOpen } from 'react-icons/io5';
import { useTranslation } from 'react-i18next'; // ✅ Importer useTranslation
// Importer les hooks pour récupérer les données dynamiques si nécessaire
import { useGetProductList } from '../../../api/ReactSublymusApi';
import { useGetCategories } from '../../../api/ReactSublymusApi';
import { useStore } from '../../stores/StoreStore'; // Pour le nombre de stores si dynamique

export { HomeManage };

// Fonction pour créer les classes de base de la carte
const cardBaseClasses = "w-[120px] min-w-[120px] aspect-square rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition duration-100 ease-in-out hover:scale-105";
// Fonction pour créer les classes d'ombre spécifiques
const shadowClasses = (colorClass: string) => `shadow-md ${colorClass ? `shadow-${colorClass}-500/30` : 'shadow-gray-400/30'}`;

function HomeManage() {
    const { t } = useTranslation(); // ✅ Initialiser la traduction

    // TODO: Remplacer les valeurs statiques par des données réelles si nécessaire
    // Exemple:
    const { data: productData } = useGetProductList({ limit: 1 }); // Juste pour le count
    const { data: categoryData } = useGetCategories({ limit: 1 });
    const { stores } = useStore();
    const productCount = productData?.meta?.total ?? 0;
    const categoryCount = categoryData?.meta?.total ?? 0;
    const storeCount = stores?.meta.total ?? 1; // Supposant qu'il y a toujours au moins 1 store pour l'owner

    // Utiliser des valeurs statiques pour S0 si l'API n'est pas prête ou nécessaire
    // const productCount = 22;
    // const categoryCount = 5;
    // const storeCount = 1;

    return (
        // Conteneur avec flex, gap, padding et overflow-x
        // Ajout de 'pb-4' pour laisser un peu d'espace en bas pour l'ombre ou la scrollbar
        // Utilisation de 'scrollbar-thin' ou 'scrollbar-hide' si plugin installé, sinon style par défaut
        <div className="w-full flex gap-3 overflow-y-hidden overflow-x-auto p-2.5 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">

            {/* Carte Produits */}
            <a href='/products' className={`${cardBaseClasses} bg-white text-blue-500 ${shadowClasses('blue')}`}>
                <div className="views">
                    {/* Icône simple pour l'instant */}
                    <IoBagHandle className='w-8 h-8' />
                    {/* TODO: Logique d'affichage des images produits si nécessaire */}
                    {/* {productImages.slice(0, 3).map((url, i) => (
                        <div key={i} className="w-10 min-w-10 aspect-square -mr-4 rounded-full bg-no-repeat bg-center bg-cover border-2 border-white" style={{ backgroundImage: `url(${url})` }}></div>
                    ))} */}
                </div>
                <div className="bottom">
                    {/* 🌍 i18n */}
                    <h2 className="font-semibold text-base">{t('dashboard.products')}</h2>
                    <span className="text-sm">{productCount}</span>
                </div>
            </a>

            {/* Carte Catégories */}
            <a href='/categories' className={`${cardBaseClasses} bg-white text-cyan-500 ${shadowClasses('cyan')}`}>
                <div className="views">
                    <IoFolderOpen className='w-8 h-8' />
                    {/* TODO: Logique d'affichage des images catégories */}
                </div>
                <div className="bottom">
                    {/* 🌍 i18n */}
                    <h2 className="font-semibold text-base">{t('dashboard.categories')}</h2>
                    <span className="text-sm">{categoryCount}</span>
                </div>
            </a>

            {/* Carte Boutiques (si pertinent pour l'owner dans CE dashboard) */}
            <a href='/stores' className={`${cardBaseClasses} bg-white text-primary ${shadowClasses('yellow')}`}> {/* Assumer text-primary défini dans tailwind.config */}
                <div className="views">
                    <IoStorefront className='w-8 h-8' />
                </div>
                <div className="bottom">
                    {/* 🌍 i18n */}
                    <h2 className="font-semibold text-base">{t('dashboard.manageStores')}</h2>
                    <span className="text-sm">{storeCount}</span>
                </div>
            </a>

            {/* Espaceur pour éviter que la dernière carte colle au bord */}
            <div className="min-w-[5vw] flex-shrink-0"></div>
        </div>
    );
}