// Components/InventoryManager/InventoryFormPopup.tsx

import { useState, useEffect, useRef } from 'react';
import { Inventory as InventoryInterface } from "../../api/Interfaces/Interfaces";
import { useTranslation } from "react-i18next";
import { useCreateInventory, useUpdateInventory } from "../../api/ReactSublymusApi"; // Importer mutations
import logger from '../../api/Logger';
import { IoCloudUploadOutline, IoImageOutline } from 'react-icons/io5';
import { RiImageEditFill } from 'react-icons/ri';
import { Confirm } from '../Confirm/Confirm'; // Utiliser Confirm pour boutons
import { getMedia } from '../Utils/StringFormater'; // Pour preview
import { useGlobalStore } from '../../api/stores/StoreStore'; // Pour URL base image
import { ApiError } from '../../api/SublymusApi';
import { showErrorToast, showToast } from '../Utils/toastNotifications';

interface InventoryFormPopupProps {
    initialData?: Partial<InventoryInterface>; // Données pour l'édition
    onSaveSuccess: (inventory: InventoryInterface) => void; // Callback succès
    onCancel: () => void; // Callback annulation/fermeture
    // storeId?: string; // Peut-être nécessaire pour lier à un store si non implicite
}

// Type pour l'état local du formulaire
type InventoryFormState = Partial<InventoryInterface & {
    viewFiles: File[]; // Pour stocker les nouveaux fichiers sélectionnés
    viewPreviews: string[]; // Pour les previews locales
}>;

