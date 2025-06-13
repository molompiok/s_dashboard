import React from 'react';

// Définition des variantes pour contrôler le style
type StateDisplayVariant = 'info' | 'success' | 'warning' | 'danger';

interface StateDisplayProps {
  icon: React.ElementType;
  title: string;
  description: string;
  variant?: StateDisplayVariant;
  children?: React.ReactNode; // Pour le bouton d'action (CTA)
}

// Map pour les styles, facile à étendre
const variantStyles: Record<StateDisplayVariant, { bg: string; icon: string; }> = {
  info: {
    bg: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
    icon: 'text-gray-400 dark:text-gray-500',
  },
  success: {
    bg: 'from-emerald-100 to-teal-200 dark:from-emerald-800/50 dark:to-teal-700/50',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
  warning: {
    bg: 'from-amber-100 to-orange-200 dark:from-amber-800/50 dark:to-orange-700/50',
    icon: 'text-amber-500 dark:text-amber-400',
  },
  danger: {
    bg: 'from-red-100 to-rose-200 dark:from-red-800/50 dark:to-rose-700/50',
    icon: 'text-red-500 dark:text-red-400',
  },
};

export function StateDisplay({
  icon: Icon,
  title,
  description,
  variant = 'info',
  children,
}: StateDisplayProps) {

  const styles = variantStyles[variant];

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full">
      {/* Icône avec fond gradient */}
      <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${styles.bg} rounded-3xl shadow-lg mb-6`}>
        <Icon className={`w-10 h-10 ${styles.icon}`} />
      </div>

      {/* Titre */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>

      {/* Bouton d'action (CTA) s'il est fourni */}
      {children && (
        <div className="cta-container">
          {children}
        </div>
      )}
    </div>
  );
}