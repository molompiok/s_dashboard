import { IoChatbubbleEllipsesOutline, IoColorPaletteOutline, IoDocumentTextOutline, IoPricetagsOutline, IoStatsChartOutline, IoStorefrontOutline } from "react-icons/io5";
import { ProductInterface } from "../../api/Interfaces/Interfaces";
import { http, limit } from "../Utils/functions";
import { getDefaultValues } from "../Utils/parseData";
import { getMedia } from "../Utils/StringFormater";
import { navigate } from "vike/client/router";
import { useTranslation } from "react-i18next";
import { useGlobalStore } from "../../api/stores/StoreStore";

interface SEOSettingsProps {
  product: ProductInterface;
}
const SettingsConfig = [
  { 
    name: 'variants', 
    showKey: 'product.step.variants', 
    icon: IoColorPaletteOutline, 
    bgColor: '', 
    borderColor: 'border-cyan-200 dark:border-cyan-800/50',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    iconColor: 'text-cyan-600 dark:text-cyan-400'
  },
  { 
    name: 'price-stock', 
    showKey: 'productSettings.priceStock', 
    icon: IoPricetagsOutline, 
    bgColor: '', 
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  { 
    name: 'details', 
    showKey: 'productSettings.details', 
    icon: IoDocumentTextOutline, 
    bgColor: '', 
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  { 
    name: 'faq', 
    showKey: 'productSettings.faq', 
    icon: IoChatbubbleEllipsesOutline, 
    bgColor: '', 
    borderColor: 'border-green-200 dark:border-green-800/50',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  { 
    name: 'inventory', 
    showKey: 'productSettings.inventory', 
    icon: IoStorefrontOutline, 
    bgColor: '', 
    borderColor: 'border-indigo-200 dark:border-indigo-800/50',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400'
  },
  { 
    name: 'stats', 
    showKey: 'productSettings.stats', 
    icon: IoStatsChartOutline, 
    bgColor: '', 
    borderColor: 'border-sky-200 dark:border-sky-800/50',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400'
  },
  { 
    name: 'comments', 
    showKey: 'productSettings.comments', 
    icon: IoChatbubbleEllipsesOutline, 
    bgColor: '', 
    borderColor: 'border-teal-200 dark:border-teal-800/50',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400'
  },
];


export const SEOSettings: React.FC<SEOSettingsProps> = ({ product }) => {

  const { currentStore } = useGlobalStore()
  const previewImage = getDefaultValues(product)?.[0]?.views?.[0];
  const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  const { t } = useTranslation()

  return (
    <div className="grid overflow-visible md:grid-cols-2 gap-4 items-start">

      {
        SettingsConfig.map(p => {
          const IconComponent = p.icon;
          return (
            <button
              key={p.name}
              onClick={() => {
                if (p.name == 'stats') {
                  navigate(`/stats?product_id=${product.id}`)
                  return
                }
                navigate(`/products/${product.id}/${p.name}`)
              }}
              className={`group flex items-center gap-4 p-4 ${p.bgColor} ${p.borderColor} border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${p.iconBg} flex items-center justify-center transition-all duration-200 group-hover:scale-110`}>
                <IconComponent className={`w-5 h-5 ${p.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 text-left">
                {t(p.showKey)}
              </span>
            </button>
          );
        })
      }

      {/* Aperçu Google */}
      <div className="w-full mt-2 md:mt-0">
        <label className={labelStyle}>Aperçu du résultat Google</label>
        <div className="flex border p-2 mob:p-4 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div
            className="min-w-10 mt-4 h-10 border border-gray-200 dark:border-gray-700 rounded-lg"
            style={{
              background: getMedia({
                isBackground: true,
                from: 'api',
                source: previewImage,
              }),
            }}
          ></div>

          <div className="max-w-[60vw] sx:max-w-[60vw] mob:max-w-full flex-1 p-2 mob:p-4 overflow-hidden">
            <a target="_blank" rel="noopener noreferrer" href={`${http}${currentStore?.default_domain}/${product.slug}`}>
              <h2 className="text-blue-800 dark:text-blue-500 text-base mob:text-lg truncate whitespace-nowrap overflow-hidden text-ellipsis hover:underline cursor-pointer">
                {limit(product.name, 50)}
              </h2>
            </a>
            <p className="text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis text-green-500 dark:text-green-400">
              <a target="_blank" rel="noopener noreferrer" href={`${http}${currentStore?.default_domain}/${product.slug}`}>
                your-store.com/products/{product.slug || product.name?.toLowerCase().replaceAll(' ', '-')}
              </a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

