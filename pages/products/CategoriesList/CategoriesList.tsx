import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from '../../../Hooks/useWindowSize'
import './CategoriesList.css'
import { CategoryItem } from '../../../Components/CategoryItem/CategoryItem';
import { IoAddSharp, IoArrowForward } from "react-icons/io5";
import { CgExtensionAdd} from "react-icons/cg";
import { useApp } from '../../../renderer/AppStore/UseApp';
import { ChildViewer } from '../../../Components/ChildViewer/ChildViewer';
import { CategoryInterface } from '../../../Interfaces/Interfaces';
import { getImg } from '../../../Components/Utils/StringFormater';

const CATEGORY_SIZE = 80;
const GAP = 8
export { CategoriesList }

function CategoriesList({ title }: { title?: string }) {

    const { openChild } = useApp()
    const size = useWindowSize();
    const listRef = useRef<HTMLDivElement>(null);
    const [listWidth, setListWidth] = useState<number>(0)

    useEffect(() => {
        if (!listRef.current) return;
        const w = listRef.current.getBoundingClientRect().width
        setListWidth(w);
    }, [size]);
    const categories = Array.from({ length: 4 }) as CategoryInterface[];
    let limit = Math.trunc((listWidth + GAP) / (CATEGORY_SIZE + GAP)) * 2 - 1
    limit = Math.max(0,limit);
    const seeMore = (categories.length||0) > limit;

    return <div className="catefgories-list">
        <h1>{title || 'Liste des categories'}</h1>
        <div className="list" ref={listRef}>
            <AddCategory isNew={categories.length == 0 }/>
            {
                categories.slice(0, limit - (seeMore ? 1 : 0)).map((c, i) =>
                    <CategoryItem key={i} category={c} />
                )
            }
            {seeMore && <SeeMore onClick={() => {
                openChild(<ChildViewer title='List des categories'>
                    <ListCategoriesPopup categories={categories} />
                </ChildViewer>, { blur: 10 })
            }} />}

        </div>
    </div>
}

function AddCategory({isNew}:{isNew:boolean}) {
    return <a href='/category?new' className={isNew? "add-new-category":"add-category"}>
        <CgExtensionAdd className='icon' />
       {isNew && <button>Ajoutez une categorie </button>}
    </a>
}
function SeeMore({ onClick }: { onClick: () => void }) {
    return <div onClick={onClick} className="more-category">
        <IoArrowForward className='icon' />
    </div>
}

function ListCategoriesPopup({ categories }: { categories: CategoryInterface[] }) {
    const { openChild } = useApp()

    return <div className="list-categories-popup" style={{
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px'
    }}>
        {
            categories.map((_, i) =>
                <CategoryItem key={i} category={{} as any} onClick={() => {
                    openChild(null)
                }} />
            )
        }
    </div>
}