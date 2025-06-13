// Components/Pagination/Pagination.tsx

import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (newPage: number) => void;
    maxVisiblePages?: number;
}

export function Pagination({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
    maxVisiblePages = 5,
}: PaginationProps) {
    const { t } = useTranslation();

    const getPageNumbers = (): (number | '...')[] => {
        if (lastPage <= maxVisiblePages) {
            return Array.from({ length: lastPage }, (_, i) => i + 1);
        }
        const pages: (number | '...')[] = [];
        const half = Math.floor((maxVisiblePages - 2) / 2); // -2 for first and last page
        
        if (currentPage <= half + 1) {
            const range = Array.from({ length: maxVisiblePages - 2 }, (_, i) => i + 1);
            pages.push(...range, '...', lastPage);
        } else if (currentPage >= lastPage - half) {
            const startPage = lastPage - (maxVisiblePages - 2) + 1;
            const range = Array.from({ length: maxVisiblePages - 2 }, (_, i) => startPage + i);
            pages.push(1, '...', ...range);
        } else {
            const startPage = currentPage - half;
            const range = Array.from({ length: maxVisiblePages - 2 }, (_, i) => startPage + i);
            pages.push(1, '...', ...range, '...', lastPage);
        }
        return pages;
    };

    const pageNumbers = getPageNumbers();
    const firstItem = (currentPage - 1) * perPage + 1;
    const lastItem = Math.min(currentPage * perPage, total);

    if (lastPage <= 1) return null;

    // 🎨 Définition des styles de boutons pour la réutilisabilité
    const baseButtonStyle = "relative inline-flex items-center text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500/80 focus:ring-offset-2 dark:focus:ring-offset-gray-900";
    const navButtonStyle = `${baseButtonStyle} px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/70 rounded-lg`;
    const pageButtonStyle = `${baseButtonStyle} px-4 py-2 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/50 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/70`;
    const activePageButtonStyle = `z-10 !bg-teal-500/10 dark:!bg-teal-500/20 !text-teal-600 dark:!text-teal-300 !ring-teal-500/50 dark:!ring-teal-500/60`;
    const arrowButtonStyle = `relative inline-flex items-center px-2 py-2 text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/50 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/70 focus:z-20 ${baseButtonStyle}`;

    return (
        // 🎨 Conteneur principal avec fond transparent et bordure adaptée au mode nuit
        <nav
            className="flex items-center justify-between border-t border-gray-200/80 dark:border-white/10 px-4 py-3 sm:px-6 mt-6"
            aria-label={t('pagination.label')}
        >
            {/* --- Pagination Mobile --- */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={navButtonStyle}>
                    {t('pagination.previous')}
                </button>
                <div className="flex items-center px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {currentPage} / {lastPage}
                </div>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === lastPage} className={navButtonStyle}>
                    {t('pagination.next')}
                </button>
            </div>

            {/* --- Pagination Desktop --- */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                        {t('pagination.pageInfoFull', { first: firstItem, last: lastItem, total })}
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
                        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${arrowButtonStyle} rounded-l-md`} aria-label={t('pagination.previous')}>
                            <IoChevronBack className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {pageNumbers.map((page, index) =>
                            typeof page === 'number' ? (
                                <button
                                    key={`page-${page}`}
                                    onClick={() => onPageChange(page)}
                                    className={`${pageButtonStyle} ${currentPage === page ? activePageButtonStyle : ''}`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-500 bg-white/80 dark:bg-gray-800/50 ring-1 ring-inset ring-gray-300 dark:ring-gray-700">
                                    …
                                </span>
                            )
                        )}

                        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === lastPage} className={`${arrowButtonStyle} rounded-r-md`} aria-label={t('pagination.next')}>
                            <IoChevronForward className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </nav>
    );
}