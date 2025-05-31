import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from "../../../pages/themes/editor/+Page"; // Ajuste le chemin si nécessaire
import { IoAddCircleOutline, IoClose, IoReturnDownForwardOutline } from "react-icons/io5";

interface ArrayStringControlProps {
    option: ThemeOptionDefinition & { maxLength?: number }; // Ajout optionnel de maxLength
    value: string[] | undefined | null;
    onChange: (key: string, value: string[]) => void;
}

const DEFAULT_MAX_LENGTH = 10; // Tu peux ajuster cette valeur par défaut

export function ArrayStringControl({ option, value, onChange }: ArrayStringControlProps) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');
    const [items, setItems] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const maxLength = option.maxLength ?? DEFAULT_MAX_LENGTH;

    // Synchroniser l'état local 'items' avec la prop 'value'
    useEffect(() => {
        const initialValue = Array.isArray(value) ? value : (Array.isArray(option.defaultValue) ? option.defaultValue : []);
        setItems(initialValue);
    }, [value, option.defaultValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleAddItem = () => {
        const newItem = inputValue.trim();
        if (newItem && items.length < maxLength) {
            const newItems = [...items, newItem];
            setItems(newItems);
            onChange(option.key, newItems);
            setInputValue(''); // Réinitialiser l'input
            inputRef.current?.focus(); // Remettre le focus sur l'input
        } else if (items.length >= maxLength) {
            // Optionnel: afficher une notification ou un message d'erreur
            console.warn(`Limite de ${maxLength} éléments atteinte.`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Empêcher la soumission de formulaire si applicable
            handleAddItem();
        }
    };

    const handleRemoveItem = (indexToRemove: number) => {
        const newItems = items.filter((_, index) => index !== indexToRemove);
        setItems(newItems);
        onChange(option.key, newItems);
    };

    const canAddItem = items.length < maxLength;

    return (
        <div>
            {/* Label */}
            <label htmlFor={`control-${option.key}-input`} className="block text-xs font-medium text-gray-600 mb-1">
                {t(option.labelKey)}
            </label>

            {/* Input et bouton d'ajout */}
            <div className="flex items-center gap-2 mb-2">
                <input
                    ref={inputRef}
                    type="text"
                    id={`control-${option.key}-input`}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={canAddItem ? t('arrayStringControl.addPlaceholder') : t('arrayStringControl.limitReachedPlaceholder')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2 flex-grow"
                    disabled={!canAddItem}
                />
                <button
                    type="button"
                    onClick={handleAddItem}
                    className={`p-2 rounded-md text-white transition-colors ${
                        canAddItem && inputValue.trim()
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!canAddItem || !inputValue.trim()}
                    aria-label={t('arrayStringControl.addButtonLabel')}
                >
                    <IoReturnDownForwardOutline size={18} /> {/* Ou IoAddCircleOutline */}
                </button>
            </div>

            {/* Compteur */}
            <div className="text-xs text-gray-500 mb-2 text-right">
                {items.length}/{maxLength}
            </div>

            {/* Liste des items */}
            {items.length > 0 && (
                <div className="border border-gray-200 rounded-md p-2 bg-gray-50 max-h-[200px] overflow-y-auto space-y-1.5">
                    {items.map((item, index) => (
                        <div
                            key={`${option.key}-item-${index}`}
                            className="flex items-center justify-between bg-white p-1.5 rounded shadow-sm text-sm text-gray-700"
                        >
                            <span className="truncate flex-grow mr-2" title={item}>{item}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors flex-shrink-0"
                                aria-label={t('arrayStringControl.removeItemLabel', { item })}
                            >
                                <IoClose size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {items.length === 0 && !canAddItem && (
                 <p className="text-xs text-gray-500 italic">{t('arrayStringControl.noItemsAndLimit')}</p>
            )}


            {/* Description/Aide */}
            {option.descriptionKey && (
                <p className="mt-1 text-xs text-gray-500">{t(option.descriptionKey)}</p>
            )}
        </div>
    );
}