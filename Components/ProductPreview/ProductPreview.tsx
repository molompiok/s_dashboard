import { getDefaultValues } from "../Utils/parseData"
import { ProductInterface } from "../../api/Interfaces/Interfaces"
import { useGlobalStore } from "../../api/stores/StoreStore"
import { getMedia } from "../Utils/StringFormater"
import { getFileType, limit, shortNumber } from "../Utils/functions"
import { markdownToPlainText } from "../MarkdownViewer/MarkdownViewer"
import { IoPeopleSharp, IoPricetag, IoStarHalf } from "react-icons/io5"
import { useState } from "react"
import { NO_PICTURE } from "../Utils/constants"
import { useTranslation } from "react-i18next"
import { cardStyle } from "../Button/Style"

export function ProductPreview({ product }: { product: Partial<ProductInterface> }) {
  const { t } = useTranslation()
  const [imgError, setImgError] = useState(false)
  const values = getDefaultValues(product)
  const view = values[0]?.views?.[0]
  const src = getMedia({ source: view || '', from: 'api' })
  const fileType = getFileType(view || '')
  const isVideo = fileType === 'video'
  const displaySrc = imgError || !view ? NO_PICTURE : src

  return (
    <a
      href={`/products/${product.id}`}
      className={" sx2:flex group relative block rounded-xl overflow-hidden transition gap-2 p-3 sm:p-4 "+cardStyle}
    >
      <div className="w-full min-w-[220px] max-w-[420px] flex justify-center  items-center  h-auto max-h-[160px] aspect-video rounded-lg overflow-hidden">
        {!imgError ? (
          isVideo ? (
            <video
              src={displaySrc}
              muted
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src={displaySrc}
              alt={product.name || ''}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full min-w-[220px] max-w-[420px]  h-auto aspect-video object-cover transition group-hover:scale-105"
            />
          )
        ) : (
          <img
            src={NO_PICTURE}
            alt={t("common.imageError")}
            className="w-full max-w-[420px] h-full object-contain opacity-40 p-4"
          />
        )}
      </div>

      <div className="flex flex-wrap">
        <div className="mt-3 space-y-1">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-800 dark:text-neutral-100 truncate">
            {limit(product?.name, 56)}
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 truncate">
            {limit(markdownToPlainText(product?.description || ''), 56)}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
          <h3 className="flex items-center gap-1 font-medium">
            <IoPricetag className="opacity-80" />
            {product.price?.toLocaleString('fr')} {product.currency}
          </h3>
          <div className="flex items-center gap-3 text-xs sm:text-sm opacity-90">
            <span className="flex items-center gap-1">
              <IoStarHalf className="text-yellow-400" />
              {product.rating || 0}
            </span>
            <span className="flex items-center gap-1">
              <IoPeopleSharp />
              {shortNumber(product.comment_count || 0)}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
