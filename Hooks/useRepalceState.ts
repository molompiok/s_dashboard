import { useEffect, useState } from "react"
import { ClientCall } from "../Components/Utils/functions";
export  {useReplaceState,getSearch}

function getSearch(myLocation:Location) {
    if(!myLocation.search) return {}
    let s = myLocation.search ;
    s = decodeURIComponent(s.slice(1, s.length));
    const ps = s.split('&');
    let res:Record<string,string> = {};
    ps.map(p=>p.split('=')).forEach(p=>{
      try {
        res[p[0]]=JSON.parse(p[1])
      } catch (error) {
        res[p[0]]=p[1]
      }
    });
    return res
  }

  function useReplaceState() {
    const [myLocation, setMyLocation] = useState<Location>(ClientCall(()=>location,{}))    

    useEffect(()=>{
        (function() {
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
        
            function handleUrlChange(method:string, ...args:(string | URL | null | undefined)[]) {
                console.log(`URL changée via ${method}:`, args[2]); // args[2] = nouvelle URL
                window.dispatchEvent(new Event("urlChange")); // Déclenche un événement personnalisé
            }
        
            history.pushState = function(...args) {
                originalPushState.apply(this, args);
                handleUrlChange("pushState", ...args);
            };
        
            history.replaceState = function(...args) {
                originalReplaceState.apply(this, args);
                handleUrlChange("replaceState", ...args);
            };
        })();
        // Écouter l'événement personnalisé
    window.addEventListener("urlChange", () => {
        console.log("Détection d'un changement d'URL :", window.location.pathname);
        setMyLocation({...location})
    });
    },[])
    
    
    
    return {myLocation, get searchPared(){
       return getSearch(myLocation);
    }}
}