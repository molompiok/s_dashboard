import { IoChevronDown, IoChevronForward, IoChevronUp, IoEllipsisHorizontal, IoPencil, IoPeopleSharp, IoPricetag, IoStarHalf, IoTrash } from 'react-icons/io5'
import { MarkdownEditor2 } from '../../../../Components/MackdownEditor/MarkdownEditor'
import { Topbar } from '../../../../Components/TopBar/TopBar'
import { getImg } from '../../../../Components/Utils/StringFormater'
import { useStore } from '../../../stores/StoreStore'
import './+Page.css'
import { ClientCall, limit, shortNumber } from '../../../../Components/Utils/functions'
import { markdownToPlainText, MarkdownViewer } from '../../../../Components/MarkdownViewer/MarkdownViewer'
import { DetailInterface, ListType, ProductInterface } from '../../../../Interfaces/Interfaces'
import { useProductStore } from '../../ProductStore'
import { usePageContext } from '../../../../renderer/usePageContext'
import { useEffect, useState } from 'react'
import { useDetailStore } from './DetailStore'
import { getDefaultValues } from '../../../../Components/Utils/parseData'
import { Indicator } from '../../../../Components/Indicator/Indicator'
import { DETAIL_LIMIT } from '../../../../Components/Utils/constants'
import { useApp } from '../../../../renderer/AppStore/UseApp'
import { ChildViewer } from '../../../../Components/ChildViewer/ChildViewer'
import { Comfirm } from '../../../../Components/Confirm/Confirm'
import { ConfirmDelete } from '../../../../Components/Confirm/ConfirmDelete'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductPreview } from '../../../../Components/ProductPreview/ProductPreview'
import { PageNotFound } from '../../../../Components/PageNotFound/PageNotFound'
import { Server_Host } from '../../../../renderer/+config'
export { Page }
const details: DetailInterface[] = [
  {
    id: '1',
    product_id: 'P001',
    title: 'Sac à dos urbain',
    description: `
# 📝 Test Complet du Markdown

## 1️⃣ **Texte Basique**
- **Gras**
- *Italique*
- ~~Barré~~
- __Souligné__ (via HTML : \`<u>texte</u>\`)

---

## 2️⃣ **Titres & Listes**
### ✅ Listes non ordonnées :
- Éléments avec \`-\`
- Second élément  
  - Sous-élément avec \`-\`
  - Encore un sous-élément

### 🔢 Listes ordonnées :
1. Premier élément
2. Deuxième élément
   1. Sous-élément 1
   2. Sous-élément 2
3. Troisième élément

---

## 3️⃣ **Liens & Images**
- [🔗 Lien vers Google](https://www.google.com)  
- ![🌄 Image](https://via.placeholder.com/150)

---

## 4️⃣ **Code & Syntaxe**
### 👨‍💻 Code en ligne :
Voici un exemple de \`console.log("Hello, Markdown!")\`

### 🖥️ Bloc de code multi-lignes :
\`\`\`js
function test() {
  console.log("Markdown est génial !");
}
test();

      `,
    view: ['/res/store_img_1.png'],
    index: 0
  },
  {
    id: '2',
    product_id: 'P002',
    title: 'Montre connectée avec suivi d\'activité et notifications intelligentes',
    description: `## ⌚ Montre Connectée  
  Une **montre intelligente** pour suivre votre santé et rester connecté :  
  - 📊 Suivi du sommeil et fréquence cardiaque  
  - 🔔 Notifications d’appels et messages  
  - 🔋 Autonomie de 10 jours`,
    view: ['/res/store_img_2.png'],
    index: 1
  },
  {
    id: '3',
    product_id: 'P003',
    title: 'Casque Bluetooth sans fil',
    description: `### 🎧 Casque Bluetooth  
  Profitez d’un **son exceptionnel** avec ce casque sans fil :  
  - 🔊 Réduction de bruit active  
  - 🎶 Basses profondes et audio HD  
  - 🔋 Jusqu’à 30h d’autonomie`,
    view: ['/res/store_img_3.png'],
    index: 2
  },
  {
    id: '4',
    product_id: 'P004',
    title: 'Lampe LED de bureau minimaliste et élégante',
    description: `## 💡 Lampe LED  
  Illuminez votre espace de travail avec une **lampe design et fonctionnelle** :  
  - 💡 Lumière ajustable (blanche, chaude)  
  - 🔌 Recharge USB intégrée  
  - 🎨 Design épuré`,
    view: ['/res/store_img_4.png'],
    index: 3
  },
];


