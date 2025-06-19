import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

import { useState } from 'react';
import { IoCloseSharp } from 'react-icons/io5';
import { useWindowSize } from '../../Hooks/useWindowSize';

const Gallery = ({defaultIndex, media, onClose }: {defaultIndex?:number, onClose: () => void, media: { type: 'image' | 'video', src: string }[] }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
    const s = useWindowSize();
    const n = (s.width ) / 80  
    return (
        <div className="relative galley-swiper w-full m-auto" onClick={(e) => {
            if (e.currentTarget == e.target) {
                onClose();
            }
        }}>
            <button
                onClick={onClose}
                className="absolute  z-10 top-8 right-8 w-[32px] h-[32px] rounded-full flex items-center justify-center transition hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                <IoCloseSharp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            {/* Main slider */}
            <Swiper
                spaceBetween={10}
                navigation
                thumbs={{ swiper: thumbsSwiper }}
                modules={[Navigation, Thumbs]}
                className="rounded-xl"
                initialSlide={defaultIndex||0}
                style={{
                    maxHeight: '100vh',
                    maxWidth: '100vw'
                }}
            >
                {media.map((item, index) => (
                    <SwiperSlide key={index} style={{
                        maxHeight: 'calc(100vh - 100px)',
                        maxWidth: '100vw'
                    }} className='flex' >
                        {item.type === 'image' ? (
                            <img src={item.src} alt={`Slide ${index}`} className="w-full object-cover rounded-xl" />
                        ) : (
                            <video src={item.src} controls className="w-full m-auto rounded-xl" style={{
                                maxHeight: 'calc(100vh - 100px)',
                                maxWidth: 'calc(100vw - 5%)'
                            }} />
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Thumbnails */}
            <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={10}
                slidesPerView={5}
                watchSlidesProgress
                modules={[Thumbs]}
                className="mt-4"
                style={{
                    maxWidth: 'calc(100vw - 5%)'
                }}
            >
                {media.map((item, index) => (
                    <SwiperSlide key={index}>
                        {item.type === 'image' ? (
                            <img src={item.src} alt={`Thumb ${index}`} className="w-full h-16 object-cover rounded-md" />
                        ) : (
                            <video src={item.src} className="w-full h-16 object-cover rounded-md" />
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default Gallery;
