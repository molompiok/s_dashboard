import { useRef, useState } from 'react';
import { ValueInterface } from '../../Interfaces/Interfaces'
import './ValuePricing.css'
import { IoPencil } from 'react-icons/io5';
import { Indicator } from '../Indicator/Indicator';
import { MAX_PRICE, MAX_STOCK } from '../Utils/constants';

export { ValuePricing }

function ValuePricing({ value: v, addToValue }: { addToValue: (value: Partial<ValueInterface>) => void, value: ValueInterface }) {

    const additionalPriceRef = useRef<HTMLInputElement>(null);
    const stockRef = useRef<HTMLInputElement>(null);

    const [additionalPriceError, setAdditionalPriceError] = useState('');
    const [stockError, setStockError] = useState('');

    return <div className="feature-pricing">
        <label className='editor' htmlFor='feature-pricing-additional-price-input'>Prix additionnel<IoPencil /><Indicator style={{ marginLeft: 'auto' }} title={`L'ancien prix ou le prix actuel du marcher`} description={`Ce prix sert de référence au client. Il indique au client que votre produit est en réduction`} /></label>
        <div className='price-ctn'>
            <input className={`price editor ${additionalPriceError ? 'error' : ''}`} type="number" id={'feature-pricing-additional-price-input'}
                value={v.additional_price || ''}
                placeholder="Prix additionnel au prix du produit"
                max={MAX_PRICE}
                min={0}
                onChange={(e) => {
                    let price_str = e.currentTarget.value
                    let price = Number.parseInt(price_str)
                    if (isNaN(price)) {
                        setAdditionalPriceError('Veuillez entrer un nombre valide')
                        return
                    }
                    addToValue({
                        ['additional_price']: price > MAX_PRICE ? MAX_PRICE : price
                    })
                    setAdditionalPriceError('')
                }} />
            <div className="currency">{'FCFA'}</div>
        </div>

        <h3 style={{ whiteSpace: 'nowrap' }}>Le Stock est-il limité ?</h3>
        <label>
            <input
                type="checkbox"
                style={{ scale: 1.3, marginRight: '12px' }}
                checked={v.decreases_stock}
                onChange={() => {
                    addToValue({
                        decreases_stock: true,
                        stock: 0
                    });
                }}
            />
            <span style={{ fontSize: '0.9em' }}>Oui, cette  option a un stock précis.</span>
        </label>
        <br />
        <label>
            <input
                type="checkbox"
                style={{ scale: 1.3, marginRight: '12px' }}
                checked={!v.decreases_stock}
                onChange={() => {
                    addToValue({
                        decreases_stock: false,
                        continue_selling: true,
                        stock: undefined
                    });
                }}
            />
            <span style={{ fontSize: '0.9em' }}>Non, cette  option n'influence pas le stock .</span>
        </label>
        <div className="column" style={{ opacity: v.decreases_stock ? 1 : 0.5 }}>
            <label className='editor' htmlFor='feature-pricing-stock-input'>Combien en stock ? <IoPencil /> <Indicator style={{ marginLeft: 'auto' }} title={`L'ancien prix ou le prix actuel du marcher`} description={`Ce prix sert de référence au client. Il indique au client que votre produit est en réduction`} /></label>
            <div className='price-ctn'>
                <input disabled={!v.decreases_stock} className={`price editor ${stockError ? 'error' : ''}`} type="number" id={'feature-pricing-stock-input'}
                    value={v.stock ?? ''}
                    placeholder="Stock du produit"
                    max={MAX_PRICE}
                    min={0}
                    onChange={(e) => {
                        let stock_str = e.currentTarget.value
                        let stock = Number.parseInt(stock_str)
                        if (isNaN(stock)) {
                            setStockError('Veuillez entrer un nombre valide')
                            return
                        }
                        addToValue({
                            ['stock']: stock > MAX_STOCK ? MAX_STOCK : stock
                        })
                        setStockError('')
                    }} />
            </div>
        </div>
        <h3 style={{ opacity: v.decreases_stock ? 1 : 0.5 }}>Peut-on commander même sans stock ?</h3>
        <label style={{ opacity: v.decreases_stock ? 1 : 0.5 }}>
            <input
                type="checkbox"
                style={{ scale: 1.3, marginRight: '12px' }}
                checked={v.continue_selling}
                onChange={() => v.decreases_stock && addToValue({ continue_selling: true })}
            />
            <span style={{ fontSize: '0.9em' }}>Oui, les commandes sont autorisées même si le stock est à zéro(0).</span>
        </label>
        <br />
        <label style={{ opacity: v.decreases_stock ? 1 : 0.5 }}>
            <input
                type="checkbox"
                style={{ scale: 1.3, marginRight: '12px' }}
                checked={!v.continue_selling}
                onChange={() => v.decreases_stock && addToValue({ continue_selling: false })}
            />
            <span style={{ fontSize: '0.9em' }}>Non, Les clients ne peuvent pas commander si le stock est a zéro(0)</span>
        </label>
    </div>
}