import './TopBar.css'
import { IoSearch, IoNotifications, IoChevronBack } from "react-icons/io5";
export { Topbar }

function Topbar({back}:{back?:boolean}) {


    return (
        <div className='top-bar'>
            {back && <IoChevronBack className='icon' onClick={()=>{
                history.back();
            }}/> }
            <div className='left'>

                <h3>Bienvenu !!</h3>
                <h2>Kouassi Noga</h2>
            </div>
            <div className='right'>
                <IoSearch className='search-icon'></IoSearch>
                <a href="/notifications" className="notify-icon-ctn">
                <IoNotifications className='notify-icon'></IoNotifications>
                <span className="available"></span>  
                </a>

            </div>
        </div>
    )
}

type Props = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
    setSearchValue: (value: string) => void
}


function Search({ setSearchValue, ...values }: Props) {
    return <div className="section-search">
        <label htmlFor="home-search" className="search">
            <input id="home-search" type="text" placeholder="Store name" onChange={(e) => {
                setSearchValue(e.currentTarget.value)
            }} />
            <a >
            <IoSearch className='search-icon'></IoSearch>
            </a>
        </label>
    </div>
}
