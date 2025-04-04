import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from '../../Hooks/useWindowSize'
import './CategoriesList.css'
import { CategoryItem } from '../CategoryItem/CategoryItem';
import { IoAddSharp, IoArrowForward } from "react-icons/io5";
import { CgExtensionAdd} from "react-icons/cg";
import { useApp } from '../../renderer/AppStore/UseApp';
import { ChildViewer } from '../ChildViewer/ChildViewer';
import { CategoryInterface } from '../../Interfaces/Interfaces';
import { useCategory } from '../../pages/category/CategoryStore';
import { useStore } from '../../pages/stores/StoreStore';
import { usePageContext } from '../../renderer/usePageContext';
import { CategoriesPopup } from '../CategoriesPopup/CategoriesPopup';

const CATEGORY_SIZE = 80;
const GAP = 8
export { CategoriesList}

function CategoriesList({ 
    title 
}: { 
    title?: string }) {
    const { fetchCategories} = useCategory();
    const { currentStore } = useStore()
    const { openChild } = useApp()
    const size = useWindowSize();
    const listRef = useRef<HTMLDivElement>(null);
    const [listWidth, setListWidth] = useState<number>(0)
    const [categories, setCategories] = useState<Partial<CategoryInterface[]>>();
    
    useEffect(() => {
        if (!listRef.current) return;
        const w = listRef.current.getBoundingClientRect().width
        setListWidth(w);
    }, [size]);

    let limit = Math.trunc((listWidth + GAP) / (CATEGORY_SIZE + GAP)) * 2 - 1
    limit = Math.max(0,limit);
    const seeMore = (categories?.length||0) > limit;

    useEffect(()=>{
        fetchCategories({with_product_count:true}).then(res=>{
            setCategories(res?.list);
        })
    },[currentStore])

    console.log(categories);
    

    return <div className="catefgories-list">
        <h1>{title || 'Liste des categories'}</h1>
        <div className="list" ref={listRef}>
            <AddCategory isNew={(categories?.length||0) == 0 }/>
            {
                categories?.slice(0, limit - (seeMore ? 1 : 0)).map((c, i) =>
                    <CategoryItem key={i} category={c} openCategory/>
                )
            }
            {seeMore && <SeeMore onClick={() => {
                openChild(<ChildViewer title='List des categories'>
                    <CategoriesPopup/>
                </ChildViewer>, { blur: 10 })
            }} />}
        </div>
    </div>
}

function AddCategory({isNew}:{isNew:boolean}) {
    return <a href='/category?id=new' className={isNew? "add-new-category":"add-category"}>
        <CgExtensionAdd className='icon' />
        {!isNew && <span>ajoutez</span>}
       {isNew && <button>Ajoutez une categorie </button>}
    </a>
}
function SeeMore({ onClick }: { onClick: () => void }) {
    return <div onClick={onClick} className="more-category">
        <IoArrowForward className='icon' />
        <span>tout voir</span>
    </div>
}
