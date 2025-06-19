//Components/Utils/StringFormater.ts

import { useGlobalStore } from "../../api/stores/StoreStore"
import { Data } from "../../renderer/AppStore/Data"

const MediaCache: Record<string, any> = {}


export const getMedia = ({ size = 'cover', host, from, isBackground, source }: {
    source?: string | Blob|null,
    size?: 'cover' | 'contain',
    host?: string | null | undefined,
    from?: 'server' | 'api' | 'local' | null,
    isBackground?: boolean
}) => {
    const _source = typeof source == 'string'
        ? source :
        source instanceof Blob ?
            MediaCache[(source as File).name + source.size + source.type] || (MediaCache[(source as File).name + source.size + source.type] = URL.createObjectURL(source)) : ''

    const _host = from == 'api' ?
        Data.apiUrl :
        from == 'server' ? `${Data.serverUrl}` : ''
    const url = `${(
        _source?.startsWith('/') ? (host || _host || ''):''
    )
        }${_source}`
    if (isBackground) {
        return `no-repeat center / ${size} url(${url})`
    }

    return url;
}
