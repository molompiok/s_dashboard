// Components/ThemeEditor/Controls/FontControl.tsx

import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from "../../../pages/themes/editor/+Page";
import { IoChevronDown } from "react-icons/io5";

interface FontControlProps {
    option: ThemeOptionDefinition;
    value: string | undefined | null; // Nom de la police
    onChange: (key: string, value: string) => void;
}

// Liste des polices disponibles (peut venir de la config ou être statique)
// Inclure des polices système sûres et potentiellement Google Fonts si chargées
const availableFonts = [
    { value: 'Inter, sans-serif', label: 'Inter (Défaut)' },
    { value: 'Poppins, sans-serif', label: 'Poppins' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Lato, sans-serif', label: 'Lato' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat' },
    { value: 'Georgia, serif', label: 'Georgia (Serif)' },
    { value: 'Times New Roman, serif', label: 'Times New Roman (Serif)' },
     // Ajouter d'autres polices...
];

export function FontControl({ option, value, onChange }: FontControlProps) {
    const { t } = useTranslation();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(option.key, e.target.value);
    };

    // Utiliser la valeur actuelle ou la valeur par défaut de l'option
    const currentValue = value ?? option.defaultValue ?? availableFonts[0].value;

    return (
        <div>
            {/* Label */}
            <label htmlFor={`control-${option.key}`} className="block text-xs font-medium text-gray-600 mb-1">
                {t(option.labelKey)} 
            </label>
            {/* Select */}
             {/* Utiliser des styles Tailwind pour le select */}
            <div className="relative">
                <select
                    id={`control-${option.key}`}
                    name={option.key}
                    value={currentValue}
                    onChange={handleChange}
                     className="appearance-none block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 pl-3 pr-10 cursor-pointer" // Style select
                >
                    {availableFonts.map(font => (
                         // Appliquer la police à l'option elle-même pour la preview
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                        </option>
                    ))}
                </select>
                 {/* Icône Chevron */}
                 <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* Ajouter une description/aide si fournie */}
            {/* {option.descriptionKey && <p className="mt-1 text-xs text-gray-500">{t(option.descriptionKey)}</p>} */}
        </div>
    );
}