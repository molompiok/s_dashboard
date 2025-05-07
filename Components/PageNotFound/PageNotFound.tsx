import { IoChevronBack, IoHomeOutline, IoWarning } from "react-icons/io5"
import { JSX } from "react"

export { PageNotFound }

function PageNotFound({
  title = "Page Introuvable",
  description = "Désolé, la page que vous cherchez n'existe pas ou a été déplacée.",
  back = true,
  forward = "Retour à l'accueil",
  url = "/",
  iconForwardAfter = null,
  iconForwardBefore = <IoHomeOutline className="w-6 h-6" />,
}: {
  iconForwardAfter?: JSX.Element | null
  iconForwardBefore?: JSX.Element | null
  url?: string
  forward?: string
  back?: boolean
  description?: string
  title?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
      <div className="relative flex items-center justify-center w-48 h-48 mb-6">
        <div className="absolute w-full h-full bg-blue-100 rounded-full opacity-30"></div>
        <IoWarning className="w-32 h-32 text-blue-600 z-10" />
      </div>

      <h2 className="text-3xl font-semibold text-gray-800 mb-4 text-center max-w-md">
        {title}
      </h2>

      <p className="text-gray-600 text-center max-w-md mb-8">
        {description}
      </p>

      <div className="flex items-center gap-6">
        {back && (
          <button
            type="button"
            onClick={() => history.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <IoChevronBack className="w-5 h-5" />
            <span className="text-lg">Retour</span>
          </button>
        )}

        <a
          href={url}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
        >
          {iconForwardBefore}
          <span className="text-lg">{forward}</span>
          {iconForwardAfter}
        </a>
      </div>
    </div>
  )
}