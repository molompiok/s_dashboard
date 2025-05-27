import { ClientCall } from "../../Components/Utils/functions";

export const Data = {
    serverUrl: ClientCall(function(){return window.location.origin.replace('dash','server')}) as string |undefined,
    baseUrl:'' as string |undefined,
    apiUrl:'' as string |undefined,
}