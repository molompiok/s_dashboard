import { IoBagHandle, IoStorefront,IoFolderOpen } from 'react-icons/io5';
import './HomeManage.css'
export { HomeManage };


function HomeManage() {
    // const imgs = categories.map(c => c.view?.[0] || c.icon?.[0]).filter(f => !!f);
    return <div className="home-manage">
        <a href='/products' className="card products">
        <div className="views">
                {/* {imgs.length > 0 ? imgs.slice(0,3).map((url, i) => (
                    <div key={i} className="view" style={{ background: `no-repeat center/cover url(${url})` }}></div>
                )) : <IoBagHandle className='icon' />} */}
                <IoBagHandle className='icon' />
            </div>
            <div className="bottom">
                <h2>Products</h2>
                <span>{22}</span>
            </div>
        </a>
        <a href='/products' className="card categories">
            <div className="views">
                {/* {imgs.length > 0 ? imgs.slice(0,3).map((url, i) => (
                    <div key={i} className="view" style={{ background: `no-repeat center/cover url(${url})` }}></div>
                )) : <IoBagHandle className='icon' />} */}
                <IoFolderOpen className='icon' />
            </div>
            <div className="bottom">
                <h2>Categories</h2>
                <span>{5}</span>
            </div>
        </a>
        <a href='/stores' className="card stores">
            <IoStorefront className='icon' />
            <div className="bottom">
                <h2>Stores</h2>
                <span>{1}</span>
            </div>
        </a>
        <div className="div" style={{minWidth:'20vw'}}></div>
    </div>
}

