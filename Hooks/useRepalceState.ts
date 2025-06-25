import { useEffect, useState } from "react"
import { ClientCall } from "../Components/Utils/functions";
export  {useMyLocation,getSearch}
import { navigate } from 'vike/client/router'

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
  function getParams(url: string): string[] {
    if(!url) return []
    try {
      const u = new URL(url);
      const pathSegments = u.pathname.split('/').filter(Boolean);
      return pathSegments;
    } catch (error) {
      console.error('Invalid URL:', error);
      return [];
    }
  }

  function useMyLocation() {
    const [myLocation, setMyLocation] = useState<Location>(ClientCall(()=>location,{}))    

    useEffect(()=>{
        (function() {
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
        
            function handleUrlChange(method:string, ...args:(string | URL | null | undefined)[]) {
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
        setMyLocation({...location})
    });
    },[])
    
    
    
    return {myLocation, get params(){
      if(!myLocation.href) return []
      return getParams(myLocation.href)
    } , get searchPared(){
       return getSearch(myLocation);
    },  replaceLocation(url:string){
      history.replaceState(null, "", url);
    },nextPage(url:string){
     navigate(url,{ keepScrollPosition: true })
    }}
}