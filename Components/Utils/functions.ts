export {
    ClientCall,
    getFileType,
    shortNumber
}


function ClientCall(fn:Function,defaultValue:any,...params:any[]) {
    if (typeof window !== 'undefined')
       return fn(...params);
    else
        return defaultValue
}

function getFileType(file: string | Blob) {
  if (typeof file == 'string') {
    const ext = file.substring(file.lastIndexOf('.') + 1, file.length);
    if (['webp', 'jpg', 'jpeg', 'png', 'avif', 'gif', 'tif', 'tiff', 'ico', 'svg'].includes(ext)) {
      return 'image';
    } else if (['webm', 'mp4', 'mov', 'avi', 'wmv', 'avchd', 'mkv', 'flv', 'mxf', 'mts', 'm2ts', '3gp', 'ogv'].includes(ext)) {
      return 'video';
    } else if (file.startsWith('data:image')) {
      return 'image'
    } else if (file.startsWith('data:video')) {
      return 'video'
    }
  } else {
    if (file.type.split('/')[0] == 'image') {
      return 'image'
    } else if (file.type.split('/')[0] == 'video') {
      return 'video'
    }
  }
  return
}


function shortNumber(n:number) {
  const n0 = Math.trunc(n).toString().length -1 //nombre de 0 en entrer
  const index = Math.floor((n0 )/3); //index du array
  const r = n0%3; // nombre de  0 a afficher
  const result = n/Math.pow(10,n0-r)
  return (Math.trunc(result*100)/100)+(['','K','M','B','T','Q'][index])
}