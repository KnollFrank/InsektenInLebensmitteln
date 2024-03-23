class NodeView {

    #productsAndCategoriesView;
    #productsAndCategoriesProvider;
    #categoryText;

    constructor(productsAndCategoriesView, productsAndCategoriesProvider, categoryText) {
        this.#productsAndCategoriesView = productsAndCategoriesView;
        this.#productsAndCategoriesProvider = productsAndCategoriesProvider;
        this.#categoryText = categoryText;
    }

    displayNode(node) {
        const { products, categories } = this.#productsAndCategoriesProvider.getProductsAndCategories(node);
        this.#productsAndCategoriesView.displayProductsAndCategories({ products, categories });
        this.#categoryText.textContent = node.getDisplayName();
    }
}