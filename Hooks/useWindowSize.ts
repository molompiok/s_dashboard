import { useEffect, useState } from "react";

export function useWindowSize() {
  const _window = typeof window == 'undefined'? {} as any:window
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: _window?.innerWidth||0,
    height: _window?.innerHeight||0,
    screen: '',
  });
  useEffect(() => {
    // Handler to call on _window resize
    function handleResize() {
      // Set _window width/height to state
      setWindowSize({
        width: _window?.innerWidth||0,
        height: _window?.innerHeight||0,
        screen: (_window?.innerWidth||0) < 480 ? 's-480' :( _window?.innerWidth||0) < 680 ? 's-680' : (_window?.innerWidth||0) < 920 ? 's-920' : (_window?.innerWidth||0) < 1200 ? 's-1200' : (_window?.innerWidth||0) < 1800 ? 's-1800' : 's-big'
      });
    }

    _window?.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial _window size
    handleResize();
    // Remove event listener on cleanup
    return () => _window?.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}
