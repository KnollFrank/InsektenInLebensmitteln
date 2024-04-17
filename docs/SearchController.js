class SearchController {

    #searchUI;
    #productSearcher;
    #productsAndCategoriesView;

    constructor(searchUI, productSearcher, productsAndCategoriesView) {
        this.#searchUI = searchUI;
        this.#productSearcher = productSearcher;
        this.#productsAndCategoriesView = productsAndCategoriesView;
        searchUI.form.addEventListener(
            'submit',
            e => {
                e.preventDefault();
                this.#search(searchUI.input.value);
            });
    }

    reset() {
        this.#resetAndFocus(this.#searchUI.input);
        this.#productsAndCategoriesView.displayProductsAndCategories({ products: [], categories: [] });
        UIUtils.setVisible(this.#searchUI.noSearchResults, false);
    }

    #search(search) {
        this.#showProducts(this.#productSearcher.searchProductsBy(search));
    }

    #showProducts(products) {
        UIUtils.setVisible(this.#searchUI.noSearchResults, products.length === 0);
        this.#productsAndCategoriesView.displayProductsAndCategories(
            {
                products: products,
                categories: []
            });
    }

    #resetAndFocus(input) {
        input.value = '';
        input.focus();
    }
}