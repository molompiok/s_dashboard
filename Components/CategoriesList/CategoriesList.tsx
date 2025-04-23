// Components/CategoriesList/CategoriesList.tsx
// ❌ Supprimer les imports CSS correspondants s'ils existaient

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useWindowSize } from '../../Hooks/useWindowSize'; // Gardé
import { IoAddSharp, IoArrowForward, IoClose } from "react-icons/io5";
import { CgExtensionAdd } from "react-icons/cg";
// import { useApp } from '../../renderer/AppStore/UseApp'; // Remplacé par useChildViewer
// import { useChildViewer } from '../ChildViewer/ChildViewer'; // Utiliser le hook
import { CategoryInterface } from '../../Interfaces/Interfaces';
// import { useCategory } from '../../pages/category/CategoryStore'; // Remplacé par hooks API
import { useGetCategories, useGetCategoryById } from '../../api/ReactSublymusApi'; // ✅ Importer hooks API
import { useStore } from '../../pages/stores/StoreStore'; // Gardé
// import { usePageContext } from '../../renderer/usePageContext'; // Supposé non utilisé ici
import { CategoriesPopup } from '../CategoriesPopup/CategoriesPopup'; // Gardé pour le futur lien? Non, on met un lien direct.
import { getImg } from '../Utils/StringFormater'; // Gardé
import { Api_host } from '../../renderer/+config'; // Gardé pour getImg fallback? Mieux vaut passer l'URL du store.
import { useTranslation } from 'react-i18next'; // ✅ i18n
import logger from '../../api/Logger'; // Logger

// Constantes de layout (peuvent être ajustées)
const CATEGORY_ITEM_MIN_WIDTH = 80; // Largeur min en px (w-20)
const GAP_SIZE = 8; // Gap en px (gap-2)

export { CategoriesList };

function CategoriesList({ title }: { title?: string }) {
    const { t } = useTranslation(); // ✅ i18n
    const { currentStore } = useStore();
    // const { openChild } = useChildViewer(); // ✅ Utiliser le hook
    const size = useWindowSize();
    const listRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    // ✅ Récupérer les catégories avec React Query
    const { data: categoriesData, isLoading, isError } = useGetCategories(
        { limit: 50, with_product_count: true }, // Fetcher plus pour avoir le compte total, limiter l'affichage ensuite
        { enabled: !!currentStore }
    );
    const allCategories = categoriesData?.list ?? [];
    const totalCategories = categoriesData?.meta?.total ?? allCategories.length; // Utiliser total de la méta si dispo

    // Calculer le nombre d'items à afficher basé sur la largeur
    useEffect(() => {
        if (!listRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(listRef.current);
        return () => resizeObserver.disconnect(); // Nettoyer l'observer
    }, []);

    const itemsToShow = useMemo(() => {
        if (containerWidth === 0) return 5; // Valeur par défaut avant mesure
        // Calcul plus robuste
        const effectiveWidth = containerWidth + GAP_SIZE;
        const itemTotalWidth = CATEGORY_ITEM_MIN_WIDTH + GAP_SIZE;
        const itemsPerRow = Math.max(1, Math.floor(effectiveWidth / itemTotalWidth));
        // Afficher sur 2 lignes max, moins le bouton "Ajouter" et potentiellement "Voir plus"
        return Math.max(0, (itemsPerRow * 2) - 1); // -1 pour le bouton Ajouter
    }, [containerWidth]);

    const displayCategories = useMemo(() => allCategories.slice(0, itemsToShow), [allCategories, itemsToShow]);
    const canSeeMore = totalCategories > displayCategories.length;

    return (
        // Utiliser flex flex-col
        <div className="w-full flex flex-col">
             {/* Titre */}
             {/* Utiliser text-lg font-semibold mb-3 */}
            <h1 className="text-lg font-semibold text-gray-800 mb-3">
                {title || t('dashboard.categories')} {/* 🌍 i18n */}
            </h1>
             {/* Conteneur de la liste avec flex-wrap et gap */}
             {/* Utiliser min-h-[...] pour éviter le saut de layout pendant le chargement */}
            <div
                className="w-full flex flex-wrap items-start gap-2 min-h-[180px]" /* gap-2 (8px), min-h pour 2 lignes approx */
                ref={listRef}
            >
                {/* Bouton Ajouter */}
                <AddCategory isNew={allCategories.length === 0} />

                {/* Affichage pendant le chargement */}
                 {isLoading && Array.from({ length: 5 }).map((_, i) => <CategoryItemSkeleton key={`skel-${i}`} />)}

                 {/* Affichage des catégories chargées */}
                 {!isLoading && !isError && displayCategories.map((c) =>
                    <CategoryItemMini key={c.id} category={c} openCategory />
                 )}

                 {/* Affichage erreur */}
                 {isError && <p className='text-red-500 text-sm'>{t('category.fetchFailed')}</p>}

                 {/* Lien "Tout Voir" si nécessaire */}
                 {!isLoading && !isError && canSeeMore && <SeeMoreLink />}

            </div>
        </div>
    );
}

// --- Composant interne: CategoryItemMini ---
function CategoryItemMini({
    category: initialCategory,
    category_id,
    onClick,
    openCategory,
    hoverEffect = true, // Actif par défaut
    onDelete
}: {
    openCategory?: boolean;
    category_id?: string;
    category?: CategoryInterface;
    onClick?: (categorie: CategoryInterface) => void;
    onDelete?: (categorie: CategoryInterface) => void;
    hoverEffect?: boolean;
}) {
    const { t } = useTranslation(); // ✅ i18n
    const { currentStore } = useStore();
    // Utiliser un état local si les données peuvent être mises à jour par le fetch interne
    const [category, setCategory] = useState(initialCategory);

    // ✅ Utiliser le hook pour fetcher si seulement l'ID est fourni
    const { data: fetchedCategory, isLoading } = useGetCategoryById(
        !initialCategory ? category_id : undefined, // Fetch seulement si initialCategory n'est pas fourni
        { enabled: !initialCategory && !!category_id } // Activer seulement si besoin
    );

    // Mettre à jour l'état local quand les données sont fetchées
    useEffect(() => {
        if (fetchedCategory) {
            setCategory(fetchedCategory);
        }
    }, [fetchedCategory]);

    // Afficher un état de chargement si fetch en cours
    if (!category && isLoading) {
        return <CategoryItemSkeleton />;
    }
    // Afficher message si non trouvé après fetch
     if (!category) {
         // return <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gray-100 text-xs text-red-500 p-1 text-center">{t('category.notFound')}</div>;
         return null; // Ou ne rien afficher
     }

    const imageUrl = category.icon?.[0] ?? category.view?.[0];
    const productCount = category.product_count; // Supposons qu'il est fourni par useGetCategories/useGetCategoryById

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
            e.preventDefault(); // Empêcher la navigation si onClick est défini
            onClick(category);
        }
        // Sinon, le lien <a> fonctionnera normalement
    };

    const handleDelete = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete?.(category);
    };

    return (
        <a // Garder <a> pour la sémantique de lien si openCategory est vrai
            href={(openCategory && !onClick) ? `/category?id=${category.id}` : undefined}
            onClick={handleClick}
             // Utiliser les classes Tailwind : w-20 h-20, flex, flex-col, items-center, etc.
            className={`relative w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-white shadow-sm border border-gray-200 ${hoverEffect ? 'hover:scale-105 hover:shadow-md hover:border-blue-200' : ''}`}
        >
            {/* Bouton Supprimer ou Compte Produit */}
            {/* Utiliser absolute, top-0, right-0, translate-x/y pour positionner */}
            <div
                className={`absolute -top-2 -right-2 flex items-center justify-center text-white text-[10px] font-semibold rounded-full shadow z-10 ${
                    onDelete
                    ? 'w-6 h-6 bg-red-500 hover:bg-red-600 cursor-pointer' // Style pour bouton supprimer
                    : 'min-w-[20px] h-5 px-1.5 bg-blue-500 cursor-default' // Style pour compteur produit
                }`}
                onClick={onDelete ? handleDelete : undefined}
                title={onDelete ? t('common.delete') : undefined}
            >
                {onDelete ? <IoClose size={14} /> : (productCount ?? '?')}
            </div>

             {/* Image/Icône */}
             {/* Utiliser w-full aspect-square, rounded, bg-cover/contain, bg-center */}
            <div
                className="w-full aspect-square rounded bg-contain bg-center bg-no-repeat mb-1" // Utiliser contain pour icônes
                style={{ backgroundImage: getImg(imageUrl, 'contain', currentStore?.url) }} // Toujours contain
            ></div>

             {/* Nom */}
             {/* Utiliser text-xs, font-medium, text-gray-700, truncate */}
            <span className="w-full text-xs font-medium text-gray-700 truncate leading-tight" title={category.name}>
                {category.name}
            </span>
        </a>
    );
}

