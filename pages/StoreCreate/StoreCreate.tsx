import './StoreCreate.css'
    ;
import { Topbar } from '../../Components/TopBar/TopBar';
import { useEffect, useState } from 'react';
import { CreateStore, StoreCollectedType } from './CreateStore';
import { getImg } from '../../Components/Utils/StringFormater';
import { ClientCall } from '../../Components/Utils/functions';
import { IoChevronForward } from 'react-icons/io5';
import { useGlobalStore } from '../stores/StoreStore';

export { StoreCreate }

type PageType =
    'edit' |
    'loading-edit' |
    'edit-success' |
    'edit-error' |
    'create' |
    'loading-create' |
    'create-success' |
    'create-error';

function StoreCreate({ back }: { back?: boolean }) {
    const [page, setPage] = useState<PageType>('create');
    const [collected, setCollected] = useState<StoreCollectedType>()
    return <div className="store-create">
        <Topbar back={back} search={false} notif={false} onBack={() => {
            ClientCall(() => history.back())
        }} />
        <div className="ctn">
            {
                page == 'create' && <CreateStore canCancel={true} onReady={(collected) => {
                    setCollected(collected)
                    setPage('loading-create')
                }} store={{}} onCancel={() => {
                    ClientCall(() => history.back())
                }} />
            }
            {
                page == 'loading-create' && <StoreCreateLoading collected={collected || {}} onReady={(store) => {
                    setCollected(store)
                    setPage('create-success')
                }} onError={(error) => {
                    setPage('create-error')
                }} />
            }
            {
                page == 'create-success' && <CasSuccess type={'create'} onDashRequired={() => {
                    ClientCall(() => history.back())
                }} />
            }
            {
                page == 'create-error' && <CasError type='create' openDash={back} onDashRequired={() => {
                    ClientCall(() => history.back())
                }} />
            }
            {
                page == 'edit' && <CreateStore canCancel={true} onReady={(collected) => {
                    setCollected(collected)
                    setPage('loading-edit')
                }} store={{}} />
            }
            {
                page == 'loading-edit' && <StoreEditLoading collected={collected || {}} onReady={(store) => {
                    setCollected(store)
                    setPage('edit-success')
                }} onError={(error) => {
                    setPage('edit-error')
                }} />
            }
            {
                page == 'edit-success' && <CasSuccess type={'edit'} onDashRequired={() => {
                    ClientCall(() => history.back())
                }} />
            }
            {
                page == 'edit-error' && <CasError type='edit' onDashRequired={() => {
                    ClientCall(() => history.back())
                }} />
            }
        </div>
    </div>
}


function CasSuccess({ type, onDashRequired }: { type: 'create' | 'edit', onDashRequired?: () => void }) {

    return <div className="cas-success">
        <div className="success-img" style={{ background: getImg('/res/success_wave-yes.webp') }}></div>
        <h2>{
            type == 'create' ?
                'Votre boutique a bien été créée' :
                'Les Informations de la boutique on bien ete modifier'
        }</h2>
        <div className="dash-btn" onClick={() => {
            onDashRequired?.()
        }}>{
                type == 'create' ?
                    'Ajouter un produit' :
                    'Acceder au dashboard'
            } <IoChevronForward /></div>
    </div>
}

