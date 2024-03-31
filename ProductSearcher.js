class ProductSearcher {

    #products;

    constructor(products) {
        this.#products = products;
    }

    searchProductsBy(search) {
        const SEARCH = search.toUpperCase();
        return this.#products.filter(product => ProductSearcher.#isProductMatchedBy(product, SEARCH));
    }

    static #isProductMatchedBy(product, SEARCH) {
        return product.product_name.toUpperCase().includes(SEARCH) || ProductSearcher.#isAnyBrandMatchedBy(product.brands, SEARCH);
    }

    static #isAnyBrandMatchedBy(brands, SEARCH) {
        return brands.some(brand => ProductSearcher.#isBrandMatchedBy(brand, SEARCH));
    }

    static #isBrandMatchedBy(brand, SEARCH) {
        return brand.toUpperCase().includes(SEARCH);
    }

}