import { IoChevronDown, IoChevronForward, IoFilterSharp } from 'react-icons/io5'
import { useApp } from '../../renderer/AppStore/UseApp'
import { ChildViewer } from '../ChildViewer/ChildViewer'
import './CommandesList.css'
import { CommandItem } from '../CommandItem/CommandItem'
import { CommandFilterType, CommandInterface, FilterType } from '../../Interfaces/Interfaces'
import { useEffect, useState } from 'react'
import { OrderStatusElement, statusColors, statusIcons } from '../Status/Satus'

import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ClientCall, debounce } from '../Utils/functions'
export { CommandeList }
import { FiMaximize } from 'react-icons/fi';
import { getImg } from '../Utils/StringFormater'
import { useCommandStore } from '../../pages/commands/CommandStore'
import {  getTransmit, useStore } from '../../pages/stores/StoreStore'

/*
    const [dates,setDates] = useState< "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined>();
    const [order,setOrder] = useState<(keyof typeof statusIcons)[] | undefined>();
    const [status,setStatus] = useState<[string | undefined, string | undefined] | undefined>();
    const [prices,setPrices] = useState< [number | undefined, number | undefined] | undefined>();
    
*/


function CommandeList({ product_id }: { product_id?: string }) {
    const [filter, setFilter] = useState<CommandFilterType>({});
    const { getCommands } = useCommandStore()
    const { currentStore} = useStore();
    const [commands, setCommands] = useState<CommandInterface[]>([])

    const [s] = useState({
        isUpdated: true,
    });

    useEffect(() => {
        const fechCmd = ()=>{
            debounce(() => {
                const d = filter.max_date ? new Date(filter.max_date) : undefined;
                d?.setDate(d.getDate() + 1);
                getCommands({
                    ...filter,
                    max_date: d && d.toISOString()
                }).then(res => {
                    s.isUpdated = false;
                    if (!res?.list) return
                    setCommands(res.list);
                });
            }, 'filter-command', 300)
        }
        currentStore && s.isUpdated && filter && fechCmd()

        if (!currentStore) return

        const transmit = getTransmit(currentStore.url)
        console.log(currentStore.id);
        
        // const subscription = transmit?.subscription(`store/${currentStore.id}/new_command`)
        const subscription = transmit?.subscription(`store/${'d3d8dfcf-b84b-49ed-976d-9889e79e6306'}/new_command`)

        async function subscribe() {
            if(!subscription) return
            await subscription.create()
            subscription.onMessage<{ update: string }>((data)=>{
                console.log(`@@@@@@@@@@@@@@@@@@@  ${JSON.stringify(data)} @@@@@@@@@@@@@@@@@@@`);
                fechCmd()
            })
        }

        subscribe().catch(console.error)

        return () => {
            subscription?.delete() // 🔴 Ferme la connexion à l'ancien store lorsqu'on change
        }

    }, [currentStore, filter])

    const accuDate: string[] = []
    const getDate = (date: string) => {
        const d = new Date(date).toLocaleDateString('fr', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        return d
    }

    return <div className="commands-list">
        <div className="top">
            <h2>List des Commandes</h2>
            {!ClientCall(() => location, { pathname: '' }).pathname.startsWith('/commands') && <a className='filter' href='/commands'>
                Tout voir <IoChevronForward className='filter-icon' onClick={() => {
                }} />
            </a>}
        </div>
        <CommandsFilters filter={filter} setFilter={(filter) => {
            s.isUpdated = true;
            setFilter(filter)
        }} />
        <div className="list">
            {
                commands.length == 0 && <div className="column-center"><div className="empty" style={{ background: getImg('/res/empty/search.png') }}></div>Aucune Command Trouve</div>
            }
            {commands.map((a, i) => {
                const d = getDate(a.created_at);

                const inner = accuDate.includes(d)
                !inner && accuDate.push(d)
                const h = !inner && <h2 className='date'>{d}</h2>
                return <div key={a.id}>
                    {!filter.order_by?.includes('price') && h}
                    <a href={`/commands/${a.id}`}>
                        <CommandItem key={a.id} command={a} onClick={() => 0} />
                    </a>
                </div>
            })}
        </div>
    </div>
}

function CommandsFilters({ filter, setFilter }: { filter: CommandFilterType, setFilter: (filter: CommandFilterType) => any }) {

    const [currentFilter, setCurrentFilter] = useState('');
    console.log('currentFilter', currentFilter);

    return <div className="filters no-selectable">
        <div className="onglet">
            <div className={`status-filter ${currentFilter == 'status' ? 'active' : ''} ${filter.status ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'status' ? '' : 'status');
            }}><span>Status</span> <IoChevronDown /></div>
            <div className={`order-filter ${currentFilter == 'order' ? 'active' : ''} ${filter.order_by ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'order' ? '' : 'order');
            }}><span>Ordre</span> <IoChevronDown /></div>
            <div className={`price-filter ${currentFilter == 'price' ? 'active' : ''} ${filter.max_price || filter.min_price ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'price' ? '' : 'price');
            }}><span>Prix</span> <IoChevronDown /></div>
            <div className={`date-filter ${currentFilter == 'date' ? 'active' : ''} ${filter.min_date || filter.max_date ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'date' ? '' : 'date');
            }}><span>Date</span> <IoChevronDown /></div>
        </div>
        <div className="chose">
            <StatusFilterComponent active={currentFilter == 'status'} status={filter.status} setStatus={(status) => {
                setFilter({
                    ...filter,
                    status
                })
            }} />
            <OrderFilterComponent active={currentFilter == 'order'} order={filter.order_by} setOrder={(order_by) => {
                setFilter({
                    ...filter,
                    order_by
                })
            }} />
            <PriceFilterComponent active={currentFilter == 'price'} prices={[filter.min_price, filter.max_price]} setPrice={(price) => {
                setFilter({
                    ...filter,
                    min_price: price?.[0],
                    max_price: price?.[1],
                })
            }} />
            <DateFilterComponent date={[filter.min_date, filter.max_date]} setDate={(date) => {
                setFilter({
                    ...filter,
                    min_date: date?.[0],
                    max_date: date?.[1]
                })
            }} active={currentFilter == 'date'} />
        </div>
    </div>
}

