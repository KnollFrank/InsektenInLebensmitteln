class ProductsView {

    #container;
    #showBarcodeInHeading;

    constructor(container, showBarcodeInHeading) {
        this.#container = container;
        this.#showBarcodeInHeading = showBarcodeInHeading;
    }

    displayProducts(products) {
        this
            .#sortProductsByName(products)
            .forEach(product => this.#displayProduct(product));
    }

    #sortProductsByName(products) {
        return products.toSorted(
            (product1, product2) =>
                Utils.compareStrsIgnoreCase(
                    product1.product_name,
                    product2.product_name));
    }

    #displayProduct(product) {
        this.#container.appendChild(
            ProductCardViewFactory.createProductCardView(
                {
                    product_name_html: this.#getHeading(product),
                    image_url: product.image_url,
                    unwantedIngredients: Utils.jsonArray2Str(product.unwantedIngredients),
                    brands: Utils.jsonArray2Str(product.brands),
                    stores: Utils.jsonArray2Str([...product.stores].sort()),
                    countries: Utils.jsonArray2Str([...product.countries]),
                    barcode: product.barcode
                }));
    }

    #getHeading(product) {
        let heading = this.#getProductLink(product).outerHTML;
        if (this.#showBarcodeInHeading) {
            heading = `${heading} (${product.barcode})`;
        }
        return heading;
    }

    #getProductLink(product) {
        return UIUtils.createLink(
            {
                href: 'https://world.openfoodfacts.org/product/' + product.barcode,
                text: product.product_name !== "" ? product.product_name : "(product name unknown)"
            });
    }
}