function CasError({ type, openDash, onDashRequired }: { type: 'create' | 'edit', openDash?: boolean, onDashRequired?: () => void }) {

    return <div className="cas-error">
        <div className="error-img" style={{ background: getImg('/res/update_reload.png') }}></div>
        <h2>{
            type == 'create' ?
                'Votre boutique est en cour de creation vous serez contacter dans moins de 24h' :
                'Les Informations de la boutique sont en cours de modifiations, elle s\'appliquerons dans moins de 24h'
        }</h2>
        {
            (type == 'edit' || (type == 'create' && openDash)) && <div className="dash-btn" onClick={() => {
                onDashRequired?.()
            }}>Accedez au dashboard <IoChevronForward /></div>
        }
    </div>
}
function StoreCreateLoading({ collected, onError, onReady }: { collected: Partial<StoreCollectedType>, onReady: (collected: StoreCollectedType) => void, onError: (error: string) => void }) {

    const { createStore } = useGlobalStore();
    const [message, setMessage] = useState('');
    const [time, setTime] = useState(0);
    // const [setp,setStep] = useState<'loading'|''>('loading')
    const [_s] = useState({
        name: '',
        usedName: ''
    })
    _s.name = collected.name || ''
    useEffect(() => {
        let i = 0;
        let s = 0;
        let t = 0
        const id = setInterval(() => {
            setTime(t)
            t++;
            const d = ClientCall(Date.now, 0)
            if (i < d) {
                i = d + 1 * 1000 + ClientCall(Math.random, 0) * 3_000;
                s++;
                if (s > 6) return;
                switch (s) {
                    case 1:
                        setMessage('Transfer des informations');
                        break;
                    case 2:
                        setMessage('Analyse des informations');
                        break;
                    case 3:
                        setMessage('Preparation des ressources servers');
                        break;
                    case 4:
                        setMessage('Compression des donnees');
                        break;
                    case 5:
                        setMessage('Recherche de mise a jour..');
                        break;
                    case 6:
                        setMessage('Creation de la boutique en cours');
                        break;

                    default:
                        setMessage('Creation de la boutique en cours');
                }
            }
        }, 100);

        const out_id = setTimeout(() => {
            clearInterval(id);
            clearTimeout(out_id);
            onError('Votre Demand a bien ete enregistrer, nous vous rappelerons dans moin de 2h( en journee) (moin de 24 heurs en soiree) apres avoir Creation de la boutique')
        }, 30_000);

        if (_s.usedName != collected.name) {// Bug le createStore est appeler 2 fois;
            _s.usedName = collected.name || '';
            createStore(collected).then((store) => {
                console.log({ store });
                clearInterval(id);
                clearTimeout(out_id);
                onReady(store);
            }).catch((reason) => {
                console.log({ reason });
                clearInterval(id);
                clearTimeout(out_id);
                onError(JSON.stringify(reason));
            })
        }


        return () => {
            clearInterval(id);
            clearTimeout(out_id);
        }
    }, []);

    return <div className="store-loading-create">
        <h1>Votre Boutique en ligne est en cour de creation</h1>
        <div className="store-loading-animation" style={{ background: getImg('/res/loading_white.gif') }}></div>

        <p>{message}{'...'.substring(0, time % 10)}</p>
    </div>
}


function StoreEditLoading({ collected, onError, onReady }: { collected: Partial<StoreCollectedType>, onReady: (collected: StoreCollectedType) => void, onError: (error: string) => void }) {

    const [message, setMessage] = useState('');
    const [time, setTime] = useState(0);
    const [store, setStore] = useState<{} | null>(null)
    // const [setp,setStep] = useState<'loading'|''>('loading')
    useEffect(() => {
        let i = 0;
        let s = 0;
        let t = 0
        const id = setInterval(() => {
            setTime(t)
            t++;
            const d = ClientCall(Date.now, 0)
            if (i < d) {
                i = d + 1 * 1000 + ClientCall(Math.random, 0) * 3_000;
                s++;
                if (s > 6) return;
                switch (s) {
                    case 1:
                        setMessage('Transfer des informations');
                        break;
                    case 2:
                        setMessage('Analyse des informations');
                        break;
                    case 3:
                        setMessage('Preparation des ressources servers');
                        break;
                    case 4:
                        setMessage('Compression des donnees');
                        break;
                    case 5:
                        setMessage('Recherche de mise a jour..');
                        break;
                    case 6:
                        setMessage('En cour de modification');
                        break;

                    default:
                        setMessage('En cour de modification');
                }
            }
        }, 100);

        const out_id = setTimeout(() => {
            clearInterval(id);
            clearTimeout(out_id);
            onError('Les modifications seront appliquées dans moin 24h')
        }, 10_000);
        setTimeout(() => {
            clearInterval(id);
            clearTimeout(out_id);
            onReady({} as any);
        }, 20_000)
        return () => {
            clearInterval(id);
            clearTimeout(out_id);
        }
    }, []);

    return <div className="store-loading-edit">
        <h1>Modification des informations de la Boutique en ligne</h1>
        <div className="store-loading-animation" style={{ background: getImg('/res/loading_white.gif') }}></div>

        <p>{message}{'...'.substring(0, time % 10)}</p>
    </div>
}