// --- Composant interne: AddCategory ---
function AddCategory({ isNew }: { isNew: boolean }) {
    const { t } = useTranslation(); // ✅ i18n
    if (isNew) {
        return (
            // Style pleine largeur si c'est le seul élément
             // Utiliser flex, items-center, gap-6, p-4, rounded-xl, border-dashed etc.
             <a href='/category?id=new' className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100 transition duration-150 cursor-pointer">
                 <CgExtensionAdd className='w-12 h-12 text-blue-500 flex-shrink-0' />
                 <div className='text-center sm:text-left'>
                    <p className='font-semibold'>{t('category.addNewPromptTitle')}</p> 
                    <p className='text-sm'>{t('category.addNewPromptDesc')}</p> 
                 </div>
                 {/* Optionnel: bouton explicite */}
                 {/* <button className='ml-auto bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700'>
                     {t('category.addNewButton')}
                 </button> */}
            </a>
        );
    } else {
        return (
             // Petit bouton carré
             // Utiliser w-20 h-20, flex, flex-col, items-center, justify-center, etc.
             <a href='/category?id=new' className="w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-gray-300 hover:border-gray-400 hover:scale-105">
                 <IoAddSharp className='w-8 h-8 mb-1' />
                 <span className='text-xs font-medium'>{t('common.add')}</span> 
            </a>
        );
    }
}

// --- Composant interne: SeeMoreLink ---
function SeeMoreLink() {
     const { t } = useTranslation(); // ✅ i18n
    return (
         // Utiliser w-20 h-20, flex, flex-col, items-center, justify-center, etc.
        <a href="/categories" className="w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 hover:border-blue-300 hover:scale-105">
            <IoArrowForward className='w-8 h-8 mb-1' />
            <span className='text-xs font-medium'>{t('common.seeAll')}</span> 
        </a>
    );
}

// --- Composant interne: CategoryItemSkeleton ---
function CategoryItemSkeleton() {
    return (
        <div className="w-20 h-20 p-1.5 rounded-xl bg-gray-200 animate-pulse flex flex-col items-center">
            <div className="w-full aspect-square rounded bg-gray-300 mb-1"></div>
            <div className="w-10/12 h-2 rounded bg-gray-300"></div>
        </div>
    );
}