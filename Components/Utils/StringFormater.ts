import { Host } from "../../renderer/+config";

// export const  toDate = (date: string) => {
//     let a: any = new Date(date).toLocaleTimeString();
//     a = a.split(':');
//     return `${a[0]}:${a[1]}`
// }
// export const  limit = (text: string, max: number) => {
//     return text?.length > max ? text.substring(0, max) + '..' : (text||'')
// }
export const  getImg = (img?: string|Blob,size='cover',_host?:string|null|undefined) => {
    const _img = typeof img == 'string'
    ? img :
    img instanceof Blob ?
        URL.createObjectURL(img) : ''
    return `no-repeat center/${size} url(${_host ?_host :_host===null?'':(_img?.startsWith('/') ?_host|| Host : '')}${img})`
}

// export const Click = (n=0.5 )=>{
//     return (e:any)=>{
//         const div = e.currentTarget;
//         div.style.opacity = String(n);
//         setTimeout(() => {
//             div.style.opacity = '';
//         },100);
//     }
// }



// const caches: any = {

// }

// export function LabelToColor(label: string) {
//     if (caches[label]) return caches[label]
//     const color = (
//         ((label.charCodeAt(0) || 0)%32) +
//         ((label.charCodeAt(1) || 0) % 32) +
//         ((label.charCodeAt(2) || 0) % 32)
//     ) / (32*3);
//     return caches[label] = `hsl(${255*color}, 100%, 71%)`;
// }