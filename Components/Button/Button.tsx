import { JSX } from 'react'
// import './Button.css'
import { IoChevronForward } from 'react-icons/io5'

export {Button}

function Button({
  forward,
  icon,
  title,
  isVertical,
  justifyContent,
  onClick,
  style,
  iconCtnStyle,
  className
}: {
  className?:string,
  style?: React.CSSProperties | undefined,
  onClick?: () => void,
  title?: string,
  icon?: JSX.Element,
  iconCtnStyle?: React.CSSProperties | undefined,
  forward?: JSX.Element | null,
  isVertical?: boolean,
  justifyContent?: 'center' | 'space-around' | 'space-between' | 'space-evenly' | 'flex-end' | 'flex-start'
}) {

  return <div className={`button ${isVertical ? 'vertical' : ''} ${className||''}`} style={{ justifyContent, ...style }} onClick={onClick}>
    {
      icon && <div className="icon" style={iconCtnStyle}>
        {icon}
      </div>
    }
    {title && <span>{title}</span>}
    {forward !== null && (
      forward == undefined ? <IoChevronForward className='right' /> :
        <div className="right" style={{ display: 'inline-block' }}>{forward}</div>
    )}
  </div>
}