function Page() {
  const { fetchProductBy } = useProductStore();
  const { routeParams } = usePageContext()
  const [product, setProduct] = useState<Partial<ProductInterface>>()
  const { currentStore } = useStore();
  const { updateDetail, createDetail, fetchDetails, deleteDetail } = useDetailStore()
  const { openChild } = useApp()
  const [loading, setLoading] = useState(false)
  const [s] = useState({
    init_product: false,
  })

  const [details, setDetails] = useState<ListType<DetailInterface>>()
  const saveRequired = async (c: Partial<DetailInterface> & { id: string }) => {
    return await updateDetail(c, false).then(res => {
      openChild(null)
      if (!res?.id) return
      (res as any).update = true;
      setDetails((current) => current && ({
        ...current,
        list: (current.list || []).map(a => a.id == res.id ? res : a)
      }))
      return res
    })
  }
  function openDetailOption(d: Partial<DetailInterface>, mode: 'add' | 'edit') {
    openChild(<ChildViewer>
      <DetailInfo detail={d || {} as any} setDetail={(_d) => {
        // const id =  detail?.id || d.id;
        //  id  && saveRequired({...d, id});


        if (mode == 'add') {
          product?.id && createDetail({ ..._d, product_id: product.id }).then(res => {
            openChild(null)
            if (!res?.id) return
            setDetails((current) => current && ({
              ...current,
              list: [res, ...(current.list || [])]
            }))
          })
        } else if (mode == 'edit') {
          d?.id && saveRequired({ ..._d, id: d.id } as any)
        }
      }} onCancel={() => {
        openChild(null)
      }} />
    </ChildViewer>, {
      background: '#3455'
    })
  }

  const resetDetails = () => {
    fetchDetails({ product_id: routeParams.id }).then(res => {
      setDetails(res)
    })
  }
  useEffect(() => {
    currentStore && fetchProductBy({ product_id: routeParams.id }).then(res => {
      if (!res?.id) return
      setProduct(res)
    })
    currentStore && resetDetails()
  }, [currentStore])

  console.log(details);

  const is_detail_max = (details?.list?.length || 0) >= DETAIL_LIMIT;
  return <div className="page-detail">
    <Topbar />
    {product && <ProductPreview product={product} />}
    <div className="add">
      <h2 style={{ flexWrap: 'wrap' }}> Les details du produit <b className='prompt'>( {details?.list.length || 0} / {DETAIL_LIMIT} )</b>
        <Indicator title=''
          description={!is_detail_max ? `Vous pouvez ajoueter jusqu\'a ${DETAIL_LIMIT} details par produit` : `Vous avez atteint la limit de ${DETAIL_LIMIT} details par produit`}
        />
      </h2>
      {<span style={{ display: is_detail_max ? 'none' : '' }} onClick={() => {
        if (is_detail_max) return
        openDetailOption({}, 'add')
      }}>Ajoutez</span>}
    </div>
    <div className="details">

      <AnimatePresence>
        {
          details?.list.map((d, i) => (
            <motion.div
              key={d.id}
              layout // ← magie ici pour les animations d'ordre
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >

              <Detail key={d.id + ((d as any).update ? ClientCall(Math.random, 0) : '')} detail={d}
                canUp={d.index+1<details.list.length}
                canDown={d.index>0}
                onDelete={() => {
                  openChild(<ChildViewer>
                    <ConfirmDelete title='Etez vous sur de vouloir supprimer cet detail du produit ' onCancel={() => {
                      openChild(null);
                    }} onDelete={() => {
                      if (loading) return;
                      openChild(null);
                      setLoading(false);
                      deleteDetail({ detail_id: d.id }).then(res => {
                        setLoading(false)
                        if (res) {
                          setDetails((current) => current && ({
                            ...current,
                            list: current.list.filter(_d => _d.id != d.id)
                          }))
                        }
                      }
                      )
                    }} />
                  </ChildViewer>, {
                    background: '#3455'
                  })
                }} onOption={() => {
                  openDetailOption(d, 'edit')
                }} onDown={() => {
                  const index = d.index - 1;
                  if (index < 0) return
                  saveRequired({ index: d.index - 1, id: d.id }).then((res) => {
                    resetDetails();
                  })
                }} onUp={() => {
                  const index = d.index + 1;
                  if (index >= (details?.list.length || 0)) return
                  saveRequired({ index: d.index + 1, id: d.id }).then((res) => {
                    resetDetails();
                  })
                }}/>
            </motion.div>
          ))
        }
      </AnimatePresence>
      {
        (details?.list.length||0)==0 && <PageNotFound  
        url={Server_Host+'/demo/details'} 
        image='/res/font.png' 
        description={`Les details du produit sont compsee d'un titre, une description, et une image de haite qualite`} 
        title={`Ajoutez un detail a ce produit`} 
        forward='Voir comment ajouter detail'
        iconForwardBefore={null}
        iconForwardAfter={<IoChevronForward/>}
        />
      }
    </div>
  </div>
}


