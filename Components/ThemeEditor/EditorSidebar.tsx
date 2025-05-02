// Components/ThemeEditor/EditorSidebar.tsx

import React from 'react'; // Importer React
import { useTranslation } from "react-i18next";
import { ThemeOptionsStructure, ThemeSettingsValues, ThemeOptionDefinition } from "../../pages/themes/editor/+Page"; // Importer les types définis dans la page
import { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

import { ColorControl } from './Controls/ColorControl';
import { FontControl } from './Controls/FontControl';
import { TextControl } from './Controls/TextControl';
import { SelectControl } from './Controls/SelectControl';
import { ToggleControl } from './Controls/ToggleControl';
import { ImageControl } from './Controls/ImageControl';

interface EditorSidebarProps {
    optionsStructure: ThemeOptionsStructure;
    settings: ThemeSettingsValues;
    onSettingChange: (key: string, value: any) => void;
    initialOpen?: string;
    // Nouvelle prop pour le mapping d'icônes (obligatoire maintenant)
    sectionIcons: Record<string, React.ElementType>;
}

export function EditorSidebar({
    optionsStructure,
    settings,
    onSettingChange,
    initialOpen,
    sectionIcons // Récupérer la nouvelle prop
}: EditorSidebarProps) {
    const { t } = useTranslation();
    const [openSection, setOpenSection] = useState<string | null>(initialOpen || optionsStructure.sections[0]?.key || null);

    const toggleSection = (sectionKey: string) => {
        setOpenSection(prev => prev === sectionKey ? null : sectionKey);
    };

    const renderControl = (option: ThemeOptionDefinition) => {
        const value = settings[option.key] ?? option.defaultValue;
        switch (option.type) {
            case 'color': return <ColorControl option={option} value={value} onChange={onSettingChange} />;
            case 'font': return <FontControl option={option} value={value} onChange={onSettingChange} />;
            case 'text': return <TextControl option={option} value={value} onChange={onSettingChange} />;
            case 'select': return <SelectControl option={option} value={value} onChange={onSettingChange} />;
            case 'toggle': return <ToggleControl option={option} value={value} onChange={onSettingChange} />;
            case 'image': return <ImageControl option={option} value={value} onChange={onSettingChange} />;
            default: return <TextControl option={option} value={value} onChange={onSettingChange} />;
        }
    };

    const sortedSections = [...optionsStructure.sections].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

    return (
        <div className="editor-sidebar h-full p-4 space-y-1 overflow-y-auto">
            {sortedSections.map((section) => {
                const isOpen = openSection === section.key;
                const sectionOptions = optionsStructure.options.filter((opt) => opt.section === section.key);
                if (sectionOptions.length === 0) return null;

                // --- Récupérer l'icône pour cette section ---
                // Utilise l'icône spécifique ou une icône par défaut si non trouvée
                const SectionIcon = sectionIcons[section.key] || sectionIcons['default']; // Assurez-vous d'avoir une icône par défaut définie dans le mapping

                return (
                    <div key={section.key} className="border-b border-gray-200 last:border-b-0">
                        <button
                            type="button"
                            onClick={() => toggleSection(section.key)}
                            className="flex justify-between items-center w-full py-3 px-1 text-left hover:bg-gray-50 rounded-md"
                            aria-expanded={isOpen}
                        >
                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                {/* Afficher l'icône */}
                                {SectionIcon && ( // Vérifier si l'icône existe
                                    <SectionIcon
                                        className="h-4 w-4 text-gray-500 flex-shrink-0" // Style icône
                                        aria-hidden="true"
                                    />
                                )}
                                <span>{t(section.titleKey)}</span>
                            </span>
                            {isOpen
                                ? <IoChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                : <IoChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            }
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1500px] opacity-100 pb-4 pl-1' : 'max-h-0 opacity-0'}`}>
                             <div className="space-y-5 pt-2">
                                {sectionOptions.map((option) => (
                                     <div key={option.key} className="option-control">
                                         {renderControl(option)}
                                     </div>
                                ))}
                             </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}