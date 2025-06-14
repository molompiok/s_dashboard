import { useTranslation } from "react-i18next";
import { CommandInterface } from "../../api/Interfaces/Interfaces";
import { getMedia } from "../Utils/StringFormater";
import { OrderStatusElement } from "../Status/Satus";

// --- Composant CommandItem (avec mode nuit) ---
export function CommandItem({ command }: { command: CommandInterface }) {
    const { t } = useTranslation();
    return (
        // 🎨 Conteneur principal avec effet verre dépoli en mode nuit
        <div className="command-item w-full flex flex-col items-start gap-2 p-3 rounded-xl
                       bg-white/80 dark:bg-white/5 backdrop-blur-md 
                       shadow-sm border border-gray-200/80 dark:border-white/10
                       hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20
                       transition-all duration-200">
            
            {/* Info Client */}
            <div className="w-full flex flex-col sl2:flex-row sl2:items-center gap-2 cursor-pointer">
                {/* Image + Infos */}
                <div className='flex items-center gap-3 min-w-0'>
                    {/* Image Client */}
                    <div
                        className="w-11 h-11 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm flex items-center justify-center shrink-0"
                        style={{ backgroundImage: getMedia({ isBackground: true, source: command.user?.photo?.[0], from: 'api' }) }}
                    >
                        {!command.user?.photo?.[0] && command.user?.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    {/* Infos Textuelles */}
                    <div className="flex flex-col gap-0.5 flex-shrink overflow-hidden">
                        <h3 className='font-semibold text-sm text-gray-800 dark:text-gray-100 overflow-hidden text-ellipsis whitespace-nowrap'>
                            {command.user?.full_name || t('common.anonymous')}
                        </h3>
                        <p className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>{t('dashboard.itemCount', { count: command.items_count || 0 })}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap'>ID: #{command.id.substring(0, 8)}</p>
                    </div>
                </div>

                {/* Partie Droite */}
                <div className="ml-auto flex flex-row sl2:flex-col-reverse sl2:items-end gap-2 md:flex-row md:items-center md:gap-3 flex-shrink-0">
                    {/* Statut */}
                    <span className='flex justify-end'>
                        <OrderStatusElement status={(command.status || command.payment_status)?.toUpperCase() as any || ''} />
                    </span>
                    {/* Prix */}
                    <h4 className='px-2.5 py-1 bg-gray-100 dark:bg-black/20 rounded-lg font-semibold text-sm whitespace-nowrap text-gray-700 dark:text-gray-200'>
                        {Number(command.total_price || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {command.currency || 'FCFA'}
                    </h4>
                </div>
            </div>
        </div>
    );
}

// --- Skeleton pour CommandItem ---
export function CommandItemSkeleton() {
    return (
        // 🎨 Skeleton adapté au mode nuit
        <div className="w-full flex items-center gap-3 p-3 bg-gray-100/80 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0"></div>
            <div className="flex-grow min-w-0 flex flex-col gap-2">
                <div className="h-4 w-3/5 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-600 rounded-md"></div>
            </div>
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0 ml-auto"></div>
        </div>
    );
}