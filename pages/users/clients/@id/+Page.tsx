import './+Page.css'
import { PeriodType, StatsData, UserInterface } from '../../../../Interfaces/Interfaces'
import { CommandeList } from '../../../../Components/CommandesList/CommandesList';

import {
    User,
    Mail,
    Phone,
    Star,
    ShoppingCart,
    MessageCircle,
    CreditCard,
    CalendarClock,
    UserCircle
} from 'lucide-react'
import { usePageContext } from '../../../../renderer/usePageContext';
import { getTransmit, useStore } from '../../../stores/StoreStore';
import { useClientStore } from '../ClientStore';
import { useEffect, useRef, useState } from 'react';
import IMask from 'imask';
import { getImg } from '../../../../Components/Utils/StringFormater';
import { ClientStatusColor } from '../../../../Components/Utils/constants';
import { useApp } from '../../../../renderer/AppStore/UseApp';
import StatsChart from '../../../../Components/UserStatsChart/UserStatsChart';
import { Topbar } from '../../../../Components/TopBar/TopBar';

export function Page() {

    const { routeParams } = usePageContext();
    const { currentStore } = useStore();
    const { fetchClients } = useClientStore();
    const [period, setPeriod] = useState<PeriodType>('month')
    const [user, setUser] = useState<Partial<UserInterface>>()
    const { fetchStats } = useApp()
    const [userStats, setUserStats] = useState<StatsData>({})

    const listMarkerRef = useRef<HTMLDivElement | null>(null)

    const fetchU = () => {
        try {
            fetchClients({ user_id: routeParams.id, 
                with_avg_rating:true,
                with_comments_count:true,
                with_orders_count:true,
                with_products_bought:true,
                with_total_spent:true,
                with_last_visit:true
             }).then(res => {
                if (!res?.list?.[0]) return
                setUser(res.list[0])
            })
        } catch (error) { }
    }
    const fetchS = () => {
        try {
            fetchStats({
                user_id: routeParams.id,
                stats: ['visits_stats'],
                period,
            }).then(s => {
                setUserStats(s)
            })
        } catch (error) { }
    }
    function focusCommands() {
        const page = document.querySelector('#page-container') as HTMLDivElement
        console.log(page, listMarkerRef.current);
        if (!page || !listMarkerRef.current) return;
        const t = listMarkerRef.current.getBoundingClientRect().top + page.scrollTop;
        page.scrollTo({
            top: t + window.scrollY,
            behavior: 'smooth'
        });
    }
    useEffect(() => {
        if (!currentStore) return
        fetchU()
        const transmit = getTransmit(currentStore.url)

        // const subscription = transmit?.subscription(`store/${currentStore.id}/new_command`)
        const subscription = transmit?.subscription(`store/${'d3d8dfcf-b84b-49ed-976d-9889e79e6306'}/new_command`)

        async function subscribe() {
            if (!subscription) return
            await subscription.create()
            subscription.onMessage<{ update: string }>((data) => {
                console.log(`@@@@@@@  command  @@@@@@@@@@@@  ${JSON.stringify(data)} @@@@@@@@@@@@@@@@@@@`);
                fetchU();
            })
        }

        subscribe().catch(console.error)

        return () => {
            subscription?.delete() // 🔴 Ferme la connexion à l'ancien store lorsqu'on change
        }
    }, [currentStore])

    useEffect(() => {
        currentStore && fetchS()
    }, [period, currentStore])
    const stats = user?.stats
    user && (user.phone = '+ 7(999) 862 41-71');
    user && (user.status = 'CLIENT')

    console.log(userStats);

    return user && (
        <div className="user-recap-container">
            {/* Card utilisateur */}
            <Topbar />
            <div className="user-card">
                <div className="user-card-top">
                    {user.photo?.[0] ? (
                        <img src={user.photo[0]} alt={user.full_name} className="user-photo" />
                    ) : (
                        <UserCircle className="user-icon-placeholder" />
                    )}

                    <div className="user-info">
                        <h2>{user.full_name}</h2>
                        <p><Mail className="icon" /> {user.email}</p>
                        <div className="icon-25" style={{ background: getImg('/res/social/gmail.png') }} onClick={() =>
                            window.open(`mailto:${user.email}?subject=Contact&body=Bonjour`)
                        }></div>
                        {user.phone && <p><Phone className="icon" /> {user.phone}</p>}
                        <div className="client-phone">
                            <span className='icon-25'
                                style={{ background: getImg('/res/social/telephone.png') }}
                                onClick={() => window.open(`tel:${user.phone}`)}
                            ></span>
                            <span className='icon-25'
                                style={{ background: getImg('/res/social/social.png') }}
                                onClick={() => window.open(`https://wa.me/${user.phone}`)}
                            ></span>
                            <span className='icon-25'
                                style={{ background: getImg('/res/social/telegram.png') }}
                                onClick={() => window.open(`https://t.me/${user.phone}`)}
                            ></span>
                        </div>
                    </div>
                </div>
                <div className="user-card-foot">
                    <p><span>Status:</span> <strong className='user-status' style={{ background: (ClientStatusColor as any)[user.status || ''] + '22', color: (ClientStatusColor as any)[user.status || ''] }}>{user.status}</strong></p>
                    <p><span>Rôles:</span> {user.roles?.map(r => r.name).join(', ') || 'Aucun'}</p>
                    <p><span>Membre depuis:</span> {new Date(user.created_at || '').toLocaleDateString('fr', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}</p>
                </div>
            </div>

            {/* Statistiques */}
            <div className="stats-grid">
                <StatCard icon={<Star className="yellow" />} row label="Note Moyenne"onClick={()=>{
                    window.location.assign(`/users/clients/${routeParams.id}/comments`)
                }}>
                    {stats?.avgRating?.toFixed(1)} / 5
                </StatCard>
                <StatCard icon={<MessageCircle className="blue" />} row label="Produits commentés" onClick={()=>{
                    window.location.assign(`/users/clients/${routeParams.id}/comments`)
                }}>
                    {stats?.commentsCount}
                </StatCard>
                <StatCard icon={<ShoppingCart className="green" />} row label="Produits achetés"  onClick={focusCommands}>
                    {stats?.productsBought}
                </StatCard>
                <StatCard icon={<CreditCard className="purple" />} row label="Commandes" onClick={focusCommands}>
                    {stats?.ordersCount}
                </StatCard>
                <StatCard icon={<CalendarClock className="rose" />} label="Dernière visite">
                    <>
                        {stats?.lastVisit && new Date(stats?.lastVisit||'').toLocaleDateString('fr', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                        <div className="time" style={{
                            fontWeight: 'normal',
                            fontSize: '0.8em',
                        }}>
                            {stats?.lastVisit && new Date(stats?.lastVisit).toLocaleTimeString('fr', {
                                hour: 'numeric',
                                minute: 'numeric',
                            })}
                        </div>
                    </>
                </StatCard>
                <StatCard icon={<CreditCard className="emerald" />} label="Total dépensé">
                    {stats?.totalSpent?.toFixed(2)} {(currentStore as any)?.currency || 'cfa'}
                </StatCard>
            </div>
            <div className="periods">
                {
                    (['day', 'month', 'week'] as const).map(p => (
                        <span className={p == period ? 'active' : ''} onClick={() => {
                            console.log(period, p);

                            setPeriod(p)
                        }}>{p}</span>
                    ))
                }
            </div>
            <StatsChart period={period}
                data={userStats}
                setAvailable={(avalible) => {
                    // console.log(avalible);
                }}
                setResume={(resume) => {
                    // console.log(resume);
                }}
            />
            <div className="list-marker" ref={listMarkerRef}></div>
            <CommandeList user_id={routeParams['id']} />
        </div>
    )
}

function StatCard({ icon, label, children, row, onClick }: any) {
    return (
        <div className="stat-card" onClick={onClick}>
            <div className={"stat-label " + (row ? '_row' : '')}>
                {icon}
                {label}
                {row && <div className="stat-value">{children}</div>}
            </div>
            {!row && <div className="stat-value">{children}</div>}
        </div>
    )
}  