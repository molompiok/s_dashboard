//Components/Utils/functions.ts
import { ProductInterface, ValueInterface } from "../../api/Interfaces/Interfaces";

export {
  ClientCall,
  getFileType,
  shortNumber,
  toNameString,
  getAllCombinations,
  getOptions,
  debounce,
  getId,
  copyToClipboard,
  limit
}

export const isProd = process.env.NODE_ENV === 'production';
export const http = isProd ? 'https://' : 'http://' 

function getId(id: string | undefined = '') {
  return '#' + id.substring(0, id.indexOf('-'))
}

const limit = (l?: string | undefined | null, m: number = 16) => {
  return ((l?.length || 0) > m ? l?.substring(0, m) + '..' : l) || ''
}

function ClientCall(fn: Function, defaultValue?: any, ...params: any[]) {
  if (typeof window !== 'undefined')
    try {
      return fn(...params);
    } catch (error) {
      return defaultValue
    }
  else
    return defaultValue
}

async function waitHere(millis: number) {
  await new Promise((rev) => setTimeout(() => rev(0), millis))
}


const CharList = Array.from({ length: 36 }).map((_, i) => Number(i).toString(36));
CharList.push('-');

function toNameString(name: string) {

  let n = name.toLocaleLowerCase();
  let _n = ''
  for (let i = 0; i < n.length; i++) {
    if (CharList.includes(n[i])) {
      _n += n[i];
    } else if (n[i] == ' ') {
      _n += '-'
    }
  }
  return _n
}
function getFileType(file: string | Blob | undefined) {
  console.log('------------- file', file);
  
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
    } else {
      return 'image'
    }
  } else {
    if (file?.type.split('/')[0] == 'image') {
      return 'image'
    } else if (file?.type.split('/')[0] == 'video') {
      return 'video'
    }
  }
  return
}


function shortNumber(n: number) {
  const n0 = Math.trunc(n).toString().length - 1 //nombre de 0 en entrer
  const index = Math.floor((n0) / 3); //index du array
  const r = n0 % 3; // nombre de  0 a afficher
  const result = n / Math.pow(10, n0 - r)
  return (Math.trunc(result * 100) / 100) + (['', 'K', 'M', 'B', 'T', 'Q'][index])
}


export enum FeatureType {

  ICON_TEXT = 'icon_text',
  COLOR = 'color',
  TEXT = 'text',
  ICON = 'icon',
  INPUT = 'input',
  DATE = 'date',
  DOUBLE_DATE = 'double_date',
  RANGE = 'range',
  LEVEL = 'level',
  FILE = ' file',
}


function getOptions(bind: Record<string, string>, product: Partial<ProductInterface>) {
  let additionalPrice = 0;
  let stock: number | null = Infinity; // On prend le minimum donc on part d'un grand nombre
  let decreasesStock = false;
  let continueSelling = false;
  let bindNames: Record<string, ValueInterface | string> = {}
  let bindIds: Record<string, ValueInterface | string> = {}
  // Vérifier les features et récupérer les infos des valeurs sélectionnées
  for (let feature of product.features || []) {
    let featureId = feature.id;

    if ([
      FeatureType.TEXT,
      FeatureType.COLOR,
      FeatureType.ICON,
      FeatureType.ICON_TEXT
    ].includes(feature.type as any)) {
      let valueId = bind[featureId];
      if (!valueId) continue; // Si la feature n'est pas dans le bind, on passe

      let value = feature.values?.find(v => v.id === valueId);
      if (!value) continue; // Si la valeur n'existe pas, on passe
      bindNames[feature.name] = value
      bindIds[feature.id] = value

      // Mettre à jour le prix supplémentaire
      if (value.additional_price) {
        additionalPrice += value.additional_price;
      }

      // Mettre à jour le stock (on prend le minimum)
      if (value.stock !== null && value.stock !== undefined) {
        stock = Math.min(stock, value.stock);
      }

      // Mettre à jour les booléens s'ils sont définis
      if (value.decreases_stock !== null) {
        decreasesStock = decreasesStock || !!value.decreases_stock;
      }
      if (value.continue_selling !== null) {
        continueSelling = continueSelling || !!value.continue_selling;
      }
    } else {
      bindIds[feature.id] = bind[featureId]
      bindNames[feature.name] = bind[featureId]
    }
  }

  // Si aucun stock n'a été défini (aucune valeur n'a de stock renseigné), on met stock = null
  if (stock === Infinity) {
    stock = null;
  }

  return {
    bind,
    bindNames,
    bindIds,
    bind_hash: JSON.stringify(bind),
    additional_price: additionalPrice,
    stock: stock,
    product_id: product.id,
    decreases_stock: decreasesStock,
    continue_selling: continueSelling
  };
}


function getAllCombinations(product: Partial<ProductInterface>) {
  const features = product.features;
  console.log({ features });

  if (!features) return [];

  // Récupérer toutes les valeurs possibles par feature (filtrer les features sans valeurs)
  const featureValues = features
    .map(feature => feature?.values?.map(value => ({
      feature_id: feature.id,
      value_id: value.id
    })) || [])
    .filter(values => values.length > 0); // 🔥 Supprime les features sans valeurs

  console.log({ featureValues });

  // Fonction pour générer les combinaisons cartésiennes
  function cartesianProduct(arr: any) {
    if (arr.length === 0) return []; // 🔥 Si aucune feature avec valeurs, retourner []
    return arr.reduce((acc: any, values: any) =>
      acc.map((comb: any) => values.map((val: any) => [...comb, val])).flat()
      , [[]]);
  }

  // Générer toutes les combinaisons possibles
  const combinations = cartesianProduct(featureValues);
  console.log({ combinations });

  // Transformer chaque combinaison en objet bind { feature_id: value_id, ... }
  const allBinds = combinations.map((comb: any) => {
    return comb.reduce((obj: any, item: any) => {
      obj[item.feature_id] = item.value_id;
      return obj;
    }, {});
  });

  console.log({ allBinds });

  // Générer tous les group_products
  return allBinds.map((bind: any) => getOptions(bind, product)) as (ReturnType<typeof getOptions>)[];
}

const MapCallId: Record<string, { out: number, isRuning: boolean, next: (() => void) | null }> = {}
function debounce(fn: () => void, id: string, out = 300) {
  MapCallId[id] = MapCallId[id] ?? {
    isRuning: false,
    next: null,
    out
  }

  if (MapCallId[id].isRuning) {
    MapCallId[id].next = fn
    MapCallId[id].out = out
  } else {
    MapCallId[id].isRuning = true;
    console.log('isRuning', true);

    fn()

    setTimeout(() => {
      MapCallId[id].isRuning = false;
      console.log('isRuning', false);
      MapCallId[id].next && debounce(MapCallId[id].next, id, MapCallId[id].out);
      MapCallId[id].next = null;
    }, out);
  }
}

async function copyToClipboard(text: string, onSuccess?: () => void, onError?: (err: Error) => void) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error('Clipboard API not supported');
    }
    await navigator.clipboard.writeText(text);
    console.log('Texte copié dans le presse-papiers avec succès !');
    onSuccess?.();
  } catch (err) {
    console.error('Erreur lors de la copie dans le presse-papiers :', err);
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('Texte copié via la méthode de secours !');
      onSuccess?.();
    } catch (fallbackErr) {
      console.error('Échec de la méthode de secours :', fallbackErr);
      onError?.(fallbackErr as Error);
    }
  }
}