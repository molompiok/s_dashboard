import { useEffect, useState } from 'react'
import { CategoryInterface, FilterType } from '../../Interfaces/Interfaces'
import { useCategory } from '../../pages/category/CategoryStore'
import { useStore } from '../../pages/stores/StoreStore'
import { useApp } from '../../renderer/AppStore/UseApp'
import './CategoriesPopup.css'
import { CategoryItem } from '../CategoryItem/CategoryItem'
import { IoSearch } from 'react-icons/io5'
import { getImg } from '../Utils/StringFormater'

export { CategoriesPopup }

function CategoriesPopup({ categories, onSelected, ignore }: {ignore?:string[], categories?: CategoryInterface[], onSelected?: (category: CategoryInterface) => void }) {
    const { openChild } = useApp()
    const { fetchCategories, categories: _list } = useCategory()
    const { currentStore } = useStore()
    const [filter, setFilter] = useState<FilterType>({});

    useEffect(() => {
        currentStore &&  fetchCategories({});
    }, [currentStore]);

    const list = (_list?.list || categories)?.filter((c) => {
        if (!filter.search) return true; // Pas de filtre si aucun mot-clé

        const words = filter.search.trim().toLowerCase().split(/\s+/); // Divise par espace
        return words.every(word =>
            new RegExp(word, 'i').test(c.name) || new RegExp(word, 'i').test(c.description) || c.id.includes(filter?.search || '')
        );
    });

    return <div className="list-categories-popup" style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '24px 12px 48px 12px'
    }}>
        <div className="row" style={{
            width: '100%',
            justifyContent: 'center'
        }}>
            <label htmlFor="icon-text-name-input" className='label-icon-right'>
                <input
                    className={"editor "}
                    placeholder="Nom, description, #id"
                    id="icon-text-name-input"
                    type="text"
                    autoFocus
                    value={filter.search || ''}
                    onChange={(e) => {
                        const search = e.currentTarget.value;
                        setFilter((prev) => ({ ...prev, search }));
                    }}
                />
                <IoSearch />
            </label>
        </div>
        {
            list?.filter(c=>!ignore?.includes(c.id))?.map((c, i) =>
                c && <CategoryItem key={i} openCategory={!onSelected} category={c} onClick={() => {
                    openChild(null);
                    onSelected?.(c)
                }} />
            )
        }{
            list?.length == 0 && (
                <div className="icon-160" style={{ background: getImg('/res/empty/search.png') }}></div>
            )
        }
    </div>
}