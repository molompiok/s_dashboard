// Components/ThemeEditor/Controls/ImageControl.tsx

import { useTranslation } from "react-i18next";
import { ThemeOptionDefinition } from  "../../../pages/themes/editor/+Page";
import { useState, useEffect, useRef } from 'react';
import { IoCloudUploadOutline, IoImageOutline, IoPencil, IoTrash } from "react-icons/io5";
import { getImg } from "../../Utils/StringFormater"; // Pour preview
import { useGlobalStore } from "../../../pages/stores/StoreStore";

interface ImageControlProps {
    option: ThemeOptionDefinition;
    value: string | File | undefined | null; // Peut être une URL existante (string) ou un nouveau fichier (File)
    onChange: (key: string, value: File | string | null) => void; // Retourne File si nouveau, string si URL existante, null si supprimé
}

export function ImageControl({ option, value, onChange }: ImageControlProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    // Mettre à jour la preview si la prop `value` change ou au montage
    useEffect(() => {
        let objectUrl: string | null = null;
        if (value instanceof File) {
            objectUrl = URL.createObjectURL(value);
            setPreviewUrl(objectUrl);
            setFileName(value.name);
        } else if (typeof value === 'string' && value) {
             // Construire l'URL complète si value est une URL relative
             const baseUrl = currentStore?.url || ''; // ou une autre source pour l'URL de base des médias
             const fullUrl = value.startsWith('http') ? value : `${baseUrl.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
            setPreviewUrl(fullUrl);
            setFileName(value.substring(value.lastIndexOf('/') + 1)); // Extraire nom de fichier de l'URL
        } else {
            setPreviewUrl(null);
            setFileName(null);
        }

        // Nettoyer l'ObjectURL si c'en était un
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [value, currentStore?.url]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Révoquer l'ancienne preview si c'était un ObjectURL local
        if (previewUrl && !(typeof value === 'string')) {
             URL.revokeObjectURL(previewUrl);
        }

        if (file) {
            // TODO: Validation taille/type
            onChange(option.key, file); // Remonter l'objet File
            setPreviewUrl(URL.createObjectURL(file)); // Mettre à jour preview locale
             setFileName(file.name);
        } else {
             // Si l'utilisateur annule, que faire? Revenir à l'image précédente ou supprimer?
             // Pour l'instant, on ne change rien si aucun fichier n'est sélectionné
        }
         e.target.value = ''; // Reset input
    };

    const handleRemoveImage = () => {
         // Révoquer l'ancienne preview si locale
         if (previewUrl && !(typeof value === 'string')) {
              URL.revokeObjectURL(previewUrl);
         }
         onChange(option.key, null); // Remonter null pour indiquer suppression
         setPreviewUrl(null);
         setFileName(null);
    };

    return (
        <div>
            {/* Label */}
            <label className="block text-xs font-medium text-gray-600 mb-1">
                {t(option.labelKey)} 
            </label>
             {/* Contrôle */}
            <div className="flex items-center gap-3">
                {/* Zone Preview / Upload */}
                 <div className={`relative w-20 h-20 rounded-md border border-gray-300 bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden ${previewUrl ? '' : 'border-dashed'}`}>
                     {previewUrl ? (
                         <img src={previewUrl} alt={t('imageControl.previewAlt')} className="w-full h-full object-contain" /> // Utiliser object-contain
                     ) : (
                         <IoImageOutline size={32} />
                     )}
                     {/* Overlay au survol si image présente */}
                      {previewUrl && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                              <button type="button" onClick={() => inputRef.current?.click()} className="p-1 text-white/80 hover:text-white" title={t('imageControl.changeAction')}> <IoPencil size={16} /> </button>
                              <button type="button" onClick={handleRemoveImage} className="p-1 text-white/80 hover:text-white" title={t('common.delete')}> <IoTrash size={16} /> </button>
                          </div>
                      )}
                 </div>
                 {/* Bouton Upload (si pas d'image) / Infos fichier */}
                 <div className="flex flex-col justify-center">
                     {!previewUrl && (
                         <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                             <IoCloudUploadOutline className="-ml-0.5 h-4 w-4" />
                              {t('imageControl.uploadButton')} 
                         </button>
                     )}
                      {fileName && (
                           <span className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={fileName}>{fileName}</span>
                      )}
                       <p className="text-xs text-gray-500 mt-1">{t('imageControl.helpText')}</p> 
                 </div>
                 {/* Input fichier caché */}
                 <input
                    ref={inputRef}
                    type="file"
                    id={`control-${option.key}`}
                    name={option.key}
                    accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif" // Accepter formats courants
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
            {/* Ajouter une description/aide si fournie */}
            {/* {option.descriptionKey && <p className="mt-1 text-xs text-gray-500">{t(option.descriptionKey)}</p>} */}
        </div>
    );
}