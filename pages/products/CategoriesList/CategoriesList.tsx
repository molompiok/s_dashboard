import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from '../../../Hooks/useWindowSize'
import './CategoriesList.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem';
import { IoAddSharp, IoArrowForward } from "react-icons/io5";
import { useApp } from '../../../renderer/Stores/UseApp';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';

const CATEGORY_SIZE = 80;
const GAP = 8
export { CategoriesList }

function CategoriesList() {

    const { openChild } = useApp()
    const size = useWindowSize();
    const listRef = useRef<HTMLDivElement>(null);
    const [listWidth, setListWidth] = useState<number>(0)

    useEffect(() => {
        if (!listRef.current) return;
        const w = listRef.current.getBoundingClientRect().width
        setListWidth(w);
    }, [size]);

    const limit = Math.trunc(listWidth / (CATEGORY_SIZE + GAP)) * 2 - 1
    const seeMore = Array.from({ length: 20 }).length > limit
    return <div className="catefgories-list">
        <h1>Liste des categories</h1>
        <div className="list" ref={listRef}>
            <AddCategory />
            {
                Array.from({ length: 20 }).slice(0, limit - (seeMore ? 1 : 0)).map((_, i) =>
                    <CategoryItem key={i} category={{} as any} />
                )
            }
            <SeeMore onClick={() => {
                openChild(<ChildViewer title='List des categories'>
                    <ListCategoriesPopup />
                </ChildViewer>,{blur:10})
            }} />
        </div>
    </div>
}

function AddCategory() {
    return <a className="add-category">
        <IoAddSharp className='icon' />
    </a>
}

function SeeMore({ onClick }: { onClick: () => void }) {
    return <div  onClick={onClick} className="more-category">
        <IoArrowForward className='icon' />
    </div>
}

function ListCategoriesPopup() {
    const { openChild } = useApp()

    return <div className="list-categories-popup" style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px'
    }}>
        {
            Array.from({ length: 40 }).map((_, i) =>
                <CategoryItem key={i} category={{} as any} onClick={() => {
                    openChild(null, { back: false })
                }} />
            )
        }
    </div>
}