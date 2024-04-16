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
    #getScrollTop;
    #setScrollTop;

    constructor({ productsAndCategoriesContainer, getScrollTop, setScrollTop, categoryText, lastUpdated, prevBtn, countrySelectElement, country, storeSelectElement, store, category, searchUI, overlay, infoDialog }) {
        this.#productsAndCategoriesContainer = productsAndCategoriesContainer;
        this.#getScrollTop = getScrollTop;
        this.#setScrollTop = setScrollTop;
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
                this
                    .#configureNodes(
                        products,
                        Graphs.getNodes(categoriesGraph))
                    .then(() => this.#configureUI(categoriesGraph, products));;
            }
        );
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

    static #reloadPageForCountryAndStore(country, store) {
        UrlUtils.loadPage(ProductsViewActivity.#getURLForCountryAndStore(country, store));
    }

    static #getURLForCountryAndStore(country, store) {
        const parser = new URL(window.location);
        parser.searchParams.set('country', country);
        parser.searchParams.set('store', store);
        return parser.href;
    }

    #configureNodes(productsHavingImage, nodes, continuation) {
        ProductsOfNodesSetter.setProductsOfNodes(productsHavingImage, nodes);
        return DisplayNamesOfNodesSetter.setDisplayNamesOfNodesFromFile(
            nodes,
            `./data/${this.#country}/${this.#store}/displayNameByName.json`);
    }

    #configureUI(categoriesGraph, products) {
        const productsAndCategoriesView = new ProductsAndCategoriesView(this.#productsAndCategoriesContainer);
        const navigationController = this.#createNavigationController(categoriesGraph, productsAndCategoriesView);
        {
            productsAndCategoriesView.setOnCategoryClicked(category => navigationController.gotoChildNode(category));
            this.#prevBtn.addEventListener('click', _ => navigationController.gotoParentNode());
        }
        navigationController.gotoChildNode(this.#categoryAsNode(categoriesGraph));
        this.#initializeOverlay(products);
    }

    #createNavigationController(categoriesGraph, productsAndCategoriesView) {
        return new NavigationController(
            new Navigation(),
            new NodeView(
                productsAndCategoriesView,
                new ProductsAndCategoriesProvider(categoriesGraph),
                this.#categoryText),
            this.#prevBtn,
            this.#getScrollTop,
            this.#setScrollTop);
    }

    #initializeOverlay(products) {
        const overlay =
            new Overlay(
                {
                    ...this.#overlay,
                    onOpen: this.#createOnOpen(products),
                    onClose: () => { }
                });
        overlay.initialize();
    }

    #createOnOpen(products) {
        const searchController =
            new SearchController(
                this.#searchUI,
                new ProductSearcher(products),
                new ProductsAndCategoriesView(this.#searchUI.productsContainer));
        return () => {
            searchController.reset();
        };
    }

    #categoryAsNode(categoriesGraph) {
        return Nodes.getNodeHavingDisplayName(
            Graphs.getNodes(categoriesGraph),
            this.#category);
    }
}
