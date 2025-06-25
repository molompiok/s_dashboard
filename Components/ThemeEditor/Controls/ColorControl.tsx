// Components/ThemeEditor/Controls/ColorControl.tsx

import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from "../../../pages/themes/editor/+Page";
import { useState, useEffect } from 'react';
import { debounce } from "../../Utils/functions"; // Pour délayer la mise à jour

interface ColorControlProps {
    option: ThemeOptionDefinition;
    value: string | undefined | null; // Valeur hexadécimale (ex: #RRGGBB)
    onChange: (key: string, value: string) => void;
}

export function ColorControl({ option, value, onChange }: ColorControlProps) {
    const { t } = useTranslation();
    // État local pour gérer la couleur pendant la sélection (évite màj à chaque pixel)
    const [localColor, setLocalColor] = useState(value ?? option.defaultValue ?? '#000000');

    // Synchroniser l'état local si la prop `value` change
    useEffect(() => {
        setLocalColor(value ?? option.defaultValue ?? '#000000');
    }, [value, option.defaultValue]);

    // Mettre à jour l'état local et déclencher onChange avec debounce
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
     
        setLocalColor(newColor);
        // Appeler onChange seulement après un délai pour éviter trop d'updates pendant la sélection
        debounce(() => onChange(option.key, newColor), `color-${option.key}`, 200);
    };

    return (
        <div>
            {/* Label */}
            <label htmlFor={`control-${option.key}`} className="block text-xs font-medium text-gray-600 mb-1">
                {t(option.labelKey)}
            </label>
            {/* Input Color + Preview */}
            {/* Utiliser flex pour aligner */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    id={`control-${option.key}-text`}
                    name={`${option.key}-text`}
                    value={localColor || ''}
                    onChange={handleChange} // Peut aussi mettre à jour via debounce ici
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
                    maxLength={7} // #RRGGBB
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" // Validation pattern simple
                />
                {/* Input Color Caché (pour le picker natif) */}
                {/* On peut le rendre visible ou le cacher et utiliser une librairie JS */}
                <input
                    type="color"
                    id={`control-${option.key}`}
                    name={option.key}
                    value={localColor || '#000000'}
                    onChange={handleChange}
                    // Cacher l'input natif, utiliser une icône ou le preview comme déclencheur
                    // className="absolute opacity-0 w-0 h-0"
                    // Ou le styliser simplement:
                    className="h-9 w-10 p-0 border border-gray-300 rounded-md cursor-pointer" // Style simple pour picker natif
                />
            </div>
            {/* Ajouter une description/aide si fournie dans option */}
            {/* {option.descriptionKey && <p className="mt-1 text-xs text-gray-500">{t(option.descriptionKey)}</p>} */}
        </div>
    );
}