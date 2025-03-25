import { FeatureInterface, ProductInterface } from "../../Interfaces/Interfaces";

export { getDefaultFeature, getDefaultValues,IsFeaturesHere }

function IsFeaturesHere(product:Partial<ProductInterface>) {
    return product?.features && product.features.length>0
} 

function getDefaultFeature(product:Partial<ProductInterface>) {
    const defaultFeature = product.features?.find(f=>f.id == product.default_feature_id);
    return defaultFeature
}

function isProduct(source:any): source is Partial<ProductInterface> {
    return !!source.features
}

function getDefaultValues(source:Partial<ProductInterface>|FeatureInterface) {
    let f:FeatureInterface|undefined;
    if(isProduct(source)){
        f = getDefaultFeature(source)
    }else f = source
    return f?.values||[]
}