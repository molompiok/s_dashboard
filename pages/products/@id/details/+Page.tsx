import { IoPencil } from 'react-icons/io5'
import { MarkdownEditor2 } from '../../../../Components/MackdownEditor/MarkdownEditor'
import { Topbar } from '../../../../Components/TopBar/TopBar'
import { getImg } from '../../../../Components/Utils/StringFormater'
import { useStore } from '../../../stores/StoreStore'
import './+Page.css'
import { limit } from '../../../../Components/Utils/functions'
import { MarkdownViewer } from '../../../../Components/MarkdownViewer/MarkdownViewer'
import { DetailInterface, ProductInterface } from '../../../../Interfaces/Interfaces'
import { useProductStore } from '../../ProductStore'
import { usePageContext } from '../../../../renderer/usePageContext'
import { useEffect, useState } from 'react'
import { useDetailStore } from './DetailStore'

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
    {
      id: '5',
      product_id: 'P005',
      title: 'Clavier mécanique gamer RGB',
      description: `### ⌨️ Clavier Mécanique RGB  
  Un clavier **ultra réactif** pour une expérience gaming ultime :  
  - 🎮 Switchs mécaniques rapides  
  - 🌈 Rétroéclairage RGB personnalisable  
  - 🔗 Connexion filaire et sans fil`,
      view: ['/res/store_img_5.png'],
      index: 4
    },
    {
      id: '6',
      product_id: 'P006',
      title: 'Bouteille thermique en inox',
      description: `## 🥤 Bouteille Isotherme  
  Gardez vos boissons **chaudes ou froides** toute la journée :  
  - 🌡️ Maintient la température 12h chaud / 24h froid  
  - 🚀 Acier inoxydable durable  
  - 💧 Sans BPA`,
      view: ['/res/store_img_1.png'],
      index: 5
    },
    {
      id: '7',
      product_id: 'P007',
      title: 'Chargeur rapide USB-C 65W',
      description: `### ⚡ Chargeur Rapide  
  Rechargez vos appareils **à la vitesse éclair** :  
  - 🔌 65W compatible PC/Mac/smartphone  
  - 🚀 Charge 50% en 30 minutes  
  - 🔄 Câble USB-C inclus`,
      view: ['/res/store_img_2.png'],
      index: 6
    },
    {
      id: '8',
      product_id: 'P008',
      title: 'Chaussures de running ultra-légères et respirantes',
      description: `## 👟 Chaussures de Running  
  Confort et performance pour vos courses :  
  - 🏃 Amorti dynamique  
  - 🌬️ Tissu respirant et léger  
  - 🏅 Semelle antidérapante`,
      view: ['/res/store_img_3.png'],
      index: 7
    },
    {
      id: '9',
      product_id: 'P009',
      title: 'Tablette tactile 10 pouces Full HD',
      description: `### 📱 Tablette 10" Full HD  
  Une **tablette puissante** pour travail et loisirs :  
  - 🖥️ Écran 10” Full HD  
  - ⚡ Processeur rapide & 8Go RAM  
  - 🔋 Autonomie de 12h`,
      view: ['/res/store_img_4.png'],
      index: 8
    },
    {
      id: '10',
      product_id: 'P010',
      title: 'Enceinte Bluetooth portable étanche',
      description: `## 🔊 Enceinte Bluetooth  
  Profitez de votre **musique partout** :  
  - 🎶 Son puissant & basses profondes  
  - 🌊 Résistante à l’eau IPX7  
  - 🔋 Jusqu’à 20h d’autonomie`,
      view: ['/res/store_img_5.png'],
      index: 9
    },
    {
      id: '11',
      product_id: 'P011',
      title: 'Gants tactiles pour écran et protection thermique',
      description: `### 🧤 Gants Hiver Tactiles  
  Gardez vos mains au chaud tout en utilisant votre smartphone :  
  - 🖐️ Compatible écrans tactiles  
  - ❄️ Protection thermique renforcée  
  - 🚴‍♂️ Idéal pour vélo, randonnée`,
      view: ['/res/store_img_1.png'],
      index: 10
    },
    {
      id: '12',
      product_id: 'P012',
      title: 'Kit de pinceaux de maquillage professionnel 24 pièces',
      description: `## 💄 Kit Pinceaux Pro  
  Un ensemble **complet** pour un maquillage impeccable :  
  - 🖌️ 24 pinceaux haute qualité  
  - 🛍️ Pochette de rangement incluse  
  - 🌿 Poils synthétiques doux`,
      view: ['/res/store_img_2.png'],
      index: 11
    }
  ];
  

