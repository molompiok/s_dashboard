import { IoApertureSharp, IoChatbubbleEllipsesOutline, IoDocumentTextOutline, IoPricetagsOutline, IoStatsChartOutline } from "react-icons/io5";
import { ProductInterface } from "../../api/Interfaces/Interfaces";
import { Button } from "../Button/Button";
import { limit } from "../Utils/functions";
import { getDefaultValues } from "../Utils/parseData";
import { getMedia } from "../Utils/StringFormater";
import { navigate } from "vike/client/router";
import { useTranslation } from "react-i18next";

interface SEOSettingsProps {
  product: ProductInterface;
}
const SettingsConfig = [
    { name: 'price-stock', showKey: 'productSettings.priceStock', icon: <IoPricetagsOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-green-600 border-green-200 hover:bg-green-50 hover:shadow-green-100' },
    { name: 'details', showKey: 'productSettings.details', icon: <IoDocumentTextOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:shadow-gray-100' },
    { name: 'faq', showKey: 'productSettings.faq', icon: <IoChatbubbleEllipsesOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-orange-600 border-orange-200 hover:bg-orange-50 hover:shadow-orange-100' },
    // { name: 'promo', showKey: 'productSettings.promo', icon: <IoMegaphoneOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-orange-600 border-orange-200 hover:bg-orange-50 hover:shadow-orange-100' },
    // { name: 'inventory', showKey: 'productSettings.inventory', icon: <IoStorefrontOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:shadow-indigo-100' },
    // { name: 'affiliation', showKey: 'productSettings.affiliation', icon: <IoGitNetworkOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-purple-600 border-purple-200 hover:bg-purple-50 hover:shadow-purple-100' },
    { name: 'stats', showKey: 'productSettings.stats', icon: <IoStatsChartOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-sky-600 border-sky-200 hover:bg-sky-50 hover:shadow-sky-100' },
    { name: 'comments', showKey: 'productSettings.comments', icon: <IoChatbubbleEllipsesOutline className="min-w-5 h-5 dark:text-white/80"/>, colorClasses: 'text-amber-600 border-amber-200 hover:bg-amber-50 hover:shadow-amber-100' },
  ];


export const SEOSettings: React.FC<SEOSettingsProps> = ({ product }) => {
  console.log('SEOSettings -- product',product);
  
  const previewImage = getDefaultValues(product)?.[0]?.views?.[0];
  const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  const {t }= useTranslation() 

  return (
    <div className="grid overflow-hidden md:grid-cols-2 gap-4 items-start">
      
      {
        SettingsConfig.map(p=>(
          <Button key={p.name} icon={p.icon} title={t(p.showKey)}
          className="gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-gray-200 shadow-sm py-4  dark:hover:bg-white/10 border-gray/10 dark:border-white/10"
          onClick={()=>{
            if(p.name=='stats'){
              navigate(`/stats?product_id=${product.id}`)  
              return
            }
            navigate(`/products/${product.id}/${p.name}`)
            
          }}/>
        ))
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
            <h2 className="text-blue-800 dark:text-blue-500 text-base mob:text-lg truncate whitespace-nowrap overflow-hidden text-ellipsis hover:underline cursor-pointer">
              {limit(product.name, 50)}
            </h2>
            <p className="text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis text-green-500 dark:text-green-400">
              your-store.com/products/{product.slug || product.name?.toLowerCase().replaceAll(' ', '-')}
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

