export {
    ClientCall
}


function ClientCall(fn:Function,defaultValue:any,...params:any[]) {
    if (typeof window !== 'undefined')
       return fn(...params);
    else
        return defaultValue
}