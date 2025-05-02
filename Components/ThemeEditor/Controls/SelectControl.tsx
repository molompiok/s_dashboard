// Components/ThemeEditor/Controls/SelectControl.tsx

import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from  "../../../pages/themes/editor/+Page";
import { IoChevronDown } from "react-icons/io5";

interface SelectControlProps {
    option: ThemeOptionDefinition; // Doit contenir un tableau `options` [{ value: string, labelKey: string }]
    value: string | undefined | null; // La valeur sélectionnée
    onChange: (key: string, value: string) => void;
}

export function SelectControl({ option, value, onChange }: SelectControlProps) {
    const { t } = useTranslation();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(option.key, e.target.value);
    };

    // Options pour le select (traduites)
    const selectOptions = (option.options ?? []).map(opt => ({
        value: opt.value,
        label: t(opt.labelKey) // Traduire le label de chaque option
    }));

    // Valeur actuelle ou défaut
    const currentValue = value ?? option.defaultValue ?? selectOptions[0]?.value ?? '';

    return (
        <div>
            {/* Label */}
            <label htmlFor={`control-${option.key}`} className="block text-xs font-medium text-gray-600 mb-1">
                {t(option.labelKey)} 
            </label>
            {/* Select */}
            <div className="relative">
                <select
                    id={`control-${option.key}`}
                    name={option.key}
                    value={currentValue}
                    onChange={handleChange}
                    className="appearance-none block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 pl-3 pr-10 cursor-pointer bg-white" // Style select
                >
                     {/* Option Placeholder si aucune valeur par défaut n'est valide? */}
                     {/* <option value="" disabled>{t('common.select')}</option> */}
                    {selectOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
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