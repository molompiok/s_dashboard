//renderer/Link.tsx
import { JSX } from 'react';
import { usePageContext } from './usePageContext'
export { Link }

type Props = { 
  href: string; 
  className?: string; 
  children?: React.ReactNode
  activeIcon?:JSX.Element
  defaultIcon?:JSX.Element
 }
function Link({href,activeIcon,children,className,defaultIcon}:Props ) {
  const pageContext = usePageContext()
  const { urlPathname } = pageContext
  const isActive = href === '/' ? urlPathname === href : urlPathname.startsWith(href)
  const _className = [className, isActive && 'is-active'].filter(Boolean).join(' ')
  const icon = isActive ?activeIcon: defaultIcon;
  return <a href={href} className={_className} >
    {icon}
    <span>{children}</span>
  </a>
}
