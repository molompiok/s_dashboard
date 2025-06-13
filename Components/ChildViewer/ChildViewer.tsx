import { JSX } from 'react'
import { IoCloseSharp } from "react-icons/io5"
import { useChildViewer } from './useChildViewer'

export function ChildViewer({
  children,
  title,
  style,
  back
}: {
  back?: boolean,
  title?: string,
  children?: JSX.Element,
  style?: React.CSSProperties
}) {
  const { openChild } = useChildViewer()

  return (
    <div
      className="child-viewer fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && openChild(null)}
    >
      <div className="w-full max-w-[750px] max-h-[80%] relative bg-white dark:bg-gray-800 rounded-2xl overflow-y-auto overflow-x-hidden shadow-lg">
        <div className="sticky top-0 z-10 justify-between flex items-center px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 print:hidden">
          <div  className="min-w-5 h-5"></div>
          <h3 className="mx-auto text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button
            onClick={() => openChild(null)}
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center transition hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <IoCloseSharp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
        <div className="w-full h-full text-gray-800 dark:text-gray-100" style={style}>
          {children}
        </div>
      </div>
    </div>
  )
}
