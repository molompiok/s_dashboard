// Components/Pagination/Pagination.tsx

import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (newPage: number) => void;
    maxVisiblePages?: number; // Nombre max de boutons de page à afficher
}

export function Pagination({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
    maxVisiblePages = 5 // Afficher 5 boutons par défaut (ex: 1 ... 4 5 6 ... 10)
}: PaginationProps) {
    const { t } = useTranslation();

    // --- Logique pour générer les numéros de page visibles ---
    const getPageNumbers = (): (number | '...')[] => {
        if (lastPage <= maxVisiblePages) {
            // Afficher toutes les pages si moins ou égal au max
            return Array.from({ length: lastPage }, (_, i) => i + 1);
        }

        const pages: (number | '...')[] = [];
        const half = Math.floor(maxVisiblePages / 2);
        let startPage: number;
        let endPage: number;

        if (currentPage <= half) {
            // Près du début
            startPage = 1;
            endPage = maxVisiblePages - 1; // Moins la dernière page et '...'
            pages.push(...Array.from({ length: endPage }, (_, i) => i + 1));
            pages.push('...');
            pages.push(lastPage);
        } else if (currentPage + half >= lastPage) {
            // Près de la fin
            startPage = lastPage - (maxVisiblePages - 2); // Moins la première page et '...'
            endPage = lastPage;
            pages.push(1);
            pages.push('...');
            pages.push(...Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i));
        } else {
            // Au milieu
            startPage = currentPage - (half - 1); // Ex: 5 boutons, half=2. current=5 -> start=5-(2-1)=4 -> 4 5 6
            endPage = currentPage + (half -1) ; // Ex: 5 boutons, half=2. current=5 -> end=5+(2-1)=6 -> 4 5 6
            pages.push(1);
            pages.push('...');
            pages.push(...Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i));
            pages.push('...');
            pages.push(lastPage);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();
    const firstItem = (currentPage - 1) * perPage + 1;
    const lastItem = Math.min(currentPage * perPage, total);

    // --- Handlers ---
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < lastPage) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page: number | '...') => {
        if (typeof page === 'number') {
            onPageChange(page);
        }
        // Ne rien faire si clic sur '...'
    };

    // Ne pas rendre si une seule page
    if (lastPage <= 1) {
        return null;
    }

    return (
        // Conteneur principal: flex, justify-between, items-center, padding, border-t
        <nav
            className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6" // mt-6 pour séparer
            aria-label={t('pagination.label')} // 🌍 i18n
        >
            {/* Info sur les éléments affichés (mobile) */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('pagination.previous')} 
                </button>
                <span>{currentPage} / {lastPage}</span>
                <button
                    onClick={handleNext}
                    disabled={currentPage === lastPage}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                     {t('pagination.next')} 
                </button>
            </div>

            {/* Pagination complète (desktop) */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                {/* Info sur les éléments affichés */}
                <div>
                    <p className="text-sm text-gray-700">
                        {/* Utiliser l'interpolation i18n */}
                         {t('pagination.pageInfoFull', { first: firstItem, last: lastItem, total: total })} 
                    </p>
                </div>
                {/* Boutons de pagination */}
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {/* Bouton Précédent */}
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={t('pagination.previous')}
                        >
                            <IoChevronBack className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Numéros de Page */}
                        {pageNumbers.map((page, index) => (
                            typeof page === 'number' ? (
                                <button
                                    key={`page-${page}`}
                                    onClick={() => handlePageClick(page)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        currentPage === page
                                            ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                    }`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ) : (
                                // Ellipsis (...)
                                <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    ...
                                </span>
                            )
                        ))}

                        {/* Bouton Suivant */}
                        <button
                            onClick={handleNext}
                            disabled={currentPage === lastPage}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                             aria-label={t('pagination.next')}
                        >
                            <IoChevronForward className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </nav>
    );
}