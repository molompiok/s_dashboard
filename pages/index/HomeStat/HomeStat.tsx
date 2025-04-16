// HomeStat.tsx
import { useEffect, useRef, useState } from "react";
import { IoBagHandle, IoCart, IoEllipsisHorizontalSharp, IoEyeOff, IoEyeSharp, IoPeopleSharp } from "react-icons/io5";
import { Nuage } from "../Nuage";
import MyChart from "../MiniChart";
import './HomeStat.css'
import { useApp } from "../../../renderer/AppStore/UseApp";
import { PeriodType, StatsData } from "../../../Interfaces/Interfaces";
import { useStore } from "../../stores/StoreStore";

export function HomeStat() {
    const [eye, setEye] = useState(false);
    const comptref = useRef<HTMLSpanElement | null>(null);
    const [nuageW, setNuageW] = useState(100);
    const { currentStore } = useStore()
    const { fetchStats } = useApp()
    const [period, setPeriod] = useState<PeriodType>('month')
    const [userStats, setUserStats] = useState<StatsData>()
    const [openPeriod, setOpenPerod] = useState(false)
    const fetchS = () => {
        try {
            fetchStats({
                stats: ['visits_stats', 'order_stats'],
                period
            }).then(s => {
                setUserStats(s)
            })
        } catch (error) { }
    }
    useEffect(() => {
        currentStore && fetchS();
    }, [currentStore,period]);

    console.log({ userStats });

    return (
        <div className="home-stat-container">
            {/* Account Total Card */}
            <div className={"stat-card account-card "+(openPeriod?'no':'')}>
                <div className="card-header">
                    <h3>Total du compte</h3>
                    <span className="period-option no-selectable" onClick={() => setOpenPerod(!openPeriod)}>
                        <span className="period">{period}</span>
                        <IoEllipsisHorizontalSharp className='option' />
                        <div className={"period-list "+(openPeriod?'visible':'')}>
                            {
                                (['day', 'week', 'month'] as const).map(p => (
                                    <b onClick={()=>setPeriod(p)}>{p}</b>
                                ))
                            }
                        </div>
                    </span>
                </div>
                <div className="card-content">
                    <h1 className='compte'>
                        {!eye ?
                            <span ref={comptref}>{Number(295000).toLocaleString()} FCFA</span> :
                            <Nuage color='#3455' density={1} height={20} width={nuageW} speed={1} />}
                        <span className="eye-toggle" onClick={() => {
                            const w = comptref.current?.getBoundingClientRect().width || 100;
                            setNuageW(w);
                            setEye(!eye);
                        }}>
                            {eye ? <IoEyeSharp /> : <IoEyeOff />}
                        </span>
                    </h1>
                </div>
            </div>

            {/* Visits Card */}
            <div className="stat-card visits-card">
                <div className="card-header">
                    <h3><IoPeopleSharp className='icon' /> Visites</h3>
                </div>
                <div className="card-content">
                    <div className="stats-content">
                        <h2>{userStats?.visits_stats?.slice(0, 30).map(v => v.visits).reduce((p, c) => p + c, 0)}</h2>
                        {userStats?.visits_stats && <MyChart datasets={userStats.visits_stats.slice(0, 20).map(v => v.visits)} />}
                    </div>
                    <a href="/stats" className="card-link">Voir plus</a>
                </div>
            </div>

            {/* Orders Card */}
            <div className="stat-card orders-card">
                <div className="card-header">
                    <h3><IoCart className='icon' /> Commandes</h3>
                </div>
                <div className="card-content">
                    <div className="stats-content">
                        <h2>{userStats?.order_stats?.slice(0, 30).map(v => v.orders_count).reduce((p, c) => p + c, 0)}</h2>
                        {userStats?.order_stats && <MyChart datasets={userStats.order_stats.slice(0, 20).map(v => v.orders_count)} color='green' />}
                    </div>
                    <a href="/stats" className="card-link">Voir plus</a>
                </div>
            </div>
        </div>
    );
}