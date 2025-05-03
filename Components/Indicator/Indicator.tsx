import { IoHelp } from 'react-icons/io5'
import { useWindowSize } from '../../Hooks/useWindowSize'
import { useEffect, useRef, useState } from 'react'

export function Indicator({
  title,
  description,
  style,
  className = '',
}: {
  style?: React.CSSProperties
  className?: string
  title: string
  description?: string
}) {
  const size = useWindowSize()
  const infoRef = useRef<HTMLDivElement>(null)
  const [tx, setTx] = useState(0)

  useEffect(() => {
    if (!infoRef.current) return
    const bubbleRect = infoRef.current.getBoundingClientRect()
    const container = document.querySelector('#page-content')
    if (!container) return
    const contRect = container.getBoundingClientRect()

    let delta = 0
    // si la bulle dépasse à gauche
    if (bubbleRect.left < contRect.left) {
      delta = contRect.left - bubbleRect.left + 4
    }
    // si elle dépasse à droite
    else if (bubbleRect.right > contRect.right) {
      delta = contRect.right - bubbleRect.right - 4
    }

    setTx(delta)
  }, [size, infoRef])

  return (
    <span
      style={style}
      className={`relative inline-flex items-center group ${className}`}
    >
      {/* Icône */}
      <IoHelp className="w-6 h-6 p-1 bg-gray-100 rounded-full text-gray-600" />

      {/* Bulle d’infos */}
      <div
        ref={infoRef}
        style={{
          transform: `translateX(calc(-50% + ${tx}px)) translateY(0.5rem)`,
        }}
        className={`
          absolute left-1/2 z-50 flex flex-col
          max-w-[260px] w-[90vw] sm:w-[240px]
          bg-white shadow-lg rounded-xl p-4
          opacity-0 invisible pointer-events-none
          group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
          transition-all duration-200 ease-in-out
        `}
      >
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>
    </span>
  )
}
