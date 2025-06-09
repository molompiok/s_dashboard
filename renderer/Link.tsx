// Link.tsx - Composant Link amélioré pour Sublymus
import React from 'react';
import { usePageContext } from './usePageContext';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  activeIcon?: React.ReactNode;
  defaultIcon?: React.ReactNode;
  add?: string[];
  className?: string;
}

export function Link({ href, children, activeIcon, defaultIcon, add = [], className = '' }: LinkProps) {
  const { urlPathname } = usePageContext();
  
  // Vérifier si le lien est actif
  const isActive = urlPathname === href || add.some(path => urlPathname.startsWith(path));
  
  // Classes de base pour les liens
  const baseClasses = `
    group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium 
    rounded-xl transition-all duration-300 ease-out
    hover:scale-[1.02] active:scale-[0.98]
  `;
  
  // Classes pour l'état actif
  const activeClasses = `
    bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/40 dark:to-blue-900/40
    text-emerald-600 dark:text-emerald-400 shadow-sm
    border border-emerald-200/50 dark:border-emerald-700/50
  `;
  
  // Classes pour l'état inactif
  const inactiveClasses = `
    text-gray-700 dark:text-gray-300
    hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50
    dark:hover:from-gray-800/50 dark:hover:to-gray-800/50
    hover:text-gray-900 dark:hover:text-gray-100
  `;
  
  const linkClasses = `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${className}`;
  
  return (
    <a href={href} className={linkClasses}>
      {/* Indicateur actif à gauche */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-r-full" />
      )}
      
      {/* Icône */}
      <div className={`
        flex-shrink-0 transition-transform duration-300
        ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}
        group-hover:scale-110
      `}>
        {isActive && activeIcon ? activeIcon : defaultIcon}
      </div>
      
      {/* Texte du lien */}
      <span className="flex-1 truncate">
        {children}
      </span>
      
      {/* Effet de brillance au survol */}
      <div className={`
        absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
        bg-gradient-to-r from-transparent via-white/10 to-transparent
        transform translate-x-[-100%] group-hover:translate-x-[100%]
        transition-all duration-700 ease-out pointer-events-none
      `} />
    </a>
  );
}

// Composant Link spécialisé pour la bottom bar mobile
export function BottomBarLink({ href, activeIcon, defaultIcon, add = [] }: Omit<LinkProps, 'children'>) {
  const { urlPathname } = usePageContext();
  const isActive = urlPathname === href || add.some(path => urlPathname.startsWith(path));
  
  return (
    <a
      href={href}
      className={`
        flex flex-col items-center justify-center p-2 rounded-xl
        transition-all duration-300 ease-out min-w-[60px]
        ${isActive 
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
        hover:scale-105 active:scale-95
      `}
    >
      <div className={`
        transition-all duration-300
        ${isActive ? 'scale-110' : 'group-hover:scale-105'}
      `}>
        {isActive && activeIcon ? activeIcon : defaultIcon}
      </div>
      
      {/* Indicateur actif */}
      {isActive && (
        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1 animate-pulse" />
      )}
    </a>
  );
}