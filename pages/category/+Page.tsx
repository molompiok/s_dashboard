import { IoAdd, IoApps, IoBagHandle, IoCart, IoChevronBack, IoCloudUploadOutline, IoLayers, IoPencil, IoTrash } from 'react-icons/io5'
import { RiImageEditFill } from 'react-icons/ri'
import './Page.css'
import { Indicator } from '../../Components/Indicator/Indicator'
import { ProductList } from '../../Components/ProductList/ProductList'
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
import { useCategory } from './CategoryStore'
import { CategoriesList } from '../../Components/CategoriesList/CategoriesList'
import { useApp } from '../../renderer/AppStore/UseApp'
import { ChildViewer } from '../../Components/ChildViewer/ChildViewer'
import { CategoriesPopup } from '../../Components/CategoriesPopup/CategoriesPopup'
import { FaRedo } from 'react-icons/fa'
import { CategoryItem } from '../../Components/CategoryItem/CategoryItem'
import { SaveButton } from '../../Components/SaveButton/SaveButton'
import { ClientCall, debounce } from '../../Components/Utils/functions'
import { useMyLocation } from '../../Hooks/useRepalceState'
import { Button } from '../../Components/Button/Button'
import { ConfirmDelete } from '../../Components/Confirm/ConfirmDelete'
import { PageNotFound } from '../../Components/PageNotFound/PageNotFound'
import { MarkdownEditor2 } from '../../Components/MackdownEditor/MarkdownEditor'
// import { MarkdownEditor2 } from '../../Components/MackdownEditor/MarkdownEditor'

export { Page }

