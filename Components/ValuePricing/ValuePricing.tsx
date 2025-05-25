// Components/ValuePricing/ValuePricing.tsx
// Pas de CSS dédié a priori
//Components/ValuePricing/ValuePricing.tsx
import { useState, useEffect } from 'react';
import { ValueInterface } from '../../api/Interfaces/Interfaces';
import { Indicator } from '../Indicator/Indicator'; // Gardé
import { IoPencil } from 'react-icons/io5';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { MAX_PRICE } from '../Utils/constants'; // Garder constante

export { ValuePricing };

interface ValuePricingProps {
    value: Partial<ValueInterface>; // Peut recevoir une valeur partielle
    addToValue: (data: Partial<ValueInterface>) => void; // Callback pour mettre à jour l'état parent
}

function ValuePricing({ value, addToValue }: ValuePricingProps) {
    const { t } = useTranslation(); // ✅ i18n
    // Gérer l'état local des checkboxes pour une meilleure réactivité UI
    const [decreasesStock, setDecreasesStock] = useState(value.decreases_stock ?? true); // Actif par défaut?
    const [continueSelling, setContinueSelling] = useState(value.continue_selling ?? false); // Inactif par défaut

    // Mettre à jour l'état local si la prop change
    useEffect(() => {
        setDecreasesStock(value.decreases_stock ?? true);
        setContinueSelling(value.continue_selling ?? false);
    }, [value.decreases_stock, value.continue_selling]);

    // Handlers pour mettre à jour l'état local ET appeler le callback parent
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value: inputValue } = e.target;
        // Convertir en nombre, ou null si vide
        const numericValue = inputValue === '' ? null : Number(inputValue);
        // Envoyer null si NaN ou vide, sinon le nombre
        addToValue({ [name]: isNaN(numericValue as number) ? null : numericValue });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        if (name === 'decreases_stock') setDecreasesStock(checked);
        if (name === 'continue_selling') setContinueSelling(checked);
        addToValue({ [name]: checked });
    };

    return (
        // Utiliser flex flex-col gap-4 ou 5
        <div className="value-pricing flex flex-col gap-5 pt-4 border-t border-gray-200 mt-4"> {/* Ajouter séparation */}
            {/* Prix Additionnel */}
            <div>
                <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor={`value-price-${value.id}`}>
                    {t('value.additionalPriceLabel')} <span className='text-gray-400 text-xs'>({t('common.optionalField')})</span>
                    <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" />
                </label>
                <div className='relative max-w-[180px]'> {/* Limiter largeur */}
                    <input
                        id={`value-price-${value.id}`}
                        name="additional_price"
                        className="block w-full rounded-md shadow-sm sm:text-sm pl-3 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10 appearance-none m-0"
                        type="number"
                        value={value.additional_price ?? ''} // Utiliser '' pour input contrôlé
                        placeholder="0"
                        min="0"
                        max={MAX_PRICE} // Utiliser constante
                        step="any" // Permettre décimales?
                        onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-sm text-gray-500">FCFA</div> {/* TODO: Devise dynamique */}
                </div>
            </div>

            {/* Stock */}
            <div>
                <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor={`value-stock-${value.id}`}>
                    {t('value.stockLabel')} <span className='text-gray-400 text-xs'>({t('common.optionalField')})</span>
                    <IoPencil className="inline-block ml-1 w-3 h-3 text-gray-400" />
                </label>
                <div className='relative max-w-[180px]'>
                    <input
                        id={`value-stock-${value.id}`}
                        name="stock"
                        className="block w-full rounded-md shadow-sm sm:text-sm pl-3 pr-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10 appearance-none m-0"
                        type="number"
                        value={value.stock ?? ''}
                        placeholder={t('value.unlimitedStock')}
                        min="0"
                        step="1" // Stock généralement entier
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            {/* Options de Stock */}
            <div className='flex flex-col gap-3'>
                {/* Décrémenter Stock */}
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id={`value-decrease-${value.id}`}
                            name="decreases_stock"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={decreasesStock}
                            onChange={handleCheckboxChange}
                        />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor={`value-decrease-${value.id}`} className="font-medium text-gray-800 cursor-pointer">
                            {t('value.decreaseStockLabel')}
                        </label>
                        <p className="text-gray-500 text-xs">{t('value.decreaseStockDesc')}</p>
                    </div>
                </div>
                {/* Continuer Vente */}
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id={`value-continue-${value.id}`}
                            name="continue_selling"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={continueSelling}
                            onChange={handleCheckboxChange}
                            disabled={!decreasesStock} // Désactiver si on ne décrémente pas le stock
                        />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor={`value-continue-${value.id}`} className={`font-medium cursor-pointer ${!decreasesStock ? 'text-gray-400 cursor-not-allowed' : 'text-gray-800'}`}>
                            {t('value.continueSellingLabel')}
                        </label>
                        <p className={`text-xs ${!decreasesStock ? 'text-gray-400' : 'text-gray-500'}`}>{t('value.continueSellingDesc')}</p>
                    </div>
                </div>
            </div>

        </div>
    );
}