function StatusFilterComponent({ status: _status, setStatus, active }: { active: boolean, status: string[] | undefined, setStatus: (status: string[] | undefined) => void }) {
    const status = _status || []
    return <div className={`status-filter-component ${active ? 'active' : ''}`}>
        {
            Object.keys(statusColors).map(s => (
                <span key={s} onClick={() => {
                    const list = status.includes(s) ?
                        status.filter(f => f != s) :
                        [...status, s]

                    setStatus(list.length > 0 ? list : undefined)
                }}><OrderStatusElement background={status.includes(s) ? undefined : 'var(--discret-9)'} color={status.includes(s) ? undefined : 'var(--discret-1)'} status={s as any} /></span>
            ))
        }
    </div>
}

export function OrderFilterComponent({ order: _order, setOrder, active }: { active: boolean, order: string | undefined, setOrder: (order: CommandFilterType['order_by'] | undefined) => void }) {
    const order = _order
    const MapOder = {
        'date_desc': 'Plus Recent',
        'date_asc': 'Plus Ancien',
        'total_price_desc': 'Prix Haut',
        'total_price_asc': 'Prix Bas'
    }

    return <div className={`order-filter-component ${active ? 'active' : ''}`}>
        {
            (["date_desc", "date_asc", "total_price_desc", "total_price_asc"] as const).map(o => (
                <span key={o} className={o == order ? 'order' : ''} onClick={() => {
                    setOrder(order == o ? undefined : o);
                }}>
                    {MapOder[o]}
                </span>
            ))
        }
    </div>
}

