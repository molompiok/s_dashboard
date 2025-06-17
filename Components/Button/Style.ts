// Components/Button/Style.ts

// Style principal pour les boutons d'action
export const buttonStyle = `
    group relative inline-flex items-center gap-2 px-6 py-2.5
    bg-gradient-to-r from-emerald-500 to-teal-500 
    hover:from-emerald-600 hover:to-teal-600
    dark:from-emerald-600 dark:to-teal-600
    dark:hover:from-emerald-500 dark:hover:to-teal-500
    text-white font-semibold rounded-xl shadow-lg 
    hover:shadow-xl hover:shadow-emerald-500/25 dark:hover:shadow-emerald-400/25
    transform hover:scale-[1.02] active:scale-[0.98]
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    cursor-pointer select-none
`;

// Style secondaire pour les boutons moins importants
export const buttonSecondaryStyle = `
    group relative inline-flex items-center gap-2 px-5 py-2
    bg-white dark:bg-gray-800 
    border border-gray-300 dark:border-gray-600
    hover:border-gray-400 dark:hover:border-gray-500
    text-gray-700 dark:text-gray-200 font-medium rounded-lg shadow-sm 
    hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700
    transform hover:scale-[1.01] active:scale-[0.99]
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    cursor-pointer select-none
`;

// Style destructif pour les actions de suppression
export const buttonDangerStyle = `
    group relative inline-flex items-center gap-2 px-5 py-2
    bg-gradient-to-r from-red-500 to-rose-500 
    hover:from-red-600 hover:to-rose-600
    dark:from-red-600 dark:to-rose-600
    dark:hover:from-red-500 dark:hover:to-rose-500
    text-white font-medium rounded-lg shadow-lg 
    hover:shadow-xl hover:shadow-red-500/25 dark:hover:shadow-red-400/25
    transform hover:scale-[1.02] active:scale-[0.98]
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    cursor-pointer select-none
`;

// Style fantôme pour les boutons discrets
export const buttonGhostStyle = `
    group relative inline-flex items-center gap-2 px-4 py-2
    text-gray-600 dark:text-gray-300 font-medium rounded-lg
    hover:bg-gray-100 dark:hover:bg-gray-800
    hover:text-gray-900 dark:hover:text-white
    transform hover:scale-[1.01] active:scale-[0.99]
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    cursor-pointer select-none
`;

// Style pour les petits boutons d'icône
export const buttonIconStyle = `
    group relative inline-flex items-center justify-center w-10 h-10
    bg-white dark:bg-gray-800 
    border border-gray-300 dark:border-gray-600
    hover:border-gray-400 dark:hover:border-gray-500
    text-gray-600 dark:text-gray-300 rounded-lg shadow-sm 
    hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700
    hover:text-gray-900 dark:hover:text-white
    transform hover:scale-[1.05] active:scale-[0.95]
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    cursor-pointer select-none
`;

// Style pour les boutons de navigation/pagination
export const buttonNavStyle = `
    group relative inline-flex items-center gap-2 px-4 py-2
    bg-white dark:bg-gray-800 
    border border-gray-300 dark:border-gray-600
    hover:border-emerald-400 dark:hover:border-emerald-500
    text-gray-700 dark:text-gray-200 font-medium rounded-lg shadow-sm 
    hover:shadow-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20
    hover:text-emerald-700 dark:hover:text-emerald-300
    transform hover:scale-[1.01] active:scale-[0.99]
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    cursor-pointer select-none
`;

export const  cardStyle = ' bg-white/80 dark:bg-white/5 backdrop-blur-lg rounded-lg shadow-sm border border-gray-200/80 dark:border-white/10 p-2 mob:p-4 sm:p-6 ' 

// Classes utilitaires pour les états des boutons
export const buttonStateClasses = {
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    loading: 'opacity-75 cursor-wait',
    active: 'ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-2 dark:ring-offset-gray-900',
};

// Helper pour combiner les styles avec les états
export const getButtonStyle = (
    baseStyle: string, 
    states?: { disabled?: boolean; loading?: boolean; active?: boolean }
) => {
    let combinedStyle = baseStyle;
    
    if (states?.disabled) combinedStyle += ` ${buttonStateClasses.disabled}`;
    if (states?.loading) combinedStyle += ` ${buttonStateClasses.loading}`;
    if (states?.active) combinedStyle += ` ${buttonStateClasses.active}`;
    
    return combinedStyle;
};