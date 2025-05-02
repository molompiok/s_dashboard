//Components/Utils/StringFormater.ts
import { Host } from "../../renderer/+config";


export const getImg = (img?: string | Blob, size = 'cover', _host?: string | null | undefined) => {
    const _img = typeof img == 'string'
        ? img :
        img instanceof Blob ?
            URL.createObjectURL(img) : ''
        
    return `no-repeat center/${size} url(${(
            _img?.startsWith('/') && _host !== null
                ? _host || Host
                : ''
        )
        }${img})`
}
