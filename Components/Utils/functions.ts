export {
    ClientCall,
    getFileType
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
