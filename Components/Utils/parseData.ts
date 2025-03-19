import { FeatureInterface, ProductInterface } from "../../Interfaces/Interfaces";

export { getDefaultFeature, getDefaultValues }

function getDefaultFeature(product:ProductInterface) {
    const defaultFeature = product.features?.find(f=>f.id == product.default_feature_id);
    return defaultFeature
}

function isProduct(source:any): source is ProductInterface {
    return !!source.features
}

function getDefaultValues(source:ProductInterface|FeatureInterface) {
    let f:FeatureInterface|undefined;
    if(isProduct(source)){
        f = getDefaultFeature(source)
    }else f = source
    return f?.values||[]
}