export function InventoryFormPopup({ initialData, onSaveSuccess, onCancel }: InventoryFormPopupProps) {
    const { t } = useTranslation();
    const { currentStore } = useGlobalStore(); // Pour URL images existantes

    // --- État du Formulaire ---
    const [formData, setFormData] = useState<InventoryFormState>(() => {
        // Initialiser avec données existantes ou valeurs par défaut
        return {
            id: initialData?.id,
            address_name: initialData?.address_name ?? '',
            email: initialData?.email ?? '',
            latitude: initialData?.latitude ?? undefined, // Utiliser undefined pour placeholder
            longitude: initialData?.longitude ?? undefined,
            views: initialData?.views ?? [], // URLs existantes
            viewFiles: [], // Aucun nouveau fichier au début
            viewPreviews: [], // Pas de preview locale au début
        };
    });

    const [s] = useState({
        collected: {} as Partial<InventoryInterface>
    })
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    // --- Mutations ---
    const createInventoryMutation = useCreateInventory();
    const updateInventoryMutation = useUpdateInventory();
    const isLoading = createInventoryMutation.isPending || updateInventoryMutation.isPending;

    // --- Validation Locale ---
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};
        let isValid = true;

        if (!formData.address_name || formData.address_name.trim().length < 3) {
            errors.address_name = t('inventory.validation.nameRequired');
            isValid = false;
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { // Regex email simple
            errors.email = t('inventory.validation.emailInvalid');
            isValid = false;
        }
        if (formData.latitude === undefined || formData.latitude === null || isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90) {
            errors.latitude = t('inventory.validation.latitudeInvalid');
            isValid = false;
        }
        if (formData.longitude === undefined || formData.longitude === null || isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180) {
            errors.longitude = t('inventory.validation.longitudeInvalid');
            isValid = false;
        }
        // Validation sur les images (ex: au moins une?) - Optionnel
        // if ((formData.views?.length ?? 0) === 0 && formData.viewFiles.length === 0) {
        //     errors.views = t('inventory.validation.imageRequired');
        //     isValid = false;
        // }

        setFieldErrors(errors);
        return isValid;
    };

    // --- Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value;
        (s.collected as any)[name] = parsedValue
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
        setFieldErrors(prev => ({ ...prev, [name]: '' })); // Reset erreur champ
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            // Si l'utilisateur annule, on ne fait rien ou on reset? Pour l'instant rien.
            return;
        }
        const newFiles = Array.from(files);
        s.collected.views = newFiles

        const newPreviews = newFiles.map(file => URL.createObjectURL(file));

        // Révoquer les anciennes previews locales avant d'en créer de nouvelles
        formData.viewPreviews?.forEach(url => URL.revokeObjectURL(url));

        setFormData(prev => ({
            ...prev,
            views: newFiles,
            viewFiles: newFiles,
            viewPreviews: newPreviews,
        }));
        setFieldErrors(prev => ({ ...prev, views: '' }));
        e.target.value = ''; // Reset input
    };

    // Nettoyer les ObjectURLs quand le composant est démonté
    useEffect(() => {
        return () => {
            formData.viewPreviews?.forEach(url => URL.revokeObjectURL(url));
        };
    }, [formData.viewPreviews]);

    const handleSubmit = () => {
        if (!validateForm()) {
            logger.warn("Inventory form validation failed.");
            return;
        }

        if (formData.id) {
            // --- Mise à jour ---
            updateInventoryMutation.mutate(
                {
                    inventory_id: formData.id,
                    data: {
                        address_name: s.collected.address_name || '',
                        email: s.collected.email,
                        latitude: s.collected.latitude,
                        longitude: s.collected.longitude,
                        views: s.collected.views,
                    },
                },
                {
                    onSuccess: (data) => {
                        logger.info(`Inventory ${formData.id} updated.`);
                        onSaveSuccess(data.inventory); // Appeler callback parent
                        showToast("Inventaire mis à jour avec succès"); // ✅ Toast succès
                    },
                    onError: (error: ApiError) => {
                        logger.error({ error }, `Failed to update inventory ${formData.id}`);
                        setFieldErrors({ api: error.message });
                        showErrorToast(error); // ❌ Toast erreur
                    },
                }
            );
        } else {
            // --- Création ---
            createInventoryMutation.mutate(
                {
                    data: {
                        address_name: s.collected.address_name || '',
                        email: s.collected.email,
                        latitude: s.collected.latitude,
                        longitude: s.collected.longitude,
                        views: s.collected.views,
                    },
                },
                {
                    onSuccess: (data) => {
                        logger.info(`Inventory created: ${data.inventory.id}`);
                        onSaveSuccess(data.inventory); // Appeler callback parent
                        showToast("Inventaire créé avec succès"); // ✅ Toast succès
                    },
                    onError: (error: ApiError) => {
                        logger.error({ error }, `Failed to create inventory`);
                        setFieldErrors({ api: error.message });
                        showErrorToast(error); // ❌ Toast erreur
                    },
                }
            );
        }
    };

    // --- Affichage Image Preview ---
    // Prioriser les previews locales, sinon les URLs existantes
    const displayImage = (formData.viewPreviews?.[0] ? getMedia({ isBackground: true, source: formData.viewPreviews?.[0] }) : null) ??
        (typeof formData.views?.[0] === 'string' ? getMedia({ isBackground: true, source: formData.views[0], from: 'api' }) : undefined);
    const showPlaceholder = !displayImage;

    return (
        <div className="inventory-form p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-6">
                {/* Section Image */}
                <div className="sm:w-1/3">
                    <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='inventory-image-input'>
                        {t('inventory.imagesLabel')}
                    </label>
                    <label htmlFor='inventory-image-input' className={`relative block w-full aspect-video rounded-lg cursor-pointer overflow-hidden group bg-gray-100 border ${fieldErrors.views ? 'border-red-500' : 'border-gray-300'} hover:bg-gray-200`}>
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-opacity duration-150"
                            style={{ background: displayImage }}
                        ></div>
                        {showPlaceholder && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 p-2 text-center">
                                <IoCloudUploadOutline size={40} />
                                <span className="mt-1 text-xs">{t('inventory.selectImagePrompt')}</span>
                            </div>
                        )}
                        {!showPlaceholder && (
                            <div className="absolute bottom-2 right-2 p-1.5 bg-white/70 backdrop-blur-sm rounded-full shadow text-gray-600 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RiImageEditFill size={18} />
                            </div>
                        )}
                        <input id='inventory-image-input' name="views" type="file" accept='image/*' className="sr-only" onChange={handleFileChange} multiple={false} />
                    </label>
                    {fieldErrors.views && <p className="mt-1 text-xs text-red-600">{fieldErrors.views}</p>}
                </div>

                {/* Formulaire */}
                <div className="flex-1 flex flex-col gap-5">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='inventory-name-input'>
                            {t('inventory.nameLabel')}
                        </label>
                        <input
                            id='inventory-name-input'
                            name="address_name"
                            className={`block w-full px-4 rounded-md shadow-sm sm:text-sm h-10 ${fieldErrors.address_name ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            type="text"
                            value={formData.address_name || ''}
                            placeholder={t('inventory.namePlaceholder')}
                            onChange={handleInputChange}
                        />
                        {fieldErrors.address_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.address_name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className='block text-sm  font-medium text-gray-700 mb-1' htmlFor='inventory-email-input'>
                            {t('inventory.emailLabel')} <span className='text-gray-400 text-xs'>({t('common.optionalField')})</span>
                        </label>
                        <input
                            id='inventory-email-input'
                            name="email"
                            className={`block w-full rounded-md px-4 shadow-sm sm:text-sm h-10 ${fieldErrors.email ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                            type="email"
                            value={formData.email || ''}
                            placeholder={t('inventory.emailPlaceholder')}
                            onChange={handleInputChange}
                        />
                        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
                    </div>

                    {/* Coordonnées */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='inventory-latitude-input'>
                                {t('inventory.latitudeLabel')}
                            </label>
                            <input
                                id='inventory-latitude-input'
                                name="latitude"
                                className={`block w-full px-4 rounded-md shadow-sm sm:text-sm h-10 ${fieldErrors.latitude ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                type="number"
                                value={formData.latitude ?? ''}
                                placeholder="Ex: 5.3600"
                                step="any"
                                onChange={handleInputChange}
                            />
                            {fieldErrors.latitude && <p className="mt-1 text-xs text-red-600">{fieldErrors.latitude}</p>}
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1' htmlFor='inventory-longitude-input'>
                                {t('inventory.longitudeLabel')}
                            </label>
                            <input
                                id='inventory-longitude-input'
                                name="longitude"
                                className={`block w-full px-4 rounded-md shadow-sm sm:text-sm h-10 ${fieldErrors.longitude ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                type="number"
                                value={formData.longitude ?? ''}
                                placeholder="Ex: -4.0083"
                                step="any"
                                onChange={handleInputChange}
                            />
                            {fieldErrors.longitude && <p className="mt-1 text-xs text-red-600">{fieldErrors.longitude}</p>}
                        </div>
                    </div>
                    {/* Erreur API Générale */}
                    {fieldErrors.api && <p className="mt-1 text-sm text-red-600">{fieldErrors.api}</p>}


                    {/* Boutons */}
                    <Confirm
                        onCancel={onCancel}
                        confirm={formData.id ? t('common.saveChanges') : t('common.create')}
                        onConfirm={handleSubmit}
                        canConfirm={!isLoading} // Actif si pas en chargement
                        isLoading={isLoading} // Passer l'état de chargement à Confirm si besoin
                    />
                </div>
            </div>
        </div>
    );
}