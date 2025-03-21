import { IoAdd, IoApps, IoBagHandle, IoCart, IoCloudUploadOutline, IoLayers, IoPencil, IoTrash } from 'react-icons/io5'
import { RiImageEditFill } from 'react-icons/ri'
import './Page.css'
import { Indicator } from '../../Components/Indicator/Indicator'
import { ProductList } from '../products/ProductList/ProductList'
import { Topbar } from '../../Components/TopBar/TopBar'
import { Image_1 } from '../../Components/Utils/constants'
import { useData } from '../../renderer/useData'
import type { Data } from './+data'
import { getImg } from '../../Components/Utils/StringFormater'
import { usePageContext } from '../../renderer/usePageContext'
import { Api_host } from '../../renderer/+config'
import { useEffect, useRef, useState } from 'react'
import { CategoryInterface } from '../../Interfaces/Interfaces'
import { useStore } from '../stores/StoreStore'
import { useCategory } from '../products/CategoriesList/CategoryStore'
import { CategoriesList } from '../products/CategoriesList/CategoriesList'
import { useApp } from '../../renderer/AppStore/UseApp'
import { ChildViewer } from '../../Components/ChildViewer/ChildViewer'
import { CategoriesPopup } from '../../Components/CategoriesPopup/CategoriesPopup'
import { FaRedo } from 'react-icons/fa'
import { CategoryItem } from '../../Components/CategoryItem/CategoryItem'
import { SaveButton } from '../../Components/SaveButton/SaveButton'
import { ClientCall } from '../../Components/Utils/functions'
import { useReplaceState } from '../../Hooks/useRepalceState'
import { Button } from '../../Components/Button/Button'
import { ConfirmDelete } from '../../Components/Confirm/ConfirmDelete'

export { Page }

