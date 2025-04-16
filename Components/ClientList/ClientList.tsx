import { IoChevronDown, IoChevronForward, IoFilterSharp, IoSearch } from 'react-icons/io5'
import './ClientList.css'
import { UserFilterType, UserInterface } from '../../Interfaces/Interfaces'
import { useEffect, useState } from 'react'
import { OrderStatusElement } from '../Status/Satus'

import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ClientCall, debounce } from '../Utils/functions'
export { ClientList }
import { getImg } from '../Utils/StringFormater'
import { getTransmit, useStore } from '../../pages/stores/StoreStore'
import { useClientStore } from '../../pages/users/clients/ClientStore'
import { ClientStatusColor } from '../Utils/constants'


function ClientList({ product_id, user_id }: { user_id?: string, product_id?: string }) {
  const [filter, setFilter] = useState<UserFilterType>({});
  const { fetchClients } = useClientStore()
  const { currentStore } = useStore();
  const [clients, setClients] = useState<UserInterface[]>([])

  const [s] = useState({
    isUpdated: false,
  });
  const fetchCmd = () => {
    debounce(() => {
      const d = filter.max_date ? new Date(filter.max_date) : undefined;
      if(d) d.setDate(d.getDate() + 1);
      fetchClients({
        ...filter,
        max_date: d && (d.toISOString())
      }).then(res => {
        s.isUpdated = false;
        if (!res?.list) return
        setClients(res.list);
      });
    }, 'filter-command', 300)
  }

  useEffect(()=>{
    fetchCmd()
  },[currentStore, filter])
  useEffect(() => {
    if (!currentStore) return

    const transmit = getTransmit(currentStore.url)
    console.log(currentStore.id);

    // const subscription = transmit?.subscription(`store/${currentStore.id}/new_command`)
    const subscription = transmit?.subscription(`store/${'d3d8dfcf-b84b-49ed-976d-9889e79e6306'}/new_command`)

    async function subscribe() {
      if (!subscription) return
      await subscription.create()
      subscription.onMessage<{ update: string }>((data) => {
        console.log(`@@@@@@@  command  @@@@@@@@@@@@  ${JSON.stringify(data)} @@@@@@@@@@@@@@@@@@@`);
        fetchCmd()
      })
    }

    subscribe().catch(console.error)

    return () => {
      subscription?.delete() // 🔴 Ferme la connexion à l'ancien store lorsqu'on change
    }
  }, [currentStore])

  const accuDate: string[] = []
  const getDate = (date: string) => {
    const d = new Date(date).toLocaleDateString('fr', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    return d
  }

  return <div className="client-list">
    <div className="top">

      <div className="client-search">
        <h2>List des Clients</h2>
        <label htmlFor="client-search-input" className='label-icon-right'>
          <input
            className={"editor "}
            placeholder="Nom, Email, #id"
            id="client-search-input"
            type="text"
            value={filter.search || ''}
            onChange={(e) => {
              const search = e.currentTarget.value;
              s.isUpdated = true;
              setFilter((prev) => ({ ...prev, search }));
            }}
          />
          <IoSearch />
        </label>
      </div>
    </div>
    <ClientsFilters filter={filter} setFilter={(filter) => {
      s.isUpdated = true;
      setFilter(filter)
    }} />
    <div className="list">
      {
        clients.length == 0 && <div className="column-center"><div className="icon-160" style={{ background: getImg('/res/empty/search.png') }}></div>Aucune commande trouvée</div>
      }
      {clients.map((a, i) => {
        const d = getDate(a.created_at);

        const inner = accuDate.includes(d) 
        !inner && accuDate.push(d)
        const h = !inner && <h3 className='date'>{d}</h3>
        return <div key={a.id}>
          {!filter.order_by?.includes('price') && h}
          <a href={`/users/clients/${a.id}`}>
            <div key={a.id} className="client-item">
              <div className="row">
              <div
                className="client-photo"
                style={{
                  background: a.photo?.[0] && getImg(a.photo[0]),
                  backgroundColor: a.photo?.[0] ? 'transparent' : '#e6e6e6',
                }}
              >{a.photo?.[0] ? '' : a.full_name?.substring(0, 2).toUpperCase()}</div>
              <div className="client-info">
                <p className="client-full_name">{a.full_name}</p>
                <p className="client-email">{a.email}</p>
                <p className="client-phone">{a.phone||('+7 (999) 862-74-41')}</p>
              </div>
              </div>
              <div className="row" style={{width:'100%'}}>
              <span className='client-date ' style={{margin:'auto'}}>{new Date(a.created_at).toLocaleDateString('fr',{month:'short','day':'numeric', year:'2-digit'})}</span>
              <div className="client-status" style={{ backgroundColor: '#4CAF5033', color:'#4CAF50' }}>
                {a.status||'CLIENT'}
              </div>
              </div>
            </div>
          </a>
        </div>
      })}
    </div>
  </div>
}

function ClientsFilters({ filter, setFilter }: { filter: UserFilterType, setFilter: (filter: UserFilterType) => any }) {

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
      Object.keys(ClientStatusColor).map(s => (
        <span key={s} onClick={() => {
          const list = status.includes(s) ?
            status.filter(f => f != s) :
            [...status, s]

          setStatus(list.length > 0 ? list : undefined)
        }}><OrderStatusElement background={status.includes(s) ? undefined : 'transparent'} color={status.includes(s) ? (ClientStatusColor as any)[s] : 'var(--discret-1)'} status={s as any} /></span>
      ))
    }
  </div>
}

export function OrderFilterComponent({ order: _order, setOrder, active }: { active: boolean, order: string | undefined, setOrder: (order: UserFilterType['order_by'] | undefined) => void }) {
  const order = _order
  const MapOder = {
    'date_desc': 'Plus Recent',
    'date_asc': 'Plus Ancien',
    'full_name_desc': 'Nom croissant',
    'full_name_asc': 'Nom decroissant'
  }

  return <div className={`order-filter-component ${active ? 'active' : ''}`}>
    {
      (["date_desc", "date_asc", "full_name_desc", "full_name_asc"] as const).map(o => (
        <span key={o} className={o == order ? 'order' : ''} onClick={() => {
          setOrder(order == o ? undefined : o);
        }}>
          {MapOder[o]}
        </span>
      ))
    }
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