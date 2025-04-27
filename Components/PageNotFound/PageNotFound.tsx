import { IoChevronBack, IoHomeOutline } from "react-icons/io5"
import { getImg } from "../Utils/StringFormater"
import { JSX } from "react"

export { PageNotFound }

function PageNotFound({
  title,
  description,
  image = '/res/empty/search.png',
  back,
  forward,
  url,
  iconForwardAfter,
  iconForwardBefore,
}: {
  iconForwardAfter?: JSX.Element | null
  iconForwardBefore?: JSX.Element | null
  url?: string
  forward?: string
  back?: boolean
  description?: string
  title?: string
  image?: string
}) {

  return (
    <div className="flex flex-col items-center justify-center w-full gap-3">
      <div
        className="w-48 h-48 bg-center bg-no-repeat bg-contain"
        style={{ background: getImg(image) }}
      ></div>

      {title && (
        <h2 className="px-3 text-center max-w-[360px]">{title}</h2>
      )}

      {description && (
        <p className="text-center max-w-[360px]">{description}</p>
      )}

      <div className="flex items-center gap-6 mt-3">
        {back && (
          <button
            type="button"
            onClick={() => history.back()}
            className="flex items-center gap-2 cursor-pointer text-blue-600 underline"
          >
            <IoChevronBack className="w-6 h-6" />
            Retour
          </button>
        )}

        <a
          href={url || (!forward ? '/' : undefined)}
          className="flex items-center gap-2 cursor-pointer text-blue-600 underline"
        >
          {iconForwardBefore === null ? null : iconForwardBefore || (
            <IoHomeOutline className="w-6 h-6" />
          )}
          {forward || "Page d'accueil"}
          {iconForwardAfter}
        </a>
      </div>
    </div>
  )
}
