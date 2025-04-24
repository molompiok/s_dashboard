//Components/FeatureTypes/FeatureTypes.tsx
import { getImg } from '../Utils/StringFormater';

import './FeatureTypes.css'

import { Swiper, SwiperSlide } from 'swiper/react'
import { useWindowSize } from '../../Hooks/useWindowSize';
import { Grid, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/grid';

export { FeatureTypes }

const Types = [{
    name:'text',
    url:'/res/Google__G__logo.svg.webp',
    show:'Text'
},
{
    name:'icon',
    url:'/res/Google__G__logo.svg.webp',
    show:'Icon'
},
{
    name:'icon_text',
    url:'/res/Google__G__logo.svg.webp',
    show:'Icon et Text'
},
{
    name:'color',
    url:'/res/Google__G__logo.svg.webp',
    show:'Couleur'
},
{
    name:'date',
    url:'/res/Google__G__logo.svg.webp',
    show:'Date'
},
{
    name:'date_double',
    url:'/res/Google__G__logo.svg.webp',
    show:'Intervale de Date'
},
{
    name:'slide',
    url:'/res/Google__G__logo.svg.webp',
    show:'Niveau'
},
{
    name:'slide_double',
    url:'/res/Google__G__logo.svg.webp',
    show:'Interval'
},
{
    name:'input',
    url:'/res/Google__G__logo.svg.webp',
    show:'Saisie de Text'
},
]

function FeatureTypes({ className, onSelected, active }: { active?: string, onSelected: (type: string) => void, className?: string }) {


    const s = useWindowSize().width;
    const n = s <= 580 ? ((s - 220) / 360) + 1
        : 2;
    
    return <Swiper
    slidesPerView={n}
    grid={{
        rows: 2,
        // fill: 'row'
    }}
    spaceBetween={s<400 ?15:30}
    pagination={{
        clickable: true,
    }}
    modules={[Grid, Pagination]}
    className={'list-type '+className}
    style={{height:'200px'}}
>   
        {
            Types.map(t=>(
                <SwiperSlide key={t.name}>
                <div className={` no-selectable type-option ${active == t.name ? 'active' : ''}`} onClick={() => {
                    onSelected(t.name)
                }}>
                    <div className="icon-60 preview-type" style={{ background: getImg(t.url) }}></div>
                    <div className="name">{t.show}</div>
                </div>
                </SwiperSlide>
            ))
        }  
</Swiper>
}
