import { usePageContext } from './usePageContext'
type IconsName = 'A'|'B'|'C'
export { Link }

type Props = { 
  href: string; 
  className?: string; 
  children: React.ReactNode
  icon?:IconsName
 }
function Link(props:Props ) {
  const pageContext = usePageContext()
  const { urlPathname } = pageContext
  const { href } = props
  const isActive = href === '/' ? urlPathname === href : urlPathname.startsWith(href)
  const className = [props.className, isActive && 'is-active'].filter(Boolean).join(' ')
  return <a {...props} className={className} />
}
