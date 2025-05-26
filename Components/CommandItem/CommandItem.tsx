import { useTranslation } from "react-i18next";
import { CommandInterface } from "../../api/Interfaces/Interfaces";
import { getMedia } from "../Utils/StringFormater";
import { OrderStatusElement } from "../Status/Satus";
import { useGlobalStore } from "../../api/stores/StoreStore";

// --- Composant CommandItem (Seulement styles Tailwind) ---
export function CommandItem({ command }: { command: CommandInterface }) {
    const { t } = useTranslation(); // ✅ i18n
    return (
        <div className="command-item  bg-white shadow-sm border border-gray-100 w-full rounded-xl gap-2 flex flex-col items-start p-3 transition duration-100 hover:bg-slate-100">
            {/* Info Client */}
            <div className="w-full flex flex-col sl2:flex-row sl2:items-center gap-2 cursor-pointer">
                {/* Image + Infos */}
                <div className='flex items-center gap-2 min-w-0'>
                    {/* Image Client */}
                    <div
                        className="w-14 h-14 rounded-xl flex-shrink-0 bg-cover bg-center bg-no-repeat bg-gray-200"
                        style={{ background: getMedia({ isBackground: true, source: command.user?.photo?.[0] ?? '/res/delivery_moto.png', from: 'api' }) }} // Utiliser photo user si dispo
                    ></div>
                    {/* Infos Textuelles */}
                    <div className="flex flex-col gap-0.5 flex-shrink overflow-hidden">
                        <h2 className='font-medium text-base text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap'>
                            {command.user?.full_name || t('common.anonymous')} {/* Afficher nom ou 'Anonyme' */}
                        </h2>
                        <p className='text-xs text-gray-500 whitespace-nowrap'>{t('dashboard.itemCount', { count: command.items_count || 0 })}</p> {/* 🌍 i18n */}
                        <p className='text-xs text-gray-500 whitespace-nowrap'>ID : #{command.id.substring(0, command.id.indexOf('-') ?? 8)}</p>
                    </div>
                </div>
                {/* Partie Droite */}
                <div className="ml-auto flex flex-row sl2:flex-col-reverse sl2:items-end gap-2 md:flex-row md:items-center md:gap-3 flex-shrink-0">
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

export function CommandItemSkeleton() {
    return (
        <div className="command-item-row flex items-center gap-3 sm:gap-4 p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 w-full animate-pulse">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-gray-300 flex-shrink-0"></div>
            <div className="flex-grow min-w-0 flex flex-col gap-1">
                <div className="h-5 w-3/5 bg-gray-300 rounded"></div> {/* Nom */}
                <div className="hidden md:block h-3 w-4/5 bg-gray-200 rounded"></div> {/* Desc */}
            </div>
            <div className="hidden sm:flex h-4 w-12 bg-gray-200 rounded flex-shrink-0"></div> {/* Nb Produits */}
            <div className="hidden md:flex h-4 w-8 bg-gray-200 rounded flex-shrink-0"></div> {/* Visibilité */}
            <div className="hidden lg:flex h-4 w-16 bg-gray-200 rounded flex-shrink-0"></div> {/* Date */}
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 ml-auto sm:ml-0"></div>
        </div>
    );
}