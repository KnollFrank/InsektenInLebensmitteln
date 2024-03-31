class ProductFilter {

    static getProductsBelongingToStore(products, store) {
        return products.filter(product => product.stores.has(store));
    }
}