function Page() {

  const { openChild } = useApp()
  const { category } = useData<Data>()
  const [collected, setCollected] = useState<Partial<CategoryInterface&{prevIcon?:string,prevView?:string}>>(category || {})
  const { currentStore } = useStore();
  const { fetchCategoryBy, createCategory, updateProduct,removeCategory } = useCategory()


  const { urlParsed } = usePageContext()
  const { myLocation, searchPared } = useReplaceState();
  const [is_newCategory, changeNewCategory] = useState(urlParsed.search['id'] == 'new')

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [nameError, setNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [iconError, setIconError] = useState('');
  const [viewError, setViewError] = useState('');

  const [loading, setLoading] = useState(false);
  const [isUpdated, changeUpdated] = useState(false);

  useEffect(() => {
    searchPared['id'] != 'new' && fetchCategoryBy({ category_id: searchPared['id'] }).then(res => {
      if (!res?.id) return;
      changeNewCategory(false)
      setCollected(res);
    })
  }, [currentStore, myLocation]);


  function isAllCollected(collected: Partial<CategoryInterface>, showError?: boolean) {
    if (!collected.name) {
      showError && setNameError('le nom doit contenir au moin 3 carateres')
      showError && nameRef.current?.focus()
      return false
    }
    if (!collected.description) {
      showError && setDescriptionError('la description doit contenir au moin 3 carateres')
      showError && descriptionRef.current?.focus()
      return false
    }
    if (!collected.view) return showError ? setViewError('cliquez sur le cadre pour ajouter une image') : false
    if (!collected.icon) return showError ? setIconError('cliquez sur le cadre pour ajouter une image') : false
    return true
  }
  const is_all_collected = isAllCollected(collected);

  const view = collected?.view?.[0];
  const icon = collected?.icon?.[0];

  return (
    <div className="category">
      <Topbar back={true} />
      <h3>Grande Image de couverture <Indicator title={`l'image qui contient un exemple visuel de la category`} description={`Nous nous recommandons, 1️⃣ D'utiliser une image de haute qualite, 2️⃣ grand format, 3️⃣ le contenu de l'image doit etre centre,`}/></h3>
      <div className="column">
        <label htmlFor='chose-category-view' className={"icon-180-category view shadow  "+(is_newCategory?'is-new':'cover-image')}  style={{
          background:
            view ? getImg(
              typeof view == 'string' ? view
                : collected.prevView,
              undefined, typeof view == 'string' ?
              currentStore?.url : undefined
            ) : getImg('/res/empty/drag-and-drop.png', '80%')
        }} >
          <input id='chose-category-view' multiple type="file" accept={'image/*,video/*'} style={{ display: 'none' }} onChange={(e) => {
            const files = e.currentTarget.files;
            console.log({ files });
            if (!files?.[0]) return
            setCollected((prev)=>({
              ...prev,
              view: Array.from(files),
              prevView:URL.createObjectURL(files[0])
            }))
            changeUpdated(true)
          }} />
          {
            !is_newCategory && <div className="edit"><RiImageEditFill className='edit-img'/></div>
          }
          {is_newCategory && !view && <span> <IoCloudUploadOutline />
            choisissez Image</span>}
            {
              // collected.view && 
            }
        </label>
      </div>
     <h3>Logo ou icon<Indicator title={`Cette image apparetra souvant en premiere position`} description='elle doit etre representative de la category'/></h3>
      <div className={"info-icon " + (is_newCategory ? 'is-new' : '')} >
        <label htmlFor='chose-category-icon' className="icon-140-category view shadow" style={{
          background:
            icon ? getImg(
              typeof icon == 'string' ? icon
                :collected.prevIcon,
              undefined, typeof icon == 'string' ?
              currentStore?.url : undefined
            ) : getImg('/res/empty/drag-and-drop.png', '80%')
        }}>
          <input id='chose-category-icon' multiple type="file" accept={'image/*,video/*'} style={{ display: 'none' }} onChange={(e) => {
            const files = e.currentTarget.files;
            if (!files?.[0]) return
            setCollected((prev)=>({
              ...prev,
              icon: Array.from(files),
              prevIcon:URL.createObjectURL(files[0])
            }))
            changeUpdated(true)
          }} />
           {
            !is_newCategory && <div className="edit"><RiImageEditFill className='edit-img'/></div>
          }
          {is_newCategory && !icon && <span> <IoCloudUploadOutline />
            choisissez Image</span>}
        </label>
        {!is_newCategory && <div className="stats">
          <h3>Donnee de Performance</h3>
          <h2 className='stats-category'><IoBagHandle /> Produits <span>{0}</span></h2>
          <h2 className='stats-command'><IoCart /> Command <span>{0}</span></h2>
          <h2 className='stats-categories'><IoApps /> Sous Categorie <span>{5}</span></h2>
        </div>}
      </div>
      <label className='editor' htmlFor='input-category-name'>Nom de la categorie <IoPencil /></label>
      <input ref={nameRef} className='editor' type="text" id={'input-category-name'} value={collected.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
        const name = e.currentTarget.value
        setCollected((prev)=>({
          ...prev,
          ['name']: name.substring(0, 52),
        }))
        changeUpdated(true)
      }} onKeyUp={(e) => {
        if (e.code == 'Enter') {
          const p = document.querySelector('#input-category-description') as HTMLTextAreaElement | null;
          p && p.focus()
        }
      }} onKeyDown={(e) => {
        if (e.code == 'Tab') {
          e.stopPropagation();
          e.preventDefault();
          const p = document.querySelector('#input-category-description') as HTMLTextAreaElement | null;
          p && p.focus()
        }
      }} />
      <label className='editor' htmlFor='input-category-description'>Description <IoPencil /></label>
      <textarea className='editor' id="input-category-description" placeholder='Ajoutez la description du produit' cols={10} rows={1} ref={ref => {
        if (!ref) return
        descriptionRef.current = ref;
        if ((ref as any).init) return
        (ref as any).init = 'init';
        function autoResizeTextarea(ref: HTMLTextAreaElement) {
          ref.style.height = 'auto';
          if (ref.scrollHeight > 300) {
            ref.style.overflowY = 'auto';
            ref.style.overflowX = 'hidden';
          } else {
            ref.style.overflowY = 'hidden';
            ref.style.overflowX = 'hidden';
          }
          ref.style.height = ref.scrollHeight + 'px';
        }
        window.addEventListener('resize', function () {
          autoResizeTextarea(ref);
        })
        ref.addEventListener('input', function () {
          autoResizeTextarea(ref);
        });
        setTimeout(() => {
          autoResizeTextarea(ref);
        }, 200);
      }} value={collected.description} onChange={(e) => {
        const description = e.currentTarget.value
        setCollected((prev)=>({
          ...prev,
          ['description']: description.substring(0, 512),
        }));
        changeUpdated(true)
      }} onKeyDown={(e) => {
        if (e.code == 'Tab') {
          // si un autre input en bas
        }
      }}></textarea>
      <h3>Ajoutez en tant que sous Category<span>(facultatif)</span></h3>
      <div className='category-ctn'>
        <div className={`icon ${collected.parent_category_id ? 'replace' : 'add'}`} onClick={() => {
          openChild(<ChildViewer title='Choisissez la category parent'>
            <CategoriesPopup onSelected={(c) => {
              setCollected((prev)=>({
                ...prev,
                parent_category_id: c.id
              }))
              changeUpdated(true)
            }} />
          </ChildViewer>, { blur: 10 })
        }}>
          {collected.parent_category_id ? <FaRedo /> : <IoAdd />}
          <span>{collected.parent_category_id ? 'remplacez' : 'ajoutez'}</span>
        </div>
        {
          collected.parent_category_id && <CategoryItem key={collected.parent_category_id}
            openCategory category_id={collected.parent_category_id} onDelete={(c) => {
              setCollected((prev)=>({
                ...prev,
                parent_category_id: ''
              }))
              changeUpdated(true)
            }} />
        }
      </div>
      <div className="setting-product">
      {
        !is_newCategory && <>
          <Button title='Voir les stats' icon={<IoLayers />} />
          <Button title='Supprimer' icon={<IoTrash />} onClick={() => {
            openChild(<ChildViewer>
              <ConfirmDelete title={`Etes vous sur de vouloir suprimer la categorie "${collected.name}"`} onCancel={() => {
                openChild(null);
              }} onDelete={() => {
                collected.id && removeCategory(collected.id);
                openChild(null);
              }} />
            </ChildViewer>, {
              background: '#3455',
            })
          }} />
        </>
      }
    </div>
      {
        is_newCategory ?
          <SaveButton loading={loading} effect='color' title={is_all_collected ? 'Cree la Categorie' : 'Ajoutez toutes informations requises'}
            required={is_all_collected}
            onClick={() => {

              if (loading) return console.log('onLoading');
              if (!isAllCollected(collected, true)) return console.log('informations incomplete');
              setLoading(true);

              createCategory(collected).then(res => {
                setTimeout(() => {
                  setLoading(false)
                  changeUpdated(false);
                }, 1000);
                if (!res?.id) return;
                setCollected(res);
                history.replaceState(null, "", `/category?id=${res.id}`);
              });
            }} /> :
          <SaveButton loading={loading} effect='color'
            title={isUpdated ? (is_all_collected ? 'Sauvegardez les modifications' : 'Certaines Informations sont Incorrectes') : 'Aucune modification'}
            required={isUpdated && is_all_collected}
            onClick={() => {

              if (!isUpdated) return console.log('aucun changement');
              if (loading) return console.log('onLoading');
              if (!isAllCollected(collected, true)) return console.log('informations incomplete');
              setLoading(true);
              
              updateProduct(collected).then(res => {
                setTimeout(() => {
                  setLoading(false)
                  changeUpdated(false);
                }, 1000);
                if (!res?.id) return;
                setCollected(res);
              })

            }} />
      }
      {!is_newCategory && <ProductList />}
    </div>
  )
}
