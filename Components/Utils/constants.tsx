import { IoBagHandle, IoBagHandleOutline, IoCart, IoCartOutline, IoHome, IoHomeOutline, IoPeople, IoPeopleOutline, IoStatsChart, IoStatsChartOutline, IoStorefront, IoStorefrontOutline } from "react-icons/io5"


export { Icons, NEW_VIEW, OrderStatus, PaymentMethod, PaymentStatus }
const NEW_VIEW = 'new_view'

const Icons = {
    category: <IoCart />,
    category_outline: <IoHome />,
    home: <IoHome />,
    home_outline: <IoHomeOutline />,
    products: <IoBagHandle />,
    products_outline: <IoBagHandleOutline />,
    stores: <IoStorefront />,
    stores_outline: <IoStorefrontOutline />,
    teams: <IoPeople />,
    teams_outline: <IoPeopleOutline />,
    stats: <IoStatsChart />,
    stats_outline: <IoStatsChartOutline />,
    commands: <IoCart />,
    commands_outline: <IoCartOutline />,
}
enum OrderStatus {
    PENDING = 'pending',
    CANCELED = 'canceled',
    CONFIRMED = 'confirmed',
    RETURNED = 'returned',
    DELIVERED = 'delivered',
    PICKED_UP = 'picked_up',
    NOT_DELIVERED = 'not_delivered',
    NOT_PICKED_UP = 'not_picked_up',
    WAITING_FOR_PAYMENT = 'waiting_for_payment',
    WAITING_PICKED_UP = 'waiting_picked_up',
}

enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    PAYPAL = 'paypal',
    MOBILE_MONEY = 'mobile_money',
    CASH = 'cash',
}

enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}
/*
IoArrowBackCircle IoArrowForwardCircle
IoLayers IoLayersOutline

        IoHelp  IoHelpCircleOutline IoInformation IoInformationCircleOutline 

        IoPencil
        IoPricetag IoPricetagOutline
        IoPricetags IoPricetagsOutline
        IoReceipt IoReceiptOutline
        IoRepeat , IoReturnUpBack , IoReturnUpForward
        IoSave IoSaveOutline
        IoSend IoSendOutline
        IoShareSocial IoShareSocialOutline
        IoShare  IoShareOutline

        IoSettings IoSettingsOutline
        IoWallet IoWalletOutline
*/