import { useEffect, useState } from "react";

export function checkVisibility(/* id: string, */ ref: { current: HTMLElement | null | undefined }, interval: number, check: boolean) {

    const [visible, setVisible] = useState(false)
  
    const [data] = useState({
      rect: new DOMRect(),
      id: 0,
  
      init(this: { id: number, rect: DOMRect }) {
  
        clearInterval(this.id);
  
        const id = setInterval(() => {
          if (!ref.current) return;
          const rect = ref.current.getBoundingClientRect();
          const widthVisible = rect.x < (window.innerWidth) && (rect.x + rect.width) > 0
          const heightVisible = rect.y < (window.innerHeight) && (rect.y + rect.height) > 0
          const visible = heightVisible && widthVisible;
          setVisible(visible)
        }, interval)
  
        return () => clearInterval(id);
  
      },
      remove(this: { id: number }) {
        clearInterval(this.id)
      }
    });
  
    useEffect(() => {
      if (check) data.init();
      else data.remove();
      return ()=>{
        data.remove();
      }
    }, [check]);
  
    return visible;
  }