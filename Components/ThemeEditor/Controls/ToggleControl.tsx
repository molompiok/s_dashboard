// Components/ThemeEditor/Controls/ToggleControl.tsx

import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from "../../../pages/themes/editor/+Page";
import { Switch } from '@headlessui/react'; // Importer Switch de Headless UI
import { useState, useEffect } from "react";

export interface ToggleControlProps {
    option: ThemeOptionDefinition;
    value: boolean | undefined | null; // La valeur est booléenne
    onChange: (key: string, value: boolean) => void;
}

// Helper pour combiner les classes Tailwind
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function ToggleControl({ option, value, onChange }: ToggleControlProps) {
    const { t } = useTranslation();
    // État local pour gérer l'interrupteur Headless UI
    const [enabled, setEnabled] = useState(!!value);

    // Synchroniser l'état local si la prop `value` change
    useEffect(() => {
        setEnabled(!!value);
    }, [value]);

    // Mettre à jour l'état local ET appeler le callback parent
    const handleChange = (newValue: boolean) => {
        setEnabled(newValue);
        onChange(option.key, newValue);
    };

    return (
        // Utiliser Switch de Headless UI
        <Switch.Group as="div" className="flex items-center justify-between">
            {/* Label */}
            <span className="flex flex-grow flex-col">
                <Switch.Label as="span" className="text-xs font-medium text-gray-600 cursor-pointer" passive>
                     {t(option.labelKey)} {/* Traduire le label */}
                </Switch.Label>
                 {/* Ajouter une description si fournie */}
                 {/* <Switch.Description as="span" className="text-xs text-gray-500">
                     {option.descriptionKey ? t(option.descriptionKey) : ''}
                 </Switch.Description> */}
            </span>
            {/* Interrupteur */}
            <Switch
                checked={enabled}
                onChange={handleChange}
                className={classNames(
                    enabled ? 'bg-blue-600' : 'bg-gray-200',
                    'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
            >
                 {/* Bouton interne du toggle */}
                <span
                    aria-hidden="true"
                    className={classNames(
                        enabled ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                    )}
                />
            </Switch>
        </Switch.Group>
    );
}