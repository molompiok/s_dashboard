import { Swiper } from 'swiper/react';
import { useWindowSize } from '../../Hooks/useWindowSize';
import { Grid, Pagination } from 'swiper/modules';
import { SwiperSlide } from 'swiper/react';

import './ThemeList.css'
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';
import { ThemeItem } from '../ThemeItem/ThemeItem';
import { IoChevronForward } from 'react-icons/io5';

export {ThemeList, RecentThemes}


function ThemeList({ store }: { store: any }) {
    const l = 9;
    const h = 240;
    const s = useWindowSize().width;
    const n = s <= 550 ? (s - 250) / 300 + 1
      : s < 750 && s >= 550 ? 2
        : s < 900 && s >= 750 ? (s - 750) / 150 + 2
          : 3
  
    return <>
      <h2>Tout les Themes <span style={{ display: true ? '' : 'none' }}>
        {<IoChevronForward className='icon-25' />}
        </span></h2>
      <Swiper
        slidesPerView={n}
        grid={{
          rows: l > 5 ? 2 : 1,
        }}
        spaceBetween={30}
        pagination={{
          clickable: true,
        }}
        modules={[Grid, Pagination]}
        className="preview-themes no-selectable"
        style={{ height: l > 5 ? h * 2 : h }}
      >
        {
          Array.from({ length: l }).map((_, i) => (
            <SwiperSlide>
              <ThemeItem theme={0} />
            </SwiperSlide>
          ))
        }
      </Swiper>
  
    </>
  }
  function RecentThemes({ store }: { store: any }) {
    const l = 9;
    const h = 240;
    const s = useWindowSize().width;
    const n = s <= 550 ? (s - 250) / 300 + 1
      : s < 750 && s >= 550 ? 2
        : s < 900 && s >= 750 ? (s - 750) / 150 + 2
          : 3
  
    return <>
      <h2>List des Themes Recement Utilise </h2>
      <Swiper
        slidesPerView={n}
        grid={{
          rows: l > 12 ? 2 : 1,
        }}
        spaceBetween={30}
        pagination={{
          clickable: true,
        }}
        modules={[Grid, Pagination]}
        className="recent-used-themes no-selectable"
        style={{ height: l > 12 ? h * 2 : h }}
      >
        {
          Array.from({ length: l }).map((_, i) => (
            <SwiperSlide>
              <ThemeItem theme={0} />
            </SwiperSlide>
          ))
        }
      </Swiper>
    </>
  }
  