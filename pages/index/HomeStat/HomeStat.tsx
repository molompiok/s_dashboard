// HomeStat.tsx
import { useRef, useState } from "react";
import { IoBagHandle, IoCart, IoEllipsisHorizontalSharp, IoEyeOff, IoEyeSharp, IoPeopleSharp } from "react-icons/io5";
import { Nuage } from "../Nuage";
import MyChart from "../MiniChart";
import './HomeStat.css'

export function HomeStat() {
    const [eye, setEye] = useState(false);
    const comptref = useRef<HTMLSpanElement|null>(null);
    const [nuageW, setNuageW] = useState(100);

    return (
        <div className="home-stat-container">
            {/* Account Total Card */}
            <div className="stat-card account-card">
                <div className="card-header">
                    <h3>Total du compte</h3>
                    <IoEllipsisHorizontalSharp className='option'/>
                </div>
                <div className="card-content">
                    <h1 className='compte'>
                        {!eye ? 
                            <span ref={comptref}>{Number(295000).toLocaleString()} FCFA</span> :
                            <Nuage color='#3455' density={1} height={20} width={nuageW} speed={1}/>}
                        <span className="eye-toggle" onClick={() => {
                            const w = comptref.current?.getBoundingClientRect().width || 100;
                            setNuageW(w);
                            setEye(!eye);
                        }}>
                            {eye ? <IoEyeSharp /> : <IoEyeOff/>}
                        </span>
                    </h1>
                </div>
            </div>

            {/* Visits Card */}
            <div className="stat-card visits-card">
                <div className="card-header">
                    <h3><IoPeopleSharp className='icon'/> Visites</h3>
                </div>
                <div className="card-content">
                    <div className="stats-content">
                        <h2>38</h2>
                        <MyChart />
                    </div>
                    <a href="/stats" className="card-link">Voir plus</a>
                </div>
            </div>

            {/* Orders Card */}
            <div className="stat-card orders-card">
                <div className="card-header">
                    <h3><IoCart className='icon'/> Commandes</h3>
                </div>
                <div className="card-content">
                    <div className="stats-content">
                        <h2>38</h2>
                        <MyChart color='green' />
                    </div>
                    <a href="/stats" className="card-link">Voir plus</a>
                </div>
            </div>
        </div>
    );
}