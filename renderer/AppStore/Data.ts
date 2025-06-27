import { ClientCall } from "../../Components/Utils/functions";

export const Data = {
    serverUrl: '',
    baseUrl:'' as string |undefined,
    serverApiUrl:'' as string |undefined,
    apiUrl:'' as string |undefined,
}
export const host = (process.env.NODE_ENV == 'production' ? 'https://' : 'http://') ;
