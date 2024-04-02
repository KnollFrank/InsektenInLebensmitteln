class ProductsViewActivity {

    #productsAndCategoriesContainer;
    #categoryText;
    #lastUpdated;
    #prevBtn;
    #countrySelectElement;
    #country;
    #storeSelectElement;
    #store;
    #searchUI;
    #overlay;
    #infoDialog;

    constructor({ productsAndCategoriesContainer, categoryText, lastUpdated, prevBtn, countrySelectElement, country, storeSelectElement, store, searchUI, overlay, infoDialog }) {
        this.#productsAndCategoriesContainer = productsAndCategoriesContainer;
        this.#categoryText = categoryText;
        this.#lastUpdated = lastUpdated;
        this.#prevBtn = prevBtn;
        this.#countrySelectElement = countrySelectElement;
        this.#country = country;
        this.#storeSelectElement = storeSelectElement;
        this.#store = store;
        this.#searchUI = searchUI;
        this.#overlay = overlay;
        this.#infoDialog = infoDialog;
    }

    start() {
        InfoDialogController.configureDialog(this.#infoDialog);
        this.#withLoadedDataDo(
            ({ categoriesGraph, products, countries, lastUpdated, stores }) => {
                // FK-FIXME: falls this.#country einen ungültigen Wert hat, dann verwende stattdessen CountryController.ALL_COUNTRIES
                CountryController.configure(
                    {
                        countrySelectElement: this.#countrySelectElement,
                        countries: countries,
                        selectedCountry: this.#country,
                        onCountrySelected: country => ProductsViewActivity.#reloadPageForCountryAndStore(country, StoreController.ALL_STORES)
                    });
                StoreController.configure(
                    {
                        storeSelectElement: this.#storeSelectElement,
                        stores: stores,
                        selectedStore: this.#store,
                        onStoreSelected: store => ProductsViewActivity.#reloadPageForCountryAndStore(this.#country, store)
                    });
                this.#lastUpdated.textContent =
                    lastUpdated.toLocaleString(
                        'en-US',
                        {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                this.#configure(categoriesGraph, products);
            }
        );
    }

    static #reloadPageForCountryAndStore(country, store) {
        UrlUtils.loadPage(ProductsViewActivity.#getURLForCountryAndStore(country, store));
    }

    static #getURLForCountryAndStore(country, store) {
        const parser = new URL(window.location);
        parser.searchParams.set('country', country);
        parser.searchParams.set('store', store);
        return parser.href;
    }

    #configure(categoriesGraph, products) {
        this.#setInfosOfNodesAndContinue(
            products,
            Graphs.getNodes(categoriesGraph),
            () => {
                const rootNode = categoriesGraph.getNodeAttributes(Graphs.getRootNode(categoriesGraph));
                const productsAndCategoriesView = new ProductsAndCategoriesView(this.#productsAndCategoriesContainer);
                const navigationController =
                    new NavigationController(
                        new Navigation(rootNode),
                        new NodeView(
                            productsAndCategoriesView,
                            new ProductsAndCategoriesProvider(categoriesGraph),
                            this.#categoryText),
                        this.#prevBtn);
                productsAndCategoriesView.setOnCategoryClicked(category => navigationController.gotoChildNode(category));
                this.#prevBtn.addEventListener('click', _ => navigationController.gotoParentNode());
                navigationController.gotoCurrentNode();
                const searchController =
                    new SearchController(
                        this.#searchUI,
                        new ProductSearcher(products),
                        new ProductsAndCategoriesView(this.#searchUI.productsContainer));
                const overlay =
                    new Overlay(
                        {
                            ...this.#overlay,
                            onOpen: () => {
                                searchController.reset();
                            },
                            onClose: () => { }
                        });
                overlay.initialize();
            });
    }

    #withLoadedDataDo(dataConsumer) {
        Promise
            .all(
                [
                    CategoriesGraphProvider.loadCategoriesGraph(`./data/${this.#country}/${this.#store}/categoriesGraph.json`),
                    ProductsProvider.loadProducts(`./data/${this.#country}/${this.#store}/products.json`),
                    fetch('./data/countries.json').then(response => response.json()),
                    fetch('./data/lastUpdatedEpochMilli.json')
                        .then(response => response.json())
                        .then(lastUpdatedEpochMilli => new Date(lastUpdatedEpochMilli)),
                    fetch(`./data/${this.#country}/stores.json`).then(response => response.json())
                ])
            .then(([categoriesGraph, products, countries, lastUpdated, stores]) => {
                dataConsumer({ categoriesGraph, products, countries, lastUpdated, stores });
            });
    }

    #setInfosOfNodesAndContinue(productsHavingImage, nodes, continuation) {
        ProductsOfNodesSetter.setProductsOfNodes(productsHavingImage, nodes);
        DisplayNamesOfNodesSetter.setDisplayNamesOfNodesFromFileAndContinue(
            nodes,
            `./data/${this.#country}/${this.#store}/displayNameByName.json`,
            continuation);
    }
}