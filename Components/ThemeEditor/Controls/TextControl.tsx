// Components/ThemeEditor/Controls/TextControl.tsx

import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from "../../../pages/themes/editor/+Page";
import { IoPencil } from "react-icons/io5";

interface TextControlProps {
    option: ThemeOptionDefinition; // Définition de l'option (key, labelKey, etc.)
    value: string | undefined | null; // Valeur actuelle
    onChange: (key: string, value: string) => void; // Callback pour changement
}

export function TextControl({ option, value, onChange }: TextControlProps) {
    const { t } = useTranslation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(option.key, e.target.value);
    };

    return (
        <div>
            {/* Label */}
            <label htmlFor={`control-${option.key}`} className="block text-xs font-medium text-gray-600 mb-1">
                {t(option.labelKey)} {/* Traduire le label */}
            </label>
            {/* Input */}
             {/* Utiliser styles Tailwind pour input */}
            <input
                type="text"
                id={`control-${option.key}`}
                name={option.key}
                value={value ?? ''} // Utiliser chaîne vide si null/undefined
                onChange={handleChange}
                placeholder={option.defaultValue ? String(option.defaultValue) : ''} // Afficher défaut comme placeholder
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9" // Hauteur h-9 (36px)
            />
            {/* Ajouter une description/aide si fournie dans option */}
            {/* {option.descriptionKey && <p className="mt-1 text-xs text-gray-500">{t(option.descriptionKey)}</p>} */}
        </div>
    );
}