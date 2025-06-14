//Components/Utils/parseData.ts
import { FeatureInterface, ProductInterface } from "../../api/Interfaces/Interfaces";
import { NEW_ID_START } from "./constants";
import { ClientCall } from "./functions";
export { getNewFeature, getDefaultFeature, getDefaultValues, IsFeaturesHere }
function getNewFeature() {
    return {
        id: NEW_ID_START + ClientCall(Math.random, 0).toString(),
        _request_mode:'new',
        created_at: '',
        name: '',
        product_id: '',
        required: true,
        type: '',
        updated_at: '',
        default: '',
        icon: [],
        index: 1,
        is_double: false,
        max: 0,
        max_size: 0,
        min: 0,
        min_size: 0,
        multiple: false,
        regex: '',
        values: [],
        is_default: false
    } satisfies FeatureInterface
}

function IsFeaturesHere(product: Partial<ProductInterface>) {
    return product?.features && product.features.length > 0
}

function getDefaultFeature(product: Partial<ProductInterface>) {
    const defaultFeature = product.features?.find(f => f.id == product.default_feature_id);
    return defaultFeature
}

function isProduct(source: any): source is Partial<ProductInterface> {
    return !!source.features
}

function getDefaultValues(source: Partial<ProductInterface> | FeatureInterface) {
    let f: FeatureInterface | undefined;
    if (isProduct(source)) {
        f = getDefaultFeature(source)
    } else f = source
    return f?.values || []
}