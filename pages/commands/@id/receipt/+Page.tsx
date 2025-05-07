// pages/commands/@id/Receipt/Receipt.tsx
// import './Receipt.css'; // ❌ Supprimer

import { IoCloudDownloadOutline, IoDocumentsOutline, IoShareSocialOutline, IoPricetags, IoReceipt, IoCard, IoStorefront } from 'react-icons/io5';
import { CommandInterface } from '../../../../Interfaces/Interfaces';
import { CommandProduct, CommandTop, PaymentMethodElement } from '../+Page'; // Importer les sous-composants refactorisés

import { showToast, showErrorToast } from '../../../../Components/Utils/toastNotifications';

import { useTranslation } from 'react-i18next'; // ✅ i18n
import { useEffect, useMemo, useRef, useState } from 'react'; // ✅ useMemo pour calculs
import { FaTruck } from 'react-icons/fa';
import { useGlobalStore } from '../../../stores/StoreStore';
import { usePageContext } from '../../../../renderer/usePageContext';
import { useGetOrderDetails } from '../../../../api/ReactSublymusApi';
import { SpinnerIcon } from '../../../../Components/Confirm/Spinner';

export { Page }

function Page({ command }: { command?: Partial<CommandInterface> }) {
    const { t } = useTranslation(); // ✅ i18n

    const { currentStore } = useGlobalStore();

    const receiptRef = useRef<HTMLDivElement>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const { routeParams } = usePageContext();
    const command_id = routeParams?.['id'];

    // ✅ Utiliser le hook pour récupérer les détails
    const { data: commandFetched } = useGetOrderDetails(
        {
            order_id: command_id
        },
        { enabled: !command && !!currentStore && !!command_id }
    );

    command = command || (commandFetched ?? undefined)

const handleDownloadPdf = async () => {
  if (!receiptRef.current) return;

  try {
    setIsGeneratingPdf(true);

    // ⬇️ Importation dynamique (client-only)
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas-pro')).default;

    // ⬇️ Capture du canvas
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
    });

    // ⬇️ Conversion en image (base64)
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // ⬇️ Création du PDF avec jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // ⬇️ Adapter l'image au format A4
    const imgProps = {
      width: canvas.width,
      height: canvas.height,
    };
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;

    const x = (pageWidth - imgWidth) / 2;
    const y = 20; // marge en haut

    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
    pdf.save(`receipt_${command?.id || 'document'}.pdf`);
  } catch (error) {
    console.error('Erreur PDF :', error);
    showErrorToast('Erreur lors de la génération du PDF');
  } finally {
    setIsGeneratingPdf(false);
  }
};

    // --- Calculs pour le résumé ---
    const subTotal = useMemo(() => {
        return command?.items?.reduce((sum, item) => sum + (item.quantity * (item.price_unit || 0)), 0) ?? 0;
    }, [command?.items]);

    const deliveryPrice = command?.delivery_price ?? 0;
    const discountAmount = 0; // TODO: Ajouter la logique de réduction quand elle existera
    const grandTotal = command?.total_price ?? (subTotal + deliveryPrice - discountAmount); // Utiliser le total de la commande si disponible

    const paymentMethod = command?.payment_method;
    const deliveryMode = command?.with_delivery;

    return (
        // Conteneur principal du reçu - centré, avec fond blanc, ombre, padding
        <div ref={receiptRef} className="receipt-view f-h-full w-[95%] max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8 my-8 print:shadow-none print:my-0 print:p-0"> {/* Ajusté max-w, print styles */}
            {/* En-tête avec Titre et Actions */}
            <div className="top flex justify-between items-center border-b border-gray-200 pb-4 mb-6 print:hidden"> {/* print:hidden pour masquer à l'impression */}
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <IoReceipt className="text-blue-600" />
                    <span>{t('receipt.title')}</span>
                </h2>
                <div className="actions flex items-center gap-3 text-gray-500">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf}
                        title={t('receipt.downloadAction')}
                        className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPdf ? <SpinnerIcon /> : <IoCloudDownloadOutline size={22} />} {/* Ajouter un SpinnerIcon */}
                    </button>
                </div>
            </div>

            {/* Infos Commande Haut (importé) */}
            <CommandTop command={command} />

            {/* Section Produits */}
            <h3 className='text-lg font-semibold text-gray-700 mt-6 mb-2'>{t('order.productListTitle')}</h3>
            <div className="products-list flex flex-col gap-3">
                {command?.items?.map((item) => <CommandProduct key={item.id} item={item} />)} {/* Assumer CommandProduct refactorisé */}
                {(!command?.items || command.items.length === 0) && (
                    <p className="text-sm text-gray-500 italic">{t('receipt.noItems')}</p>
                )}
            </div>

            {/* Séparateur */}
            <hr className="my-6 border-gray-200" />

            {/* Résumé Financier */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                {/* Paiement */}
                <div className="flex justify-between items-center">
                    {/* Label */}
                    <span className="text-gray-600 flex items-center gap-2 flex-shrink-0 mr-2"> {/* flex-shrink-0 + mr-2 pour éviter que le label soit compressé */}
                        <IoCard className="w-5 h-5 text-gray-400" />
                        {t('receipt.paymentMethodLabel')}:
                    </span>
                    {/* Valeur */}
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
