// Components/CategoryItem/CategoryItemMini.tsx
import { useEffect, useState } from "react";
import { CategoryInterface } from "../../Interfaces/Interfaces";
import { IoClose } from "react-icons/io5";
import { useGetCategoryById } from "../../api/ReactSublymusApi";
import { useStore } from "../../pages/stores/StoreStore";
import { getImg } from "../Utils/StringFormater"; // Import de getImg
import { useTranslation } from "react-i18next";
import logger from "../../api/Logger";
import { NO_PICTURE } from "../Utils/constants";

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
    const { currentStore } = useStore();
    const [category, setCategory] = useState(initialCategory);

    const { data: fetchedCategory, isLoading, isError } = useGetCategoryById(
        !initialCategory ? category_id : undefined,
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
    const primaryImageUrl = category.icon?.[0] ?? category.view?.[0]??NO_PICTURE;
    const imageStyle = {
        // Utiliser getImg pour construire la propriété background-image
        // Passer currentStore.url pour gérer les URLs relatives
        background: getImg(primaryImageUrl, 'contain', currentStore?.url),
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
        ? { href: `/category?id=${category.id}` }
        : { onClick: onClick ? handleClick : undefined, role: onClick ? 'button' : undefined, tabIndex: onClick ? 0 : undefined };

    return (
        <ContainerElement
            {...containerProps}
            className={`relative w-20 h-20 p-1.5 rounded-xl transition duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer bg-white shadow-sm border border-gray-200 ${hoverEffect ? 'hover:scale-105 hover:shadow-md hover:border-blue-200 group' : ''}`}
        >
            {/* Bouton/Compteur */}
            <div
                className={`absolute -top-2 -right-2 flex items-center justify-center text-white text-[10px] font-semibold rounded-full shadow z-10 transition-opacity ${
                    onDelete
                    ? 'w-6 h-6 bg-red-500 hover:bg-red-600 cursor-pointer opacity-0 group-hover:opacity-100'
                    : 'min-w-[20px] h-5 px-1.5 bg-blue-500 cursor-default'
                }`}
                onClick={onDelete ? (e: any) => handleDelete(e) : undefined}
                title={onDelete ? t('common.delete') : undefined}
                {...(onDelete ? { type: 'button' } : {})}
            >
                {onDelete ? <IoClose size={14} /> : (productCount ?? '?')}
            </div>

            {/* Image (avec style dynamique) */}
            <div
                className="w-full aspect-square rounded bg-contain bg-center bg-no-repeat mb-1 bg-gray-100" // bg-gray-100 comme fallback
                style={imageStyle} // Appliquer le style backgroundImage
            ></div>

            {/* Nom */}
            <span className="w-full text-xs font-medium text-gray-700 truncate leading-tight" title={category.name}>
                {category.name}
            </span>
        </ContainerElement>
    );
}
// --- Composant Skeleton adapté ---
function CategoryItemSkeletonMini() {
    return (
        <div className="w-20 h-20 p-1.5 rounded-xl bg-gray-200 animate-pulse flex flex-col items-center">
            <div className="w-full aspect-square rounded bg-gray-300 mb-1"></div>
            <div className="w-10/12 h-2 rounded bg-gray-300"></div>
        </div>
    );
}