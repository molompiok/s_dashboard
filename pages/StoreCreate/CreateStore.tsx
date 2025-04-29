import { IoCheckmarkCircle, IoChevronBack, IoChevronForward, IoCloseCircle, IoWarning } from 'react-icons/io5';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useEffect, useState } from 'react';
import { Swiper as SwiperType } from 'swiper/types';
import { ClientCall, toNameString } from '../../Components/Utils/functions';
import { getImg } from '../../Components/Utils/StringFormater';

import './CreateStore.css'
import 'swiper/css';
import 'swiper/css/navigation';
import { useGlobalStore } from '../stores/StoreStore';

export { CreateStore, StoreCollectedType }

const getMessageIcon = (type: string) => {
    return type === 'ERROR' ? <IoCloseCircle color="red" />
        : type === 'INVALID' ? <IoWarning color="orange" />
            : type === 'VALID' ? <IoCheckmarkCircle color="green" />
                : null;
};

const MessageComponent = ({ message }: { message: { type?: string; message: string } }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} ref={ref => {
        if (!ref) return;
        const d = ref.querySelector('svg')
        if (!d) return;
        d.style.width = '20px';
        d.style.height = '20px';
    }}>
        {message.type && getMessageIcon(message.type)}
        <span>{message.message}</span>
    </div>
);

