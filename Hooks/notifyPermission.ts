import { useEffect, useState } from "react";

export function notifPermission() {
  const [permission, setPermission] = useState<PermissionStatus['state']>();

  useEffect(() => {
    let listerner = undefined as any;
    let _result = undefined as any;
    navigator.permissions.query({ name: 'notifications' }).then((result) => {
        _result = result 
        listerner = () => {
            setPermission(result.state)
          }
        result.addEventListener('change', listerner )
      setPermission(result.state)
    })
    return ()=>{
        _result?.removeEventListener('change',listerner)
    }
  },[])
  return permission
}
