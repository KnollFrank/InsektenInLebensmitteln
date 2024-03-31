class ProductTestFactory {

    static barcode = 0;

    static createSomeProduct(category) {
        return {
            "barcode": "" + ProductTestFactory.barcode++,
            "unwantedIngredients": ["Schellack"],
            "categories_tags": new Set([category]),
            "product_name": "Pralines",
            "image_url": "https://images.openfoodfacts.org/images/products/00106870/front_de.3.400.jpg",
            "brands": ["Sprüngli"],
            "countries": ["Germany", "France"]
        };
    }
}
