class SearchController {

    #searchUI;
    #productsAndCategoriesView;

    constructor(searchUI, productSearcher, productsAndCategoriesView) {
        this.#searchUI = searchUI;
        this.#productsAndCategoriesView = productsAndCategoriesView;
        searchUI.form.addEventListener(
            'submit',
            e => {
                e.preventDefault();
                productsAndCategoriesView.displayProductsAndCategories(
                    {
                        products: productSearcher.searchProductsBy(searchUI.input.value),
                        categories: []
                    });
            });
    }

    reset() {
        this.#resetAndFocus(this.#searchUI.input);
        this.#productsAndCategoriesView.displayProductsAndCategories({ products: [], categories: [] });
    }

    #resetAndFocus(input) {
        input.value = '';
        input.focus();
    }
}