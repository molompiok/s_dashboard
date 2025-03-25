import { IoChevronDown, IoChevronForward, IoFilterSharp } from 'react-icons/io5'
import { useApp } from '../../renderer/AppStore/UseApp'
import { ChildViewer } from '../ChildViewer/ChildViewer'
import './CommandesList.css'
import { CommandItem } from '../CommandItem/CommandItem'
import { CommandInterface } from '../../Interfaces/Interfaces'
import { useState } from 'react'
import { OrderStatusElement, statusColors, statusIcons } from '../Status/Satus'

import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ClientCall } from '../Utils/functions'
export { CommandeList }
import { FiMaximize } from 'react-icons/fi';
import { getImg } from '../Utils/StringFormater'

type CollectedType = {
    order?: "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined;
    status?: (keyof typeof statusIcons)[] | undefined;
    dates?: [string | undefined, string | undefined] | undefined;
    prices?: [number | undefined, number | undefined] | undefined;
};

/*

    const [dates,setDates] = useState< "date_desc" | "date_asc" | "price_desc" | "price_asc" | undefined>();
    const [order,setOrder] = useState<(keyof typeof statusIcons)[] | undefined>();
    const [status,setStatus] = useState<[string | undefined, string | undefined] | undefined>();
    const [prices,setPrices] = useState< [number | undefined, number | undefined] | undefined>();
    
*/


