import './TopSearch.css'

import 'swiper/css';
import 'swiper/css/free-mode';

import { useEffect, useState } from 'react'
import { CategoryInterface, CommandInterface, FilterType, ProductInterface } from '../../Interfaces/Interfaces'
import { useStore } from '../../pages/stores/StoreStore'
import { useApp, type GlobalSearchType } from '../../renderer/AppStore/UseApp'
import { CategoryItemMini } from '../CategoryItem/CategoryItemMini'
import { IoSearch } from 'react-icons/io5'
import { getImg } from '../Utils/StringFormater'
import { ProductItemCard } from '../ProductItem/ProductItemCard'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'
import { useWindowSize } from '../../Hooks/useWindowSize';
import { useChildViewer } from '../ChildViewer/useChildViewer';

export { TopSearch }

function TopSearch({ onClientSelected, onProductSelected, onCategorySelected, onCommandSelected }: { onCommandSelected?: (cammand: CommandInterface) => void, onCategorySelected?: (category: CategoryInterface) => void, onProductSelected?: (product: ProductInterface) => void, onClientSelected?: (client: any) => void }) {
    const { gobalSearch } = useApp()
    const { openChild } = useChildViewer()
    const { currentStore } = useStore()
    const [filter, setFilter] = useState<FilterType>({});
    const [data, setData] = useState<GlobalSearchType>({
        products: [],
        clients: [],
        commands: [],
        categories: [],
    })
    useEffect(() => {
        filter.search && currentStore && gobalSearch({
            text: filter.search || ''
        }).then((res) => {
            setData(res)
        });
    }, [currentStore, filter]);

    const s = useWindowSize().width;
    const n = s <= 580 ? ((s - 260) / 160) + 1.6
        : 3.4
    const p = s < 480 ? 0 : 0;

    console.log(n);

    return <div className="top-search">
        <div className="row" style={{
            width: '100%',
            justifyContent: 'center'
        }}>
            <label htmlFor="icon-text-name-input" className='label-icon-right'>
                <input
                    className={"editor"}
                    placeholder="Nom, description, #id"
                    id="icon-text-name-input"
                    type="text"
                    autoFocus
                    value={filter.search || ''}
                    onChange={(e) => {
                        const search = e.currentTarget.value;
                        setFilter((prev) => ({ ...prev, search }));
                    }}
                />
                <IoSearch />
            </label>
        </div>
        {
            (data.categories?.length || 0) > 0 &&
            <>
                <h3>Categories</h3>
                <Swiper
                    slidesPerView={n * 1.3}
                    spaceBetween={p}
                    freeMode={true}
                    pagination={{
                        clickable: true,
                    }}
                    modules={[FreeMode]}
                    style={{ width: `${s < 550 ? s : 550}px`, height: 'auto' }}
                    className="search-categories list no-selectable"
                >
                    {
                        data.categories?.map((c, i) =>
                            c && <SwiperSlide>
                                <CategoryItemMini key={c.id} openCategory={true} category={c} onClick={() => {
                                    openChild(null);
                                    onCategorySelected?.(c);
                                }} />
                            </SwiperSlide>
                        )
                    }

                </Swiper>
            </>
        }
        {
            (data.products?.length || 0) > 0 && <>

                <h3>Produits</h3>
                <Swiper
                    slidesPerView={n}
                    spaceBetween={p}
                    freeMode={true}
                    pagination={{
                        clickable: true,
                    }}
                    modules={[FreeMode]}

                    style={{ width: `${s < 550 ? s : 550}px`, height: 'auto' }}
                    className="products list">
                    {
                        data.products?.map((p, i) =>
                            p && <SwiperSlide>
                                <ProductItemCard key={p.id} product={p} onClick={() => {
                                    console.log(p);
                                    onProductSelected?.(p)
                                    openChild(null);
                                }} />
                            </SwiperSlide>
                        )
                    }
                </Swiper>
            </>
        }
        {
            (
                (data.categories?.length) == 0 &&
                (data.clients?.length) == 0 &&
                (data.commands?.length) == 0 &&
                (data.products?.length) == 0
            ) && (
                <div className="icon-160" style={{ margin: '0px auto', background: getImg('/res/empty/search.png') }}></div>
            )
        }
    </div >
}