// pages/commands/@id/Receipt/Receipt.tsx
// import './Receipt.css'; // ❌ Supprimer

import { IoCloudDownloadOutline, IoDocumentsOutline, IoShareSocialOutline, IoPricetags, IoReceipt, IoCard, IoStorefront } from 'react-icons/io5';
import { CommandInterface } from '../../../../Interfaces/Interfaces';
import { CommandProduct, CommandTop, PaymentMethodElement } from '../+Page'; // Importer les sous-composants refactorisés
// import { Separator } from '../../../../Components/Separator/Separator'; // Remplacé par <hr> ou div stylisé
import { getImg } from '../../../../Components/Utils/StringFormater';
import { useTranslation } from 'react-i18next'; // ✅ i18n
import { useMemo } from 'react'; // ✅ useMemo pour calculs
import { FaTruck } from 'react-icons/fa';
import { useGlobalStore } from '../../../stores/StoreStore';

export { Receipt };

function Receipt({ command }: { command?: Partial<CommandInterface> }) {
    const { t } = useTranslation(); // ✅ i18n

    // --- Calculs pour le résumé ---
    const subTotal = useMemo(() => {
        return command?.items?.reduce((sum, item) => sum + (item.quantity * (item.price_unit || 0)), 0) ?? 0;
    }, [command?.items]);

    const deliveryPrice = command?.delivery_price ?? 0;
    const discountAmount = 0; // TODO: Ajouter la logique de réduction quand elle existera
    const grandTotal = command?.total_price ?? (subTotal + deliveryPrice - discountAmount); // Utiliser le total de la commande si disponible

    const paymentMethod = command?.payment_method;
    const deliveryMode = command?.with_delivery;

    const { currentStore } = useGlobalStore()
    return (
        // Conteneur principal du reçu - centré, avec fond blanc, ombre, padding
        <div className="receipt-view w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8 my-8 print:shadow-none print:my-0 print:p-4"> {/* Styles pour impression */}
            {/* En-tête avec Titre et Actions */}
            <div className="top flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <IoReceipt className="text-blue-600" /> {/* Utiliser IoReceipt */}
                    <span>{t('receipt.title')}</span>
                </h2>
                <div className="actions flex items-center gap-3 text-gray-500">
                    {/* TODO: Implémenter les fonctions onClick */}
                    <button title={t('receipt.downloadAction')} className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full p-1">
                        <IoCloudDownloadOutline size={22} />
                    </button>
                    <button title={t('receipt.printAction')} className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full p-1">
                        <IoDocumentsOutline size={22} />
                    </button>
                    <button title={t('receipt.shareAction')} className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full p-1">
                        <IoShareSocialOutline size={22} />
                    </button>
                </div>
            </div>

            {/* Infos Commande Haut (importé) */}
            <CommandTop command={command} /> {/* Assumer CommandTop refactorisé */}

            {/* Section Produits */}
            {/* Utiliser mt-6 mb-2 */}
            <h3 className='text-lg font-semibold text-gray-700 mt-6 mb-2'>{t('order.productListTitle')}</h3>
            {/* Utiliser flex flex-col gap-3 */}
            <div className="products-list flex flex-col gap-3">
                {command?.items?.map((item) => <CommandProduct key={item.id} item={item} />)} {/* Assumer CommandProduct refactorisé */}
                {(!command?.items || command.items.length === 0) && (
                    <p className="text-sm text-gray-500 italic">{t('receipt.noItems')}</p>
                )}
            </div>

            {/* Séparateur */}
            <hr className="my-6 border-gray-200" />

            {/* Résumé Financier */}
            {/* Utiliser flex flex-col gap-1.5 */}
            <div className="pricing-summary flex flex-col gap-1.5 text-sm">
                <h3 className='text-base font-semibold text-gray-700 mb-2'>{t('receipt.priceSummaryTitle')}</h3>
                {/* Sous-total */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('receipt.subtotal')}</span>
                    <span className="font-medium text-gray-800">{subTotal.toLocaleString()} {command?.currency}</span>
                </div>
                {/* Livraison */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('receipt.deliveryFee')}</span>
                    <span className="font-medium text-gray-800">{deliveryPrice.toLocaleString()} {command?.currency}</span>
                </div>
                {/* Réductions (Afficher seulement si > 0) */}
                {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-green-600">{t('receipt.discounts')}</span>
                        <span className="font-medium text-green-600">- {discountAmount.toLocaleString()} {command?.currency}</span>
                    </div>
                )}
                {/* Ligne Total */}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">{t('receipt.grandTotal')}</span>
                    <span className="text-base font-bold text-gray-900">{grandTotal.toLocaleString()} {command?.currency}</span>
                </div>
            </div>

            {/* Séparateur */}
            <hr className="my-6 border-gray-200" />

            {/* Infos Paiement & Livraison */}
            {/*
   - grid: Active le layout grid.
   - grid-cols-1: Par défaut (mobile), une seule colonne. Chaque élément prend toute la largeur.
   - md:grid-cols-2: À partir du breakpoint 'md' (medium, 768px par défaut), passer à deux colonnes.
   - gap-x-6: Espace horizontal entre les colonnes sur 'md' et plus.
   - gap-y-4: Espace vertical entre les lignes (utile sur mobile quand c'est une seule colonne).
   - text-sm: Taille de texte par défaut pour cette section.
 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                {/* Paiement */}
                {/*
      - flex: Active flexbox.
      - justify-between: Écarte les éléments (Label vs Valeur).
      - items-center: Centre verticalement.
    */}
                <div className="flex justify-between items-center">
                    {/* Label */}
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0 mr-2"> {/* flex-shrink-0 + mr-2 pour éviter que le label soit compressé */}
                        <IoCard className="w-5 h-5 text-gray-400" />
                        {t('receipt.paymentMethodLabel')}:
                    </span>
                    {/* Valeur */}
                    {/*
           - font-medium, text-gray-800: Style du texte.
           - flex, items-center, gap-2: Layout interne si PaymentMethodElement contient plusieurs choses.
           - text-right: Aligner le texte de la valeur à droite (optionnel).
         */}
                    <span className='font-medium text-gray-800 flex items-center gap-2 text-right'>
                        <PaymentMethodElement paymentMethod={paymentMethod as any} />
                    </span>
                </div>

                {/* Livraison */}
                {/* Mêmes classes flex que pour Paiement */}
                <div className="flex justify-between items-center">
                    {/* Label */}
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0 mr-2">
                        {deliveryMode
                            ? <FaTruck className="w-5 h-5 text-gray-400" />
                            : <IoStorefront className="w-5 h-5 text-gray-400" />}
                        {t('receipt.deliveryMethodLabel')}:
                    </span>
                    {/* Valeur */}
                    {/* text-right: Aligner la valeur à droite */}
                    <span className='font-medium text-gray-800 text-right'>
                        {deliveryMode ? t('order.deliveryMode.home') : t('order.deliveryMode.pickup')}
                    </span>
                </div>
            </div>
            <div className="mt-8 pt-4 border-t border-dashed border-gray-300 text-center text-xs text-gray-500">
                {t('receipt.footerNote', { storeName: currentStore?.name ?? 'Sublymus Store' })}
            </div>

        </div> // Fin du conteneur principal du reçu
    );
}