import { getMedia } from '../Utils/StringFormater';

import './FeatureTypes.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { Grid, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';
import { FeatureType } from '../Utils/functions';
import { useTranslation } from 'react-i18next';

import {
  Text as TextIcon,
  Image as IconIcon,
  BadgePlus as IconTextIcon,
  Palette as ColorIcon,
} from 'lucide-react';

export { FeatureTypes };

const Types = [
  { name: FeatureType.TEXT, Icon: TextIcon, showKey: 'featureTypes.text' },
  { name: FeatureType.ICON, Icon: IconIcon, showKey: 'featureTypes.icon' },
  { name: FeatureType.ICON_TEXT, Icon: IconTextIcon, showKey: 'featureTypes.icon_text' },
  { name: FeatureType.COLOR, Icon: ColorIcon, showKey: 'featureTypes.color' },
];

function FeatureTypes({ className, onSelected, active }: { active?: string, onSelected: (type: string) => void, className?: string }) {
  const { t } = useTranslation();
  const s = useWindowSize().width;
  const n = s <= 700 ? ((s - 260) / 120) + 1.5 : 5.17;

  return (
    <Swiper
      slidesPerView={n}
      grid={{ rows: 2 }}
      spaceBetween={15}
      pagination={{ clickable: true }}
      modules={[Grid, Pagination]}
      style={{ overflow: 'visible' }}
      className={`list-type mb-6 w-full h-[220px] ${className}`}
    >
      {Types.map(typeInfo => (
        <SwiperSlide key={typeInfo.name}>
          <div
            className={`no-select flex flex-col items-center w-full h-full gap-3 sm:gap-4 rounded-xl cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out border
              ${active === typeInfo.name
                ? 'bg-teal-100 dark:bg-teal-900 border-teal-300 dark:border-teal-600 ring-1 ring-teal-400 dark:ring-teal-500'
                : 'bg-white dark:bg-gray-600/60 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            onClick={() => onSelected(typeInfo.name)}
          >
            <div className="min-w-[100px] w-[100px] h-[100px] rounded-md flex items-center justify-center ">
              <typeInfo.Icon className="w-12 h-12 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="name text-gray-800 dark:text-gray-200 font-medium">{t(typeInfo.showKey)}</div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