function Detail({ detail, onDelete, onOption, onUp, onDown,canDown,canUp }: {canDown?:boolean,canUp?:boolean, onDown: () => void, onUp: () => void, onOption: () => void, onDelete: () => void, detail: Partial<DetailInterface & { prevView?: string }> }) {
  const view = detail?.view?.[0];
  const { currentStore } = useStore()
  return <div className="detail">
    <div className="top">
      <div className="icon-140 view" style={{
        background:
          view ? getImg(
            typeof view == 'string' ? view
              : detail.prevView,
            undefined, typeof view == 'string' ?
            currentStore?.url : undefined
          ) : getImg('/res/empty/drag-and-drop.png', '160%')
      }}></div>
      <div className="right">
        <div className="options">
          <IoChevronUp onClick={onUp} style={{opacity:canUp?1:0, visibility:canUp?'visible':'hidden'}}/>
          <IoChevronDown onClick={onDown} style={{opacity:canDown?1:0, visibility:canDown?'visible':'hidden'}}/>
          <IoTrash onClick={onDelete} />
          <IoEllipsisHorizontal onClick={onOption} />
        </div>
        <h2 className={!detail.title ? 'empty' : ''}>{limit(detail.title, 124)}</h2>
      </div>
    </div>

    <MarkdownViewer markdown={limit(detail.description, 360).split('\n').slice(0, 5).join('\n') || ' '} />
  </div >
}

function DetailInfo({ detail, setDetail, onCancel }: { onCancel: () => void, detail: Partial<DetailInterface & { prevView?: string }>, setDetail: (detail: Partial<DetailInterface & { prevView?: string }>) => void }) {
  const { currentStore } = useStore()
  const [collected, setCollected] = useState<Partial<DetailInterface & { prevView?: string }>>(detail || {})
  const view = collected?.view?.[0];
  const [accu, setAccu] = useState<Partial<DetailInterface & { prevView?: string }>>({})

  const setBoth = (cb: (b: Partial<DetailInterface & { prevView?: string }>) => Partial<DetailInterface & { prevView?: string }>) => {
    const b = cb({});
    setCollected((current) => ({
      ...current,
      ...b
    }))
    setAccu((current) => ({
      ...current,
      ...b
    }))
  }

  const [loading, setLoading] = useState(false)
  return <div className="detail-info">
    <div className="top">
      <label htmlFor='detail-view' className={` view`} style={{
        background:
          view ? getImg(
            typeof view == 'string' ? view
              : collected?.prevView,
            undefined, typeof view == 'string' ?
            currentStore?.url : undefined
          ) : getImg('/res/empty/drag-and-drop.png', '70%')
      }} >
        <input id='detail-view' type="file" accept={'image/*'} style={{ display: 'none' }} onChange={(e) => {
          const files = e.currentTarget.files;
          console.log({ files });
          if (!files?.[0]) return
          setBoth((current) => ({
            ...current,
            view: Array.from(files),
            prevView: URL.createObjectURL(files[0])
          }))
        }} />
      </label>
      <div className="options"></div>
    </div>
    <label className='editor' htmlFor='input-detail-title'>Detail du Produit <IoPencil /></label>
    <input className={`editor `} type="text" id={'input-detail-title'} value={collected.title || ''} placeholder="Ajoutez un title au detail du produit" onChange={(e) => {
      const title = e.currentTarget.value
      setBoth((current) => ({
        ...current,
        title: title.replace(/\s+/g, ' ').substring(0, 56),
      }));
    }} onKeyUp={(e) => {
      if (e.code == 'Enter') {
        const p = document.querySelector('.ProseMirror.toastui-editor-contents') as HTMLTextAreaElement | null;
        p && p.focus()
      }
    }} onKeyDown={(e) => {
      if (e.code == 'Tab') {
        e.stopPropagation();
        e.preventDefault();
        const p = document.querySelector('.ProseMirror.toastui-editor-contents') as HTMLTextAreaElement | null;
        p && p.focus()
      }
    }} />
    <div className="input-message"><span className='right'>{(collected.title?.trim()?.length || 0)} / 56</span></div>
    <label className='editor' htmlFor='input-product-description'>Description <IoPencil /></label>

    {<MarkdownEditor2 value={collected.description || ' '} setValue={(value) => {
      setBoth((current) => ({
        ...current,
        description: value.substring(0, 1024)
      }));
    }} />}
    <div className="input-message"><span className='right'>{(collected.description?.trim()?.length || 0)} / 1024</span></div>
    <Comfirm canConfirm={!!(collected.title || collected.description || collected.prevView) && !loading} onCancel={onCancel} confirm='Ok' onConfirm={() => {
      setDetail(accu);
      console.log({ accu });

      setLoading(true)
    }} iconConfirmLeft={loading ? <div className='icon-25' style={{ background: getImg('/res/loading.gif') }}></div> : undefined}
    />
  </div >
}