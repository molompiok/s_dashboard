import { JSX } from 'react';
import { IoCloseSharp } from "react-icons/io5";
import { useChildViewer } from './useChildViewer';

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
  const { openChild } = useChildViewer();

  return (
    <div className="w-[95%] max-w-[750px] max-h-[80%] relative bg-white rounded-2xl overflow-y-auto overflow-x-hidden">
      <div className="w-full flex items-center px-3 py-1.5">
        <div className="ml-auto w-[25px] h-[25px] cursor-pointer transition-all duration-100 hover:scale-110 hover:bg-discret-9 rounded-full flex items-center justify-center">
          <IoCloseSharp
            className="w-full h-full"
            onClick={() => openChild(null)}
          />
        </div>
        <h3 className="ml-3 text-base font-medium">{title}</h3>
      </div>
      <div className="w-full h-full" style={style}>
        {children}
      </div>
    </div>
  );
}
