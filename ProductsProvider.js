class ProductsProvider {

    static loadProducts(file) {
        return fetch(file)
            .then(response => response.json())
            .then(products => {
                ProductsProvider.#adaptAttributesOfProducts(products);
                return products;
            });
    }

    static #adaptAttributesOfProducts(products) {
        for (const product of products) {
            ProductsProvider.#adaptAttributesOfProduct(product);
        }
    }

    static #adaptAttributesOfProduct(product) {
        product.categories_tags = new Set(product.categories_tags);
        product.countries = new Set(product.countries);
        product.stores = new Set(product.stores);
    }
}