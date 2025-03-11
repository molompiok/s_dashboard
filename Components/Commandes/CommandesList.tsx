import { IoFilterSharp } from 'react-icons/io5'
import { useApp } from '../../renderer/Stores/UseApp'
import { ChildViewer } from '../ChildViewer/ChildViewer'
import './CommandesList.css'
import { CommandItem } from '../CommandItem/CommandItem'
import { CommandInterface } from '../../Interfaces/Interfaces'
import { useState } from 'react'
import { statusIcons } from '../Status/Satus'

export { CommandeList }

function CommandeList() {
    const { openChild } = useApp();
    const [collected, setCollected] = useState({
        order: 'date_desc' as 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc',
        status: ['DELIVERED'] as (keyof typeof statusIcons)[],
        dates: [undefined, undefined] as [string | undefined, string | undefined],
        prices: [undefined, undefined] as [number | undefined, number | undefined],
    });

    const [isOpenFilter, openFilter] = useState(false);
    const [isOpenOrder, openOrder] = useState(false);

    return <div className="commandes-list">
        <div className="top">
            <h2>List des Commandes</h2>
            <div className="filter">
                <IoFilterSharp className='filter-icon' onClick={() => {
                    openChild(<ChildViewer>
                        
                    </ChildViewer>)
                }} />
            </div>
        </div>
        <div className="list">
            {Array.from({ length: 25 }).map((a, i) => (
                <CommandItem command={{} as CommandInterface} onClick={() => {
                    openChild(<ChildViewer title='Detail Command 358acb78' />, { blur: 4 })
                }} />
            ))}
        </div>
    </div>
}
