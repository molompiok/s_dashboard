// renderer/Link.tsx
import { JSX, ReactNode } from 'react'; // Importer ReactNode
import { usePageContext } from './usePageContext';

export { Link };

type Props = {
  href: string;
  className?: string; // Classes Tailwind additionnelles
  children?: ReactNode; // Utiliser ReactNode pour le contenu
  activeIcon?: JSX.Element;
  defaultIcon?: JSX.Element;
}

function Link({ href, activeIcon, children, className = '', defaultIcon }: Props) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
  const isActive = href === '/' ? urlPathname === href : urlPathname.startsWith(href);

  // Définir les classes de base et les classes actives/inactives Tailwind
  const baseClasses = "flex items-center gap-3 px-2.5 py-1.5 rounded-lg transition-colors duration-150 ease-in-out"; // Augmenter gap et padding
  const inactiveClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const activeClasses = "bg-blue-100/60 text-blue-700 font-medium"; // Utiliser bleu pour l'état actif

  // Combiner les classes
  const combinedClassName = `
    ${baseClasses}
    ${isActive ? activeClasses : inactiveClasses}
    ${className} {/* Permettre classes additionnelles */}
  `.trim(); // trim() pour enlever espaces superflus

  const icon = isActive ? activeIcon : defaultIcon;

  return (
    <a href={href} className={combinedClassName}>
      {icon && <span className="flex-shrink-0 w-5 h-5">{icon}</span>} {/* Icône avec taille définie */}
      {children && <span className="truncate">{children}</span>} {/* Span pour le texte, truncate si long */}
    </a>
  );
}