function CommandeList({product_id}:{product_id?:string}) {
    const [collected, setCollected] = useState<CollectedType>({});
    const commands = Array.from({ length: 12 });
    return <div className="commands-list">
        <div className="top">
            <h2>List des Commandes</h2>
            {!ClientCall(() => location, { pathname: '' }).pathname.startsWith('/commands') && <a className='filter' href='/commands'>
                Tout voir <IoChevronForward className='filter-icon' onClick={() => {
                }} />
            </a>}
        </div>
        <CommandsFilters collected={collected} setCollected={setCollected} />
        <div className="list">
            
            {
                commands.length == 0 &&  <div className="column-center"><div className="empty" style={{background:getImg('/res/empty/search.png')}}></div>Aucune Command Trouve</div>
            } 
            {commands.map((a, i) => (
                <div key={i}>
                    {
                        i % 5 == 0 && <h2>{new Date().toLocaleDateString('fr', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}</h2>
                    }
                    <a  href={`/commands/${ClientCall(Math.random, 0)}`}>
                        <CommandItem key={i} command={{} as CommandInterface} onClick={() => 0} />
                    </a>
                </div>
            ))}
        </div>
    </div>
}

function CommandsFilters({ collected, setCollected }: { collected: any, setCollected: (collected: any) => any }) {

    const [currentFilter, setCurrentFilter] = useState('');

    return <div className="commands-filters no-selectable">
        <div className="onglet">
            <div className={`status-filter ${currentFilter == 'status' ? 'active' : ''} ${collected.status ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'status' ? '' : 'status');
            }}><span>Status</span> <IoChevronDown /></div>
            <div className={`order-filter ${currentFilter == 'order' ? 'active' : ''} ${collected.order ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'order' ? '' : 'order');
            }}><span>Ordre</span> <IoChevronDown /></div>
            <div className={`price-filter ${currentFilter == 'price' ? 'active' : ''} ${collected.price ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'price' ? '' : 'price');
            }}><span>Prix</span> <IoChevronDown /></div>
            <div className={`date-filter ${currentFilter == 'date' ? 'active' : ''} ${collected.date ? 'collected' : ''}`} onClick={() => {
                setCurrentFilter(currentFilter == 'date' ? '' : 'date');
            }}><span>Date</span> <IoChevronDown /></div>
        </div>
        <div className="chose">
            <StatusFilterComponent active={currentFilter == 'status'} status={collected.status} setStatus={(status) => {
                setCollected({
                    ...collected,
                    status
                })
            }} />
            <OrderFilterComponent active={currentFilter == 'order'} order={collected.order} setOrder={(order) => {
                setCollected({
                    ...collected,
                    order
                })
            }} />
            <PriceFilterComponent active={currentFilter == 'price'} price={collected.price} setPrice={(price) => {
                setCollected({
                    ...collected,
                    price
                })
            }} />
            <DateFilterComponent date={collected.date} setDate={(date) => {
                setCollected({
                    ...collected,
                    date
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

function OrderFilterComponent({ order: _order, setOrder, active }: { active: boolean, order: string | undefined, setOrder: (order: string | undefined) => void }) {
    const order = _order
    const MapOder = {
        'date_desc': 'Plus Recent',
        'date_asc': 'Plus Ancien',
        'price_desc': 'Prix Haut',
        'price_asc': 'Prix Bas'
    }

    return <div className={`order-filter-component ${active ? 'active' : ''}`}>
        {
            (["date_desc", "date_asc", "price_desc", "price_asc"] as const).map(o => (
                <span key={o} className={o == order ? 'order' : ''} onClick={() => {
                    setOrder(order == o ? undefined : o);
                }}>
                    {MapOder[o]}
                </span>
            ))
        }
    </div>
}

function PriceFilterComponent({ price, setPrice, active }: { active: boolean, price: (number | undefined)[] | undefined, setPrice: (price: (number | undefined)[] | undefined) => void }) {
    
    return <div className={`price-filter-component ${active ? 'active' : ''}`}>
        <label htmlFor="command-filter-min-price">
            <span>Prix Minimum</span>
            <input type="number" id="command-filter-min-price" value={price?.[0] || ''} placeholder={'Prix Minimum'} onChange={(e) => {
                let minPrice = parseInt(e.currentTarget.value) as number | undefined
                minPrice = Number.isNaN(minPrice) ? undefined : minPrice
                const p = [minPrice, price?.[1]]
                setPrice((p[0] == undefined && p[1] == undefined) ? undefined : p)
            }} />
        </label>
        <label htmlFor="command-filter-max-price">
            <span>Prix Maximum</span>
            <input type="number" id="command-filter-max-price" value={price?.[1] || ''} placeholder={'Prix Maximum'} onChange={(e) => {
                let maxPrice = parseInt(e.currentTarget.value) as number | undefined;
                maxPrice = Number.isNaN(maxPrice) ? undefined : maxPrice
                const p = [price?.[0], maxPrice]
                setPrice((p[0] == undefined && p[1] == undefined) ? undefined : p)
            }} />
        </label>
        <div className="reset" style={{ width: '500px' }}>
            <span className={price && (price?.[0] != undefined || price?.[1] != undefined) ? 'ok' : ''} onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('clicke-clear');
                setPrice(undefined)
            }}>Annuler les modifications</span>
        </div>
    </div>
}

export function DateFilterComponent({ date: date, setDate, active }: { active: boolean, date: (number | undefined)[] | undefined, setDate: (date: (number | undefined)[] | undefined) => void }) {
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
        '3_days': [currentDate - 3 * 24 * 60 * 60 * 1000, currentDate],
        '7_days': [currentDate - 7 * 24 * 60 * 60 * 1000, currentDate],
        '1_month': [currentDate - 30 * 24 * 60 * 60 * 1000, currentDate],
        'all': undefined
    }

    return (
        <div className={`date-filter-component ${active ? 'active' : ''}`}>
            <div className="dates">
                {
                    (['3_days', '7_days', '1_month', 'all'] as const).map(d => (
                        <span key={d} className={(d == marge || (date == undefined && d == 'all')) ? 'marge' : ''} onClick={() => {
                            setMarge(d == marge ? '' : d);
                            setDate(MapMarge[d]);
                            setSelected(d == 'all' ? undefined : { from: new Date(MapMarge[d]?.[0] || currentDate), to: new Date(MapMarge[d]?.[1] || currentDate) })
                        }}>{MapMargeName[d]}</span>
                    ))
                }
            </div>
            <DayPicker
                captionLayout="dropdown"
                defaultMonth={new Date()}
                startMonth={new Date(2024, 6)}
                endMonth={new Date()}
                animate
                mode="range"
                selected={selected}
                onSelect={(d) => {
                    setSelected(d);
                    setMarge('')
                }}
                styles={{
                    selected: {
                        color: '#345'
                    }
                }}
            />
            <div className="reset">Annuler les modifications</div>
        </div>
    );
}