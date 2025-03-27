import { useEffect } from 'react'
import { CategoryInterface } from '../../Interfaces/Interfaces'
import { useCategory } from '../CategoriesList/CategoryStore'
import { useStore } from '../../pages/stores/StoreStore'
import { useApp } from '../../renderer/AppStore/UseApp'
import './CategoriesPopup.css'
import { CategoryItem } from '../CategoryItem/CategoryItem'

export {CategoriesPopup}

function CategoriesPopup({ categories,onSelected }: { categories?: CategoryInterface[], onSelected?:(category:CategoryInterface)=>void }) {
    const { openChild } = useApp()
    const {fetchCategories , categories:_list} = useCategory()
    const {currentStore} = useStore()
     
    useEffect(()=>{
        fetchCategories({});
    },[currentStore]);

    return <div className="list-categories-popup" style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px'
    }}>
        {
            (_list?.list||categories)?.map((c, i) =>
                c && <CategoryItem key={i} openCategory={!onSelected} category={c} onClick={() => {
                    openChild(null);
                    onSelected?.(c)
                    
                }} />
            )
        }
    </div>
}