function Page() {
    const { fetchProductBy } = useProductStore();
    const { routeParams } = usePageContext()
    const [product, setProduct] = useState<Partial<ProductInterface>>()
    const { currentStore } = useStore();
    const  {updateDetail} =  useDetailStore()
    const [s] = useState({
      init_product: false,
    })
  
    useEffect(() => {
      !s.init_product&& currentStore && fetchProductBy({ product_id: routeParams.id }).then(res => {
        if (!res?.id) return
        s.init_product = true;
        setProduct(res)
      })
    }, [currentStore])
  
    const saveRequired = async (collected:Partial<DetailInterface>&{id:string}) => {
      try {
        if (!collected) return;
        const res = await updateDetail(collected,true);
        setTimeout(() => {
          console.log('Save Value Button ', res);
          if (!res?.id) return;
          console.log('reset value  Product  ', res);
        }, 1000);
      } catch (error) {
        
      }
    }

    return <div className="page-detail">
        <Topbar />
        <div className="product-preview"></div>
        <div className="details">
            {
                details.map((d, i) => (
                    <Detail key={d.id} detail={d} setDetail={() => {

                    }} />
                ))
            }
        </div>
    </div>
}


function Detail({ detail, setDetail }: { detail: Partial<DetailInterface & { prevView?: string }>, setDetail: (detail: Partial<DetailInterface & { prevView?: string }>) => void }) {
    const view = detail?.view?.[0];
    return <div className="detail">
        <div className="top">
            <div className="icon-140 view" style={{
                background:
                    view ? getImg(
                        typeof view == 'string' ? view
                            : detail.prevView,
                        undefined, typeof view == 'string' ?
                        /*currentStore?.url*/ undefined : undefined
                    ) : getImg('/res/empty/drag-and-drop.png', '160%')
            }}></div>
            <div className="options"></div>
            <h2 className={!detail.title?'empty':''}>{limit(detail.title,124)}</h2>
        </div>
       
        <MarkdownViewer markdown={limit(detail.description,2000)|| ' '}/>
    </div >
}

function DetailInfo({ detail, setDetail }: { detail: Partial<DetailInterface & { prevView?: string }>, setDetail: (detail: Partial<DetailInterface & { prevView?: string }>) => void }) {
    const { currentStore } = useStore()
    const view = detail?.view?.[0];
    return <div className="detail-info">
        <div className="top">
            <label htmlFor='detail-view' className={`icon-180-category view`} style={{
                minWidth:'180px',
                background:
                    view ? getImg(
                        typeof view == 'string' ? view
                            : detail.prevView,
                        undefined, typeof view == 'string' ?
                        currentStore?.url : undefined
                    ) : getImg('/res/empty/drag-and-drop.png', '80%')
            }} >
                <input id='detail-view' type="file" accept={'image/*'} style={{ display: 'none' }} onChange={(e) => {
                    const files = e.currentTarget.files;
                    console.log({ files });
                    if (!files?.[0]) return
                    setDetail({
                        ...detail,
                        view: Array.from(files),
                        prevView: URL.createObjectURL(files[0])
                    })
                }} />
            </label>
            <div className="options"></div>
        </div>
        <label className='editor' htmlFor='input-detail-title'>Nom du Produit <IoPencil /></label>
        <input className={`editor `} type="text" id={'input-detail-title'} value={detail.title || ''} placeholder="Ajoutez un title au detail du produit" onChange={(e) => {
            const title = e.currentTarget.value
            setDetail({
                ...detail,
                title: title.replace(/\s+/g, ' ').substring(0, 56),
            });
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
        <div className="input-message"><span className='right'>{(detail.title?.trim()?.length || 0)} / 56</span></div>
        <label className='editor' htmlFor='input-product-description'>Description <IoPencil /></label>

        {<MarkdownEditor2 value={detail.description || ' '} setValue={(value) => {
            setDetail({
                ...detail,
                description: value.substring(0, 1024)
            });
        }} />}
        <div className="input-message"><span className='right'>{(detail.description?.trim()?.length || 0)} / 1024</span></div>
    </div >
}