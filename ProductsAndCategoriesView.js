class ProductsAndCategoriesView {

    #productsContainer;
    #categoriesView;
    #productsView;

    constructor(productsContainer) {
        this.#productsContainer = productsContainer;
        this.#categoriesView = new CategoriesView(productsContainer);
        this.#productsView = new ProductsView(productsContainer, Config.showBarcodeInHeading);
    }

    displayProductsAndCategories({ products, categories }) {
        UIUtils.clearChildrenOf(this.#productsContainer);
        this.#categoriesView.displayCategories(categories);
        this.#productsContainer.appendChild(UIUtils.createDiv());
        this.#productsView.displayProducts(products);
    }

    setOnCategoryClicked(onCategoryClicked) {
        this.#categoriesView.setOnCategoryClicked(onCategoryClicked);
    }
}