export function PriceFilterComponent({ prices, setPrice, active }: { active: boolean, prices: [number | undefined, number | undefined] | undefined, setPrice: (price: [number | undefined, number | undefined] | undefined) => void }) {

    return <div className={`price-filter-component ${active ? 'active' : ''}`}>
        <label htmlFor="command-filter-min-price">
            <span>Prix Minimum</span>
            <input type="number" id="command-filter-min-price" value={prices?.[0] || ''} placeholder={'Prix Minimum'} onChange={(e) => {
                let minPrice = parseInt(e.currentTarget.value) as number | undefined
                minPrice = Number.isNaN(minPrice) ? undefined : minPrice
                const p = [minPrice, prices?.[1]] as [number | undefined, number | undefined] | undefined
                setPrice(p)
            }} />
        </label>
        <label htmlFor="command-filter-max-price">
            <span>Prix Maximum</span>
            <input type="number" id="command-filter-max-price" value={prices?.[1] || ''} placeholder={'Prix Maximum'} onChange={(e) => {
                let maxPrice = parseInt(e.currentTarget.value) as number | undefined;
                maxPrice = Number.isNaN(maxPrice) ? undefined : maxPrice
                const p = [prices?.[0], maxPrice] as [number | undefined, number | undefined] | undefined
                setPrice(p)
            }} />
        </label>
        <div className="reset" style={{ width: '500px' }}>
            <span className={prices && (prices?.[0] != undefined || prices?.[1] != undefined) ? 'ok' : ''} onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('clicke-clear');
                setPrice(undefined)
            }}>Annuler les modifications</span>
        </div>
    </div>
}

export function DateFilterComponent({ date, setDate, active }: { active: boolean, date: [string | undefined, string | undefined,] | undefined, setDate: (date: [string | undefined, string | undefined,] | undefined) => void }) {
    const currentDate = ClientCall(Date.now, 0)
    const [selected, setSelected] = useState<DateRange | undefined>(date && { from: new Date(date[0] || date[1] || currentDate), to: new Date(date[1] || date[0] || currentDate) });
    const [marge, setMarge] = useState('')


    const MapMargeName = {
        '3_days': '3 jours',
        '7_days': '7 jours',
        '1_month': '1 mois',
        'all': 'Tout'
    }
    const MapMarge = {
        '3_days': [ClientCall(() => new Date(currentDate - 3 * 24 * 60 * 60 * 1000).toISOString()), ClientCall(() => new Date(currentDate).toISOString())],
        '7_days': [ClientCall(() => new Date(currentDate - 7 * 24 * 60 * 60 * 1000).toISOString()), ClientCall(() => new Date(currentDate).toISOString())],
        '1_month': [ClientCall(() => new Date(currentDate - 30 * 24 * 60 * 60 * 1000).toISOString()), ClientCall(() => new Date(currentDate).toISOString())],
        'all': undefined
    }

    return (
        <div className={`date-filter-component ${active ? 'active' : ''}`}>
            <div className="dates">
                {
                    (['3_days', '7_days', '1_month', 'all'] as const).map(d => (
                        <span key={d} className={(d == marge || (date == undefined && d == 'all')) ? 'marge' : ''} onClick={() => {
                            setMarge(d == marge ? '' : d);
                            setDate(MapMarge[d] as any);
                            setSelected(d == 'all' ? undefined : { from: new Date(MapMarge[d]?.[0] || currentDate), to: new Date(MapMarge[d]?.[1] || currentDate) })
                        }}>{MapMargeName[d]}</span>
                    ))
                }
            </div>
            <DayPicker
                captionLayout="dropdown"
                defaultMonth={new Date()}
                startMonth={new Date(2025, 2)}
                endMonth={new Date()}
                animate
                mode="range"
                selected={selected}
                onSelect={(d) => {
                    setSelected(d);
                    console.log(d);
                    setDate([d?.from?.toISOString(), d?.to?.toISOString()]);
                    setMarge('')
                }}
                styles={{
                    selected: {
                        color: '#345'
                    }
                }}
            />
        </div>
    );
}