function Page() {

  const { openChild } = useApp()
  const { category: categoryData } = useData<Data>()
  const [category, setCategory] = useState<Partial<CategoryInterface & { prevIcon?: string, prevView?: string }>>(categoryData || {})
  const { currentStore } = useStore();
  const { fetchCategoryBy, createCategory, updateCategory, removeCategory } = useCategory()

  const { urlParsed } = usePageContext()
  const { searchPared } = useMyLocation();
  const [is_newCategory, changeNewCategory] = useState(urlParsed.search['id'] == 'new')

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [nameError, setNameError] = useState('');

  const [descriptionError, setDescriptionError] = useState('');
  const [iconError, setIconError] = useState('');
  const [viewError, setViewError] = useState('');

  const [loading, setLoading] = useState(false);
  const [isUpdated, changeUpdated] = useState('' as 'change' | 'auto-save' | '');
  const [s] = useState({
    searchPared,
    init: false,
    is_newCategory,
    collected: {} as Partial<CategoryInterface>
  })
  s.searchPared = searchPared;
  s.is_newCategory =is_newCategory;

  // console.log(category);

  function isAllCollected(collected: Partial<CategoryInterface>, showError?: boolean) {

    let v: void | boolean = true;

    if (!collected.name || collected.name.length < 3) {
      showError && setNameError('le nom doit contenir au moin 3 carateres')
      showError && nameRef.current?.focus()
      v = false
    }
    if (!collected.description || collected.description.length < 3) {
      showError && setDescriptionError('la description doit contenir au moin 3 carateres')
      showError && descriptionRef.current?.focus()
      v = false
    }
    if (!collected.view || collected.view.length <= 0) v = (showError ? setViewError('cliquez sur le cadre pour ajouter une image') : false)
    if (!collected.icon || collected.icon.length <= 0) v = (showError ? setIconError('cliquez sur le cadre pour ajouter une image') : false)
    return v
  }

  const saveRequired = (category: Partial<CategoryInterface>) => {
    if (!isUpdated) return console.log('aucun changement');
    if (loading) return console.log('onLoading');
    if (!isAllCollected(category, true)) return console.log('informations incomplete');
    setLoading(true);
    s.collected.id = category.id
    updateCategory(s.collected).then(res => {
      setTimeout(() => {
        setLoading(false)
        s.collected = {};
        changeUpdated('')
        if (isUpdated == 'auto-save') {
          return
        }
        if (!res?.id) return;
        setCategory(res)
      }, 1000);
    })
  }

  const updateLocalData = (cb: (current: Partial<CategoryInterface>) => Partial<CategoryInterface>) => {
    setCategory((current) => {
      const d = cb({});
      s.collected = { ...s.collected, ...d }
      return { ...current, ...d }
    });
  }

  useEffect(() => {
    currentStore && !s.init && s.searchPared['id'] != 'new' && fetchCategoryBy({ category_id: s.searchPared['id'] }).then(res => {
      s.init = true
      if (!res?.id) {
        return
      };
      changeUpdated('')
      changeNewCategory(false);
      setCategory(res)
      s.collected = {}
    })
  }, [currentStore, searchPared]);

  useEffect(() => {
    isUpdated == 'auto-save'&& !s.is_newCategory && debounce(() => {
      saveRequired(category)
    }, 'auto-save', 3000)
  }, [category, isUpdated])

  const is_all_collected = isAllCollected(category);
  const view = category?.view?.[0];
  const icon = category?.icon?.[0];

  return (s.searchPared['id'] != 'new' && !category.id) ? <PageNotFound title={`Cette categorie n'a pas été trouvé`} description='' /> : (
    <div className="category">
      <Topbar back={true} />
      <h3>Grande Image de couverture <Indicator title={`l'image qui contient un exemple visuel de la category`} description={`Nous vous recommandons, 1️⃣ D'utiliser une image de haute qualite, 2️⃣ grand format, 3️⃣ le contenu de l'image doit etre centre,`} /></h3>
      <div className="column">
        <label htmlFor='chose-category-view' className={`icon-180-category view shadow  ${(is_newCategory ? 'is-new' : 'cover-image')} ${viewError ? 'error' : ''} `} style={{
          background:
            view ? getImg(
              typeof view == 'string' ? view
                : category.prevView,
              undefined, typeof view == 'string' ?
              currentStore?.url : undefined
            ) : getImg('/res/empty/drag-and-drop.png', '80%')
        }} >
          <input id='chose-category-view' type="file" accept={'image/*'} style={{ display: 'none' }} onChange={(e) => {
            const files = e.currentTarget.files;
            console.log({ files });
            if (!files?.[0]) return
            updateLocalData((prev) => ({
              ...prev,
              view: Array.from(files),
              prevView: URL.createObjectURL(files[0])
            }))
            changeUpdated('auto-save')
            setViewError('')
          }} />
          {
            !is_newCategory && !viewError && <div className="edit"><RiImageEditFill className='edit-img' /></div>
          }
          {(is_newCategory || viewError) && !view && <span> <IoCloudUploadOutline />
            choisissez l'Image</span>}
        </label>
      </div>
      <h3>Logo ou icon<Indicator title={`Cette image apparetra souvant en premiere position`} description='elle doit etre representative de la category' /></h3>
      <div className={"info-icon " + (is_newCategory ? 'is-new' : '')} >
        <label htmlFor='chose-category-icon' className={`icon-140-category view shadow ${iconError ? 'error' : ''} `} style={{
          background:
            icon ? getImg(
              typeof icon == 'string' ? icon
                : category.prevIcon,
              undefined, typeof icon == 'string' ?
              currentStore?.url : undefined
            ) : getImg('/res/empty/drag-and-drop.png', '80%')
        }}>
          <input id='chose-category-icon' type="file" accept={'image/*'} style={{ display: 'none' }} onChange={(e) => {
            const files = e.currentTarget.files;
            if (!files?.[0]) return
            updateLocalData((prev) => ({
              ...prev,
              icon: Array.from(files),
              prevIcon: URL.createObjectURL(files[0])
            }))
            changeUpdated('auto-save')
            setIconError('')
          }} />
          {
            !is_newCategory && !iconError && <div className="edit"><RiImageEditFill className='edit-img' /></div>
          }
          {(is_newCategory || iconError) && !icon && <span> <IoCloudUploadOutline />
            choisissez l'Image</span>}
        </label>
        {!is_newCategory && <div className="stats">
          <h3>Donnee de Performance</h3>
          <h2 className='stats-category'><IoBagHandle /> Produits <span>{category.product_count}</span></h2>
          <h2 className='stats-command'><IoCart /> Command <span>{0}</span></h2>
          <h2 className='stats-categories'><IoApps /> Sous Categorie <span>{5}</span></h2>
        </div>}
      </div>
      <label className='editor' htmlFor='input-category-name'>Nom de la categorie <IoPencil /></label>
      <input ref={nameRef} className={`editor ${nameError ? 'error' : ''}`} type="text" id={'input-category-name'} value={category.name || ''} placeholder="Ajoutez un nom de produit" onChange={(e) => {
        const name = e.currentTarget.value
        updateLocalData((prev) => ({
          ...prev,
          ['name']: name.replace(/\s+/g, ' ').substring(0, 512),
        }))
        changeUpdated('auto-save');
        setNameError('')
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
      <div className="input-message"><span className='error-message'>{nameError}</span><span className='right'></span>{(category.name?.trim()?.length || 0)} / 32</div>
      <label className='editor'>Description <IoPencil /></label>
      {<MarkdownEditor2 value={category.description || ''} setValue={(value) => {
        updateLocalData((prev) => ({
          ...prev,
          ['description']: value.substring(0, 1024),
        }))
        changeUpdated('auto-save')
      }} />}
      {/* <textarea className={`editor ${descriptionError?'error':''}`} id="input-category-description" placeholder='Ajoutez la description du produit' cols={10} rows={1} ref={ref => {
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
      }} value={category.description} onChange={(e) => {
        const description = e.currentTarget.value
        setCollected((prev) => ({
          ...prev,
          ['description']: description.replace(/\s+/g, ' ').substring(0, 512),
        }));
        setDescriptionError('')
        changeUpdated('auto-save')
      }} onKeyDown={(e) => {
        if (e.code == 'Tab') {
          // si un autre input en bas
        }
      }}></textarea> */}
      <div className="input-message"><span className='error-message'>{descriptionError}</span><span className='right'>{(category.description?.trim()?.length || 0)} / 512</span></div>
      <h3 style={{ marginTop: '12px' }}>Ajoutez en tant que sous Category<span>(facultatif)</span></h3>
      <div className='category-ctn'>
        <div className={`icon ${category.parent_category_id ? 'replace' : 'add'}`} onClick={() => {
          openChild(<ChildViewer title='Choisissez la category parent'>
            <CategoriesPopup ignore={[category?.id || '']} onSelected={(c) => {
              updateLocalData((prev) => ({
                ...prev,
                parent_category_id: c.id
              }))
              changeUpdated('auto-save')
            }} />
          </ChildViewer>, { background: '#3455', back: false })
        }}>
          {category.parent_category_id ? <FaRedo /> : <IoAdd />}
          <span>{category.parent_category_id ? 'remplacez' : 'choisissez'}</span>
        </div>
        {
          category.parent_category_id && <CategoryItem key={category.parent_category_id}
            openCategory category_id={category.parent_category_id}
            onDelete={(c) => {
              updateLocalData((prev) => ({
                ...prev,
                parent_category_id: ''
              }))
              changeUpdated('auto-save')
            }} />
        }
      </div>
      <div className="setting-product">
        {
          !is_newCategory && <>
            <Button title='Voir les stats' icon={<IoLayers />} />
            <Button title='Supprimer' icon={<IoTrash />} onClick={() => {
              openChild(<ChildViewer>
                <ConfirmDelete title={`Etes vous sur de vouloir suprimer la categorie "${category.name}"`} onCancel={() => {
                  openChild(null);
                }} onDelete={() => {
                  category.id && removeCategory(category.id).then(res => {
                    console.log('delete,====>>>', res);
                    if (res) {
                      setCategory({});
                      s.collected = {}
                    }
                  });
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
              if (!isAllCollected(category, true)) return console.log('informations incomplete');
              setLoading(true);

              createCategory(category).then(res => {
                setTimeout(() => {
                  setLoading(false)
                  changeUpdated('');
                }, 1000);
                if (!res?.id) return;
                setCategory(res);
                s.collected = {};
                history.replaceState(null, "", `/category?id=${res.id}`);
              });
            }} /> :
          <SaveButton loading={loading} effect='color'
            title={isUpdated ? (is_all_collected ? 'Sauvegardez les modifications' : 'Certaines Informations sont Incorrectes') : 'Aucune modification'}
            required={!!isUpdated && is_all_collected}
            onClick={() => saveRequired(category)} />
      }
      {/* {!is_newCategory && <ProductList key={searchPared['id']} baseFilter={{categories_id:[searchPared['id']]}}/>} */}
    </div>
  )
}

