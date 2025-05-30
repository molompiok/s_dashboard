//Components/FeatureTypes/FeatureTypes.tsx
import { getMedia } from '../Utils/StringFormater';

import './FeatureTypes.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useWindowSize } from '../../Hooks/useWindowSize';
import { Grid, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';
import { FeatureType } from '../Utils/functions';
import { useTranslation } from 'react-i18next';

export { FeatureTypes }

const Types = [
  { name: FeatureType.TEXT, url: '/res/feature-types/text.svg', showKey: 'featureTypes.text' }, // Utiliser clés i18n
  { name: FeatureType.ICON, url: '/res/feature-types/icon.svg', showKey: 'featureTypes.icon' },
  { name: FeatureType.ICON_TEXT, url: '/res/feature-types/icon_text.svg', showKey: 'featureTypes.icon_text' },
  { name: FeatureType.COLOR, url: '/res/feature-types/color.svg', showKey: 'featureTypes.color' },
  // { name: FeatureType.DATE, url: '/res/feature-types/date.svg', showKey: 'featureTypes.date' },
  // { name: FeatureType.DOUBLE_DATE, url: '/res/feature-types/date_double.svg', showKey: 'featureTypes.date_double' }, // Note: Renommé date_double?
  // { name: FeatureType.LEVEL, url: '/res/feature-types/level.svg', showKey: 'featureTypes.level' },
  // { name: FeatureType.RANGE, url: '/res/feature-types/range.svg', showKey: 'featureTypes.range' }, // Note: Renommé range?
  // { name: FeatureType.INPUT, url: '/res/feature-types/input.svg', showKey: 'featureTypes.input' },
  // { name: FeatureType.FILE, url: '/res/feature-types/file.svg', showKey: 'featureTypes.file' },
];


function FeatureTypes({ className, onSelected, active }: { active?: string, onSelected: (type: string) => void, className?: string }) {

  const { t } = useTranslation();
  const s = useWindowSize().width;
  const n = s <= 580 ? ((s - 220) / 360) + 1
    : 2;

  return <Swiper
    slidesPerView={n}
    grid={{
      rows: 2,
    }}
    spaceBetween={15}
    pagination={{
      clickable: true,
    }}
    modules={[Grid, Pagination]}
    style={{
      overflow: 'visible'
    }}
    className={`list-type mb-6 w-full h-[220px] ${className}`}
  >
    {
      Types.map(typeInfo => (
        <SwiperSlide key={typeInfo.name}>
          <div
            className={`no-select flex items-center w-full h-full gap-3 sm:gap-4 rounded-xl cursor-pointer p-2 sm:p-3 transition duration-200 ease-in-out border ${active === typeInfo.name
                ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-400' // Style actif
                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300' // Style normal
              }`}
            onClick={() => onSelected(typeInfo.name)}
          >
            <div
              className="min-w-[100px] w-[100px] h-[100px]"
              style={{ background: getMedia({isBackground:true,source:typeInfo.url}) }}
            ></div>
            <div className="name">{t(typeInfo.showKey)}</div>
          </div>
        </SwiperSlide>
      ))
    }
  </Swiper>
}
