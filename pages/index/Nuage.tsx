import { useEffect, useState } from "react";
export {Nuage}

function ClientCall(fn:Function,defaultValue:any,...params:any[]) {
    if (typeof window !== 'undefined')
       return fn(...params);
    else
        return defaultValue
}
const sizes = Array.from({ length: 100 }).map(() => ClientCall(Math.random,0) * 10 + 5);
function Nuage({ color, density, height, speed, width }: { width: number, height: number, density: number, speed: number, color: string }) {
    const [d] = useState({} as any)
    useEffect(()=>{
        let i= 0;
        const id = setInterval(() => {
            Object.values(d).forEach((p: any) => {
                if(i > p.l){
                    p.a += ((ClientCall(Math.random,0)*2 - 1)*0.5)*Math.PI;
                    p.l = i+p.i
                    // console.log(p,i,p.l);
                } 
                p.x += p.v* Math.cos(p.a);
                p.y += p.v* Math.sin(p.a);
                p.x = p.x > width ? 0 : (p.x <0 ? width : p.x);
                p.y = p.y > height ? 0 : (p.y <0 ? height : p.y);
                p.ref.style.transform = `translate(${p.x}px,${p.y}px)`
                // console.log(p.l,i, p.i,p.a);
            })
            i++;
            
        }, 20);
        return ()=>{
            clearInterval(id )
        }
    },[])
    return (
        <div className="nuage" style={{
            width: `${width}px`,
            height: `${height}px`,
            position: 'relative',
        }}>
            {
                Array.from({ length: ((width*height)/100)*density }).map((_, i) => {
                    const s = sizes[i];
                    const positions = {
                        l:0,
                        i:Math.trunc(ClientCall(Math.random,0)*10000+5000),
                        a:(ClientCall(Math.random,0)*2 - 1)*Math.PI,
                        s,
                        x: ClientCall(Math.random,0) * width,
                        y: ClientCall(Math.random,0) * height,
                        v: (ClientCall(Math.random,0) * Math.min(1,Math.max(0,speed))+1)*0.1,
                        ref: null as HTMLDivElement|null,
                    }
                    d[i] = positions;
                    return <div key={i} style={{ 
                        borderRadius:'50%',
                        background: color, 
                        width: `${s}px`, 
                        height: `${s}px`,
                        position: 'absolute',
                    }} ref={ref=>{ positions.ref = ref}}></div>
                })
            }
        </div>
    )

}