type StoreCollectedType = {
    name: string,
    logo: (string | File)[],
    cover_image: (string | File)[],
    description: string,
    title: string
}
function CreateStore<T>({ store, onReady, canCancel, onCancel }: { store: Partial<StoreCollectedType>, onReady: (collected: StoreCollectedType) => void, onCancel?: () => void, canCancel: boolean }) {

    // const [index, setIndex] = [0,(i:number)=>0]//useState(0); TODO Optimisation, les cover_image cover_image clignote quant on scroll
    const [index, setIndex] = useState(0);
    const { available_name } = useGlobalStore()
    const [progressIndex, setProgressIndex] = useState(1);
    const [swiper, setSwiper] = useState<SwiperType | null>(null)
    const [message, setMessage] = useState<{
        message: string,
        type?: 'ERROR' | 'VALID' | 'INVALID' | '' | undefined
    }>({
        message: '',
        type: 'ERROR' as 'ERROR' | 'VALID' | 'INVALID' | '' | undefined
    });
    const [isValidName, setValidName] = useState(false);
    const [collected, setCollected] = useState<StoreCollectedType>({
        name: 'ladona_1',
        logo: [] as (string | File)[],
        cover_image: [] as (string | File)[],
        description: 'ladona_description',
        title: 'ladona_title',
        ...store
    })

    let logoImg = typeof collected.logo[0] == 'string'
        ? collected.logo[0] :
        collected.logo[0] instanceof Blob ?
            URL.createObjectURL(collected.logo[0]) : '/res/empty/drag-and-drop.png'

    let cover_imageImg = typeof collected.cover_image[0] == 'string'
        ? collected.cover_image[0] :

        collected.cover_image[0] instanceof Blob ?
            URL.createObjectURL(collected.cover_image[0]) : '/res/empty/drag-and-drop.png'

    // console.log({ logoImg }, typeof collected.logo[0]);

    const AddLogo = () => <div className="card-preview-logo">
        <label htmlFor='store-logo-input' className="logo" style={{
            background: getImg(logoImg, '150%')
        }}>
            <input id='store-logo-input' style={{ display: 'none' }} type="file" accept='cover_image/*' onChange={(e) => {
                const icon = e.currentTarget.files?.[0]
                if (!icon) return
                console.log({ icon });
                setProgressIndex(index + 1);
                setCollected({
                    ...collected,
                    logo: [icon]
                })
            }} />
        </label>
        <div className="name ellipsis">{collected.name}</div>

    </div>

    const [s] = useState({
        collected,
        name_id_time: 0 as any,
        lastName: '',
    });
    s.collected = collected
    useEffect(() => {
        if (index == 0) {
            const id = setInterval(async () => {
                console.log(s.lastName);

                if (s.lastName == s.collected.name) return
                s.lastName = s.collected.name
                const v = !!(await available_name(s.collected.name))?.is_availableble_name;
                setValidName(v);
                console.log(s.collected.name, v);
                if (v) {
                    setMessage({ type: 'VALID', message: 'Ce Nom est disponible' });
                    setProgressIndex(index + 1);
                } else {
                    setMessage({ type: 'INVALID', message: `Ce Nom n'est pas disponible` })
                    setProgressIndex(index);
                }
            }, 100);
            s.name_id_time = id
        } else {
            clearInterval(s.name_id_time)
        }

        if (index == 0) {
            ClientCall(() => {
                setTimeout(() => {
                    (document.querySelector('#input-store-name') as any)?.focus()
                }, 500);
            })
        }
        if (index == 3) {
            ClientCall(() => {
                setTimeout(() => {
                    (document.querySelector('#input-store-title') as any)?.focus()
                }, 500);
            })
        }
        return () => {
            clearInterval(s.name_id_time)
        }
    }, [index])
32
    return <>
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
            className={`s-${index}`}
        >
            <SwiperSlide className='name'>
                <p>Choisez le nom de votre boutique</p>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <input type="text" autoFocus className={isValidName ? 'valid-name' : 'invalid-name'} id={'input-store-name'} value={collected.name || ''} placeholder="Name" onChange={(e) => {
                        const name = e.currentTarget.value

                        if (name.trim().length < 3) setMessage({ type: 'ERROR', message: 'Le nom doit contenir plus de 3 lettres' })

                        setCollected({
                            ...collected,
                            ['name']: toNameString(name).substring(0, 32),
                        })
                    }} onKeyUp={(e) => {
                        if (e.code == 'Enter') {
                            swiper?.slideTo(index + 1)
                        }
                    }} onKeyDown={(e) => {
                        if (e.code == 'Tab') {
                            e.stopPropagation();
                            e.preventDefault();
                            swiper?.slideTo(index + 1)
                        }
                    }} />
                    <span style={{ marginLeft: 'auto' }}>{collected.name.length} / 32</span>
                </div>

                {
                    <div style={{ height: '1em', marginTop: '24px' }} className="inupt-store-message">
                        {message.message && <MessageComponent message={message} />}
                    </div>
                }
            </SwiperSlide>
            <SwiperSlide>
                Ajoutez le Logo de votre boutique
                <div className="indicator-logo" style={{ background: getImg('/res/indictors/indicator_top_left_bottom_left.png') }}></div>
                <AddLogo />
            </SwiperSlide>
            <SwiperSlide>
                <div className="card-preview-cover_image">
                    {collected.cover_image?.[0] ? null : <label htmlFor='store-cover_image-input' style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        Ajoutez 'cover_image de couverture
                        <div className="indicator-cover_image" style={{ background: getImg('/res/indictors/indicator_top_left_bottom_left.png') }}></div>
                    </label>}
                    <label htmlFor='store-cover_image-input' className="cover_image" style={{
                        background: getImg(cover_imageImg, collected.cover_image[0] ? 'cover' : 'contain')
                    }}>
                        <input id='store-cover_image-input' style={{ display: 'none' }} type="file" accept='cover_image/*' onChange={(e) => {
                            const icon = e.currentTarget.files
                            if (!icon) return
                            console.log({ icon });
                            setProgressIndex(index + 1);
                            setCollected({
                                ...collected,
                                cover_image: [icon[0]]
                            })
                        }} />
                    </label>
                    <AddLogo />
                </div>
            </SwiperSlide>
            <SwiperSlide>
                <div className="description">
                    <span>Titre de la boutique</span>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <input type="text" id={'input-store-title'} value={collected.title || ''} placeholder="Titre" onChange={(e) => {
                            const title = e.currentTarget.value

                            if (collected.description && collected.title) setProgressIndex(index + 1);

                            setCollected({
                                ...collected,
                                ['title']: toNameString(title).substring(0, 52),
                            })
                        }} onKeyUp={(e) => {
                            if (e.code == 'Enter') {
                                const p = e.currentTarget.parentNode?.querySelector('#input-store-description') as HTMLInputElement | null;
                                p && p.focus()
                            }
                        }} onKeyDown={(e) => {
                            if (e.code == 'Tab') {
                                e.stopPropagation();
                                e.preventDefault();
                                const p = e.currentTarget.parentNode?.querySelector('#input-store-description') as HTMLInputElement | null;
                                p && p.focus()
                            }
                        }} />
                        <span style={{ marginLeft: 'auto' }}>{collected.title.length} / 52</span>
                    </div>

                    <span>Description de la boutique </span>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <input type="text" id={'input-store-description'} value={collected.description || ''} placeholder="Description" onChange={(e) => {
                            const description = e.currentTarget.value

                            if (collected.description && collected.title) setProgressIndex(index + 1);

                            setCollected({
                                ...collected,
                                ['description']: toNameString(description).substring(0, 128),
                            })
                        }} onKeyUp={(e) => {
                            if (e.code == 'Enter') {

                            }
                        }} onKeyDown={(e) => {
                            if (e.code == 'Tab') {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }} />
                        <span style={{ marginLeft: 'auto' }}>{collected.description.length} / 128</span>
                    </div>

                    <div className="google-result">
                        <div className="google" style={{ background: getImg('/res/Google.png') }}></div>
                        <div className="google-indicator" style={{ background: getImg('/res/indictors/indicator_top_left_bottom_left.png') }}></div>
                    </div>
                    <div className="card">
                        <div className="top">
                            <div className="logo" style={{ background: getImg(logoImg, collected.logo?.[0] ? undefined : '150%') }}></div>
                            <div>
                                <h3>{collected.name}</h3>
                                <p>{`https://${collected.name}.sublymus.com`}</p>
                            </div>
                        </div>
                        <h2 className='ellipsis'>{collected.title}</h2>
                        <p>{collected.description.substring(0, 100) + (collected.description.length > 100 ? '...' : '')}</p>
                    </div>
                </div>
            </SwiperSlide>
        </Swiper>
        <div className="direction">
            <div className={`back no-selectable ${index == 0 && !canCancel ? 'none' : ''}`} onClick={() => {
                index > 0 && swiper?.slideTo(index - 1);
                index == 0 && onCancel?.()
            }}><IoChevronBack />{canCancel && index == 0 ? 'Annuler' : 'Retour'}</div>
            <div className={`next no-selectable ${index < progressIndex ? 'active' : ''}`} onClick={() => {
                index < progressIndex ?
                    swiper?.slideTo(index + 1) :
                    swiper?.slideTo(progressIndex);
                console.log({ progressIndex, collected, index });

                if (progressIndex > 3) {
                    if (!collected.name || !isValidName) return swiper?.slideTo(0)
                    if (!collected.logo?.[0]) return swiper?.slideTo(1)
                    if (!collected.cover_image?.[0]) return swiper?.slideTo(2)
                    if (!collected.title) return swiper?.slideTo(3)
                    if (!collected.description) return swiper?.slideTo(3)
                    onReady(collected)
                }
            }}>Suivant<IoChevronForward /></div>
        </div>

    </>
}