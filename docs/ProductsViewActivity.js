class ProductsViewActivity {

    #productsAndCategoriesContainer;
    #categoryText;
    #lastUpdated;
    #prevBtn;
    #countrySelectElement;
    #country;
    #storeSelectElement;
    #store;
    #category;
    #searchUI;
    #overlay;
    #infoDialog;

    constructor({ productsAndCategoriesContainer, categoryText, lastUpdated, prevBtn, countrySelectElement, country, storeSelectElement, store, category, searchUI, overlay, infoDialog }) {
        this.#productsAndCategoriesContainer = productsAndCategoriesContainer;
        this.#categoryText = categoryText;
        this.#lastUpdated = lastUpdated;
        this.#prevBtn = prevBtn;
        this.#countrySelectElement = countrySelectElement;
        this.#country = country;
        this.#storeSelectElement = storeSelectElement;
        this.#store = store;
        this.#category = category;
        this.#searchUI = searchUI;
        this.#overlay = overlay;
        this.#infoDialog = infoDialog;
    }

    start() {
        InfoDialogController.configureDialog(this.#infoDialog);
        this.#withLoadedDataDo(
            ({ categoriesGraph, products, countries, lastUpdated, stores }) => {
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
                navigationController.gotoChildNode(this.#categoryAsNode(categoriesGraph));
                this.#prevBtn.addEventListener('click', _ => navigationController.gotoParentNode());
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

    #categoryAsNode(categoriesGraph) {
        return Nodes.getNodeHavingDisplayName(
            Graphs.getNodes(categoriesGraph),
            this.#category);
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