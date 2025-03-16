import { IoCheckmarkCircle, IoChevronBack, IoChevronForward, IoCloseCircle, IoWarning } from 'react-icons/io5';
import './StoreCreate.css'

import 'swiper/css';
import 'swiper/css/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Topbar } from '../../Components/TopBar/TopBar';
import { useApp } from '../../renderer/Stores/UseApp';
import { useState } from 'react';
import { Swiper as SwiperType } from 'swiper/types';
import { ClientCall } from '../../Components/Utils/functions';
import { getImg } from '../../Components/Utils/StringFormater';

export { StoreCreate }

const MAX_STEP = 3;
const getMessageIcon = (type: string) => {
    return type === 'ERROR' ? <IoCloseCircle color="red" />
         : type === 'INVALID' ? <IoWarning color="orange" />
         : type === 'VALID' ? <IoCheckmarkCircle color="green" />
         : null;
  };
  const MessageComponent = ({ message }: { message: { type?: string; message: string } }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} ref={ref=>{
        if(!ref) return ;
        const d = ref.querySelector('svg')
        if(!d) return;
        d.style.width = '20px';
        d.style.height = '20px';
    }}>
      {message.type && getMessageIcon(message.type)}
      <span>{message.message}</span>
    </div>
  );
function StoreCreate() {

    const { openChild } = useApp();
    const [index, setIndex] = useState(0);
    const [progressIndex, setProgressIndex] = useState(1);
    const [swiper, setSwiper] = useState<SwiperType | null>(null)
    const [message, setMessage] = useState<{
        message:string,
        type?:'ERROR'|'VALID'|'INVALID'|''|undefined
    }>({
        message:'',
        type:'ERROR' as 'ERROR'|'VALID'|'INVALID'|''|undefined
    });
    const [isValidName, setValidName] = useState(false);
    const [collected, setCollected] = useState({
        name: '',
        logo: null as (string | File | null),
        image: null as (string | File | null),
        description: '',
        email: ''
    })

    const isValid = (name: string) => true;
    return <div className="store-create">
        <Topbar search={false} notif={false} />
        <div className="ctn">
            <h1>Cree votre boutique en ligne</h1>
            <div className="progress-store no-selectable">
                <div className={index >= 0 ? 'active' : ''} onClick={() => progressIndex >= 0 && swiper?.slideTo(0)}>Nom</div>
                <span className={index >= 0 ? 'active' : ''}></span>
                <div className={index >= 1 ? 'active' : ''} onClick={() => progressIndex >= 1 && swiper?.slideTo(1)}>Logo</div>
                <span className={index >= 1 ? 'active' : ''}></span>
                <div className={index >= 2 ? 'active' : ''} onClick={() => progressIndex >= 2 && swiper?.slideTo(2)}>Image</div>
                <span className={index >= 2 ? 'active' : ''}></span>
                <div className={index >= 3 ? 'active' : ''} onClick={() => progressIndex >= 3 && swiper?.slideTo(3)}>Infos</div>
            </div>
            <Swiper
                onSwiper={(s) => setSwiper(s)}
                onActiveIndexChange={(_swiper) => {
                    setIndex(_swiper.activeIndex);
                }}
            >
                <SwiperSlide className='name'>
                    <p>Choisez le nom de votre boutique</p>
                    <div className="div">
                        <input type="text" className={isValidName ? 'valid-name' : 'invalid-name'} id={'input-store-name'} value={collected.name || ''} placeholder="Name" onChange={(e) => {
                            const name = e.currentTarget.value
                            console.log(name);

                            if (name.trim().length < 3) setMessage({type:'ERROR',message:'Le nom doit contenir plus de 3 lettres'})
                            else {
                                const v = ClientCall(Math.random, 0) < 0.5;
                                setValidName(v);
                                if(v) {
                                    setMessage({type:'VALID',message:'Ce Nom est disponible'});
                                    setProgressIndex(index+1);
                                }else{
                                    setMessage({type:'INVALID',message:`Ce Nom n'est pas disponible`})
                                    setProgressIndex(index);
                                }
                            }

                            setCollected({
                                ...collected,
                                ['name']: name
                            })
                        }} onKeyUp={(e) => {
                            if (e.code == 'Enter') {

                            }
                        }} onKeyDown={(e) => {
                            if (e.code == 'Tab') {

                            }
                        }} />
                    </div>
                        {
                            <div style={{height:'1em',marginTop:'24px'}} className="inupt-store-message">
                                {message.message && <MessageComponent message={message}/>}
                            </div>
                        }
                </SwiperSlide>
                <SwiperSlide>
                    Ajoutez le Logo de votre boutique 
                    <div className="indicator-logo"></div>
                    <div className="card-preview-logo">
                        <div className="logo" style={{background:getImg('/res/store_img_4.png')}}></div>
                        <div className="name ellipsis">{collected.name}</div>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    {/* informations */}
                    Choiser le nom de votre boutique

                </SwiperSlide>
                <SwiperSlide>
                    {/* congratulation */}
                    Choiser le nom de votre boutique
                </SwiperSlide>
            </Swiper>
            <div className="direction">
                <div className={`back no-selectable ${index==0?'none':''}`} onClick={() => index > 0 && swiper?.slideTo(index - 1)}><IoChevronBack />Retour</div>
                <div className={`next no-selectable ${index < progressIndex ? 'active' : ''}`} onClick={() => index < progressIndex ? swiper?.slideTo(index + 1) : swiper?.slideTo(progressIndex)}>Suivant<IoChevronForward /></div>
            </div>
        </div>
    </div>
}
