class Node {

    #name;
    #displayName;
    #products;

    constructor(name) {
        this.#name = name;
        this.#products = new Set();
    }

    getName() {
        return this.#name;
    }

    getDisplayName() {
        return this.#displayName;
    }

    setDisplayName(displayName) {
        this.#displayName = displayName;
    }

    // FK-TODO: use https://immutable-js.com/ in order to return an immutable set
    getProducts() {
        return this.#products;
    }

    addProduct(product) {
        this.#products.add(product);
        product.categories_tags.add(this.#name);
    }

    removeProduct(product) {
        this.#products = Node.#productsWithoutProduct(this.#products, product);
        product.categories_tags.delete(this.#name);
    }

    static #productsWithoutProduct(products, product) {
        return Utils.filterSet(
            products,
            _product => _product.barcode !== product.barcode);
    }
}