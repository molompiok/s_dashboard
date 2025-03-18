import './TopBar.css'
import { IoSearch, IoNotifications, IoChevronBack } from "react-icons/io5";
export { Topbar }

function Topbar({ back, notif, search, onBack }: { onBack?: () => void, back?: boolean, search?: boolean, notif?: boolean }) {


    return (
        <div className='top-bar'>
            {back != false && <IoChevronBack className='icon' onClick={() => {
                if (onBack) {
                    onBack(); // Si une fonction `onBack` est fournie, l'utiliser
                } else {
                    history.back(); // Sinon, retourner à la page précédente correctement
                }
            }} />}
            <div className='left'>
                <h3>Bienvenu !!</h3>
                <h2>Kouassi Noga</h2>
            </div>
            <div className='right'>
                {search != false && <IoSearch className='search-icon'></IoSearch>}
                {notif !== false && <a href="/notifications" className="notify-icon-ctn">
                    <IoNotifications className='notify-icon'></IoNotifications>
                    <span className="available"></span>
                </a>}

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
