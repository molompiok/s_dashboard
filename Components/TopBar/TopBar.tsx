import { useEffect, useState } from 'react';
import {  getTransmit, useStore } from '../../pages/stores/StoreStore';
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { TopSearch } from '../TopSearch/TopSearch';
import './TopBar.css'
import { IoSearch, IoNotifications, IoChevronBack } from "react-icons/io5";
import { ClientCall } from '../Utils/functions';
import { Transmit } from '@adonisjs/transmit-client'

export { Topbar }


function Topbar({ back, notif, search, onBack }: { onBack?: () => void, back?: boolean, search?: boolean, notif?: boolean }) {
    const  {testSSE,currentStore} = useStore();
    const { openChild } = useApp()
    const [test, setTest] = useState(0)
    useEffect(() => {
        if (!currentStore ) return
        const transmit = getTransmit(currentStore.url)
        const subscription = transmit?.subscription(`test:sse`)
        
        async function subscribe() {
            if(!subscription) return
            await subscription.create()
           
            subscription.onMessage<{ test?: number }>((data)=>{
                  setTest(data.test||0)
               if(data.test){
               }
            })
        }

        subscribe().catch(console.log)
    
        return () => {
            subscription?.delete() // 🔴 Ferme la connexion à l'ancien store lorsqu'on change
        }

    }, [currentStore])

    console.log(test);
    
    return (
        <div className='top-bar'>
            {back != false && <IoChevronBack className='icon' onClick={() => {
                if (onBack) {
                    onBack(); // Si une fonction `onBack` est fournie, l'utiliser
                } else {
                    history.back(); // Sinon, retourner à la page précédente correctement
                }
            }} />}
            <div className='left' onClick={()=>{
                testSSE();
            }}>
                <h3>Bienvenu !!</h3>
                <h2>Kouassi Noga {test}</h2>
            </div>
            <div className='right'>
                {search != false && <IoSearch className='search-icon' onClick={()=>{
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
