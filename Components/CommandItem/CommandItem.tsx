import { useTranslation } from "react-i18next";
import { CommandInterface } from "../../Interfaces/Interfaces";
import { getImg } from "../Utils/StringFormater";
import { OrderStatusElement } from "../Status/Satus";

// --- Composant CommandItem (Seulement styles Tailwind) ---
export function CommandItem({ command }: { command: CommandInterface }) {
    const { t } = useTranslation(); // ✅ i18n
    return (
         // Utiliser les classes Tailwind dérivées de CommandItem.css
         // Ajout de padding global p-3
        <div className="bg-white shadow-sm border border-gray-100 w-full rounded-xl gap-2 flex flex-col items-start p-3 transition duration-100 hover:bg-gray-50">
             {/* Info Client */}
             {/* Utiliser flex, items-center, gap-2, cursor-pointer */}
            <div className="w-full flex items-center gap-2 cursor-pointer">
                 {/* Image + Infos */}
                 {/* Utiliser flex, items-center, gap-2, min-w-0 (important pour flex-shrink) */}
                <div className='flex items-center gap-2 min-w-0'>
                     {/* Image Client */}
                     {/* Utiliser w-14 h-14, rounded-xl, flex-shrink-0, bg-cover, bg-center, bg-gray-200 */}
                    <div
                        className="w-14 h-14 rounded-xl flex-shrink-0 bg-cover bg-center bg-no-repeat bg-gray-200"
                        style={{ background: getImg(command.user?.photo?.[0] ?? '/res/delivery_moto.png') }} // Utiliser photo user si dispo
                    ></div>
                     {/* Infos Textuelles */}
                     {/* Utiliser flex, flex-col, gap-0.5, flex-shrink, overflow-hidden */}
                    <div className="flex flex-col gap-0.5 flex-shrink overflow-hidden">
                        <h2 className='font-medium text-base text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap'>
                            {command.user?.full_name || t('common.anonymous')} {/* Afficher nom ou 'Anonyme' */}
                        </h2>
                         <p className='text-xs text-gray-500 whitespace-nowrap'>{t('dashboard.itemCount', { count: command.items_count || 0 })}</p> {/* 🌍 i18n */}
                         <p className='text-xs text-gray-500 whitespace-nowrap'>ID : #{command.id.substring(0, command.id.indexOf('-') ?? 8)}</p>
                    </div>
                </div>
                {/* Partie Droite */}
                 {/* Utiliser ml-auto, flex, items-center, gap-3, flex-shrink-0 */}
                 {/* Responsive: md:flex-row flex-col-reverse items-end md:items-center */}
                <div className="ml-auto flex flex-col-reverse items-end gap-2 md:flex-row md:items-center md:gap-3 flex-shrink-0">
                    {/* Statut */}
                    <span className='flex justify-end'>
                         <OrderStatusElement status={(command.status || command.payment_status)?.toUpperCase() as any || ''} />
                    </span>
                    {/* Prix */}
                    <h3 className='px-2.5 py-1 bg-gray-100 rounded-lg font-normal text-sm whitespace-nowrap text-gray-700'>
                         {Number(command.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {command.currency || 'FCFA'} {/* Formatage prix */}
                    </h3>
                </div>
            </div>
        </div>
    );
}

export function CategoryItemSkeletonMini() {
    return (
        // Dimensions et styles similaires à CategoryItemMini
        <div className="w-20 h-20 p-1.5 rounded-xl bg-gray-200 animate-pulse flex flex-col items-center">
            {/* Placeholder pour l'image */}
            <div className="w-full aspect-square rounded bg-gray-300 mb-1"></div>
            {/* Placeholder pour le texte */}
            <div className="w-10/12 h-2 rounded bg-gray-300"></div>
        </div>
    );
}