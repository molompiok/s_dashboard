import { useTranslation } from "react-i18next";

export function AddStoreCard({ onClick}: {onClick:()=>void}) {
    const { t } = useTranslation();
    return (
        <div onClick={onClick} className=" rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition duration-200 cursor-pointer flex flex-col items-center justify-center text-center p-4 text-gray-500 hover:text-blue-600">
            <div className="w-24 h-42 mb-4">
                <img src={'/res/empty/Empty_bag.png'} alt={t('storesPage.addStore')} className='w-full h-full object-contain opacity-70' />
            </div>
            <span className="text-sm font-medium">{t('storesPage.addStore')}</span>
        </div>
    );
}