import { useEffect, useState } from 'react';
import {  getTransmit, useStore } from '../../pages/stores/StoreStore';
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { TopSearch } from '../TopSearch/TopSearch';
import './TopBar.css'
import { IoSearch, IoNotifications, IoChevronBack } from "react-icons/io5";
import { ClientCall } from '../Utils/functions';
import { Transmit } from '@adonisjs/transmit-client'
import { useChildViewer } from '../ChildViewer/useChildViewer';

export { Topbar }


function Topbar({ back, notif, search, onBack, title }: { title?:string,onBack?: () => void, back?: boolean, search?: boolean, notif?: boolean }) {
    const { openChild } = useChildViewer()

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
                <h3>{title||'Bienvenu !!'}</h3>
                <h2>Kouassi Noga</h2>
            </div>
            <div className='right'>
                {search != false && <IoSearch className='search-icon-2' onClick={()=>{
                    openChild(<ChildViewer title='Recherche global'>
                        <TopSearch/>
                    </ChildViewer>,{
                        background:'#3345'
                    })
                }}></IoSearch>}
                {notif !== false && <a href="/notifications" className="notify-icon-ctn">
                    <IoNotifications className='notify-icon'></IoNotifications>
                    <span className="available"></span>
                </a>}

            </div>
        </div>
    )
}
