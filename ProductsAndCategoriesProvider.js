class ProductsAndCategoriesProvider {

    #categoriesGraph;

    constructor(categoriesGraph) {
        this.#categoriesGraph = categoriesGraph;
    }

    getProductsAndCategories(node) {
        return {
            products: this.#getProducts(node),
            categories: this.#getCategories(node)
        };
    }

    #getProducts(node) {
        return [...node.getProducts()];
    }

    #getCategories(node) {
        return this.#asCategories(this.#categoriesGraph.outNeighbors(node.getName()));
    }

    #asCategories(nodes) {
        return nodes.map(node => this.#categoriesGraph.getNodeAttributes(node));
    }
}