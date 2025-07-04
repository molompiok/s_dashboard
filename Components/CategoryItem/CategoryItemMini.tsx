// Components/CategoryItem/CategoryItemMini.tsx
import { useEffect, useState } from "react";
import { CategoryInterface } from "../../api/Interfaces/Interfaces";
import { IoClose } from "react-icons/io5";
import { useGetCategory } from "../../api/ReactSublymusApi";
import { useGlobalStore } from "../../api/stores/StoreStore";
import { getMedia } from "../Utils/StringFormater"; // Import de getMedia
import { useTranslation } from "react-i18next";
import logger from "../../api/Logger";
import { NO_PICTURE } from "../Utils/constants";
import { navigate } from "vike/client/router";

export { CategoryItemMini };

interface CategoryItemMiniProps {
    category?: CategoryInterface;
    category_id?: string;
    onClick?: (categorie: CategoryInterface) => void;
    onDelete?: (categorie: CategoryInterface) => void;
    openCategory?: boolean;
    hoverEffect?: boolean;
}

function CategoryItemMini({
    category: initialCategory,
    category_id,
    onClick,
    openCategory = false,
    hoverEffect = true,
    onDelete
}: CategoryItemMiniProps) {
    const { t } = useTranslation();
    const [category, setCategory] = useState(initialCategory);

    const { data: fetchedCategory, isLoading, isError , refetch } = useGetCategory({
        category_id: !initialCategory ? category_id : undefined
    },
        { enabled: !initialCategory && !!category_id }
    );

    

    useEffect(() => {
        if (fetchedCategory) setCategory(fetchedCategory);
    }, [fetchedCategory]);

    if (!category && isLoading) return <CategoryItemSkeletonMini />;
    if (!category && isError && !initialCategory) return <div className="w-20 h-20 p-1.5 rounded-xl flex flex-col items-center justify-center text-center bg-red-50 border border-red-200 text-red-600"><span className="text-[10px]">{t('category.fetchFailedShort')}</span></div>;
    if (!category) return null;

    // --- Gestion Image ---
    // Priorité: icon[0], sinon view[0], sinon placeholder
    const primaryImageUrl = category.icon?.[0] ?? category.view?.[0] ?? NO_PICTURE;
    const imageStyle = {
        // Utiliser getMedia pour construire la propriété background-image
        // Passer currentStore.url pour gérer les URLs relatives
        background: getMedia({ isBackground: true, source: primaryImageUrl, size: 'contain', from: 'api' }),
    };
    // --- Fin Gestion Image ---

    const productCount = category.product_count;

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        if (onClick) {
            if (openCategory) e.preventDefault();
            onClick(category);
        }
    };

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete?.(category);
    };

    const ContainerElement = (openCategory && !onClick) ? 'a' : 'div';
    const containerProps = ContainerElement === 'a'
        ? { onClick: ()=>{
            navigate(`/categories/${category.id}`)
        } }
        : { onClick: onClick ? handleClick : undefined, role: onClick ? 'button' : undefined, tabIndex: onClick ? 0 : undefined };


    return (
        <ContainerElement
            {...containerProps}
            className={`relative w-20 h-23 p-0.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-white shadow-sm  hover:border-blue-200 hover:shadow-md dark:bg-white/5 border border-gray-100  dark:border-white/10 ${hoverEffect ? 'hover:scale-105 hover:shadow-md hover:border-blue-200 group' : ''}`}
        >
            {/* Bouton/Compteur */}
            <div
                className={`absolute -top-2 -right-2 flex items-center justify-center text-white text-[10px] font-semibold rounded-full shadow z-10 transition-opacity
                    ${onDelete
                        ? 'w-6 h-6 bg-red-100 hover:bg-red-300 cursor-pointer opacity-100'
                        : 'min-w-[20px] h-5 px-1.5 bg-blue-400 cursor-default'
                    }`}
                onClick={onDelete ? (e: any) => handleDelete(e) : undefined}
                title={onDelete ? t('common.delete') : undefined}
                {...(onDelete ? { type: 'button' } : {})}
            >
                {onDelete && productCount !== undefined ? <IoClose className="text-red-500" size={18} /> : (productCount ?? '?')}
            </div>

            {/* Image (avec style dynamique) */}
            <div
                className="w-18 aspect-square rounded bg-contain bg-center bg-no-repeat mb-1 -gray-100" // bg-gray-100 comme fallback
                style={imageStyle} // Appliquer le style backgroundImage
            ></div>

            {/* Nom */}
            <span className="inline-block w-full min-h-4 text-xs mb-1 font-medium text-gray-700 dark:text-white truncate leading-tight" title={category.name}>
                {category.name}
            </span>
        </ContainerElement>
    );
}
// --- Composant Skeleton adapté ---
export function CategoryItemSkeletonMini() {
    return (
        <div className="w-20 h-20 p-1.5 rounded-xl bg-gray-200 animate-pulse flex flex-col items-center">
            <div className="w-full aspect-square rounded bg-gray-300 mb-1"></div>
            <div className="w-10/12 h-2 rounded bg-gray-300"></div>
        </div>
    );
}