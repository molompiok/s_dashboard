import { useState, useEffect } from "react";
import { ClientCall } from "../Components/Utils/functions";
export { useHashWatcher};

const useHashWatcher = () => {
  const [hash, setHash] = useState(ClientCall(()=>window.location.hash,''));

  useEffect(() => {
    const handleHashChange = () => {
      setHash(ClientCall(()=>window.location.hash,''));
    };

    typeof window !== undefined && window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => {
        typeof window !== undefined && window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return hash;
};
