import { useRef, useState } from "react";
import { IoBagHandle, IoEllipsisHorizontalSharp, IoEyeOff, IoEyeSharp, IoPeopleSharp } from "react-icons/io5";
import { Nuage } from "../../index/Nuage";
import MyChart from "../../index/MiniChart";

import './HomeStat.css'

export { HomeStat }
function HomeStat() {
    const [eye, setEye] = useState(false)
    const comptref = useRef<HTMLSpanElement|null>(null)
    const [nuageW, setNuageW] = useState(100);
    return <div className="home-stat">
      {/* <div className="bottom-hid b2"></div>
      <div className="bottom-hid b1"></div> */}
      <div className="card-stat-fill"></div>
      <div className="card-stat">
        <div className="top">
          <h3>Total du compte</h3>
          <IoEllipsisHorizontalSharp className='option'/>
        </div>
        <h1 className='compte'>
          { eye? 
            <span ref={comptref}>{Number(295000).toLocaleString()} {'FCFA'}</span>:
            <Nuage color='#3455' density={1} height={20} width={nuageW} speed={1}/>}  <span onClick={()=>{
          const w = comptref.current?.getBoundingClientRect().width||100;
          setNuageW(w)
          setEye(!eye);
        }}>
          {eye?<IoEyeSharp />:<IoEyeOff/>}
          </span></h1>
          
        <div className="bottom">
          <div className="section commades">
            <div className="min-info">
              <span className="icon"></span>
              <h3><IoBagHandle className='icon'/> {'Commandes'}</h3>
              <h2>{'38'}</h2>
            </div>
            <MyChart color='green' />
          </div>
          <div className="section visites">
            <div className="min-info">
              <span className="icon"></span>
              <h3><IoPeopleSharp className='icon'/> {'Visites'}</h3>
              <h2>{'38'}</h2>
            </div>
            <MyChart />
          </div>
        </div>
      </div>
    </div>
  }