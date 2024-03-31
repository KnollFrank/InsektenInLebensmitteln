package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.model.IProduct;

import java.util.Objects;
import java.util.Set;

class Product implements IProduct {

    private final String barcode;
    private final Set<String> unwantedIngredients;
    private final Set<String> categories_tags;
    private final String product_name;
    public final String image_url;
    public final Set<String> stores;
    private final Set<String> brands;
    private final Set<String> countries;

    public Product(
            final String barcode,
            final Set<String> unwantedIngredients,
            final String image_url,
            final Set<String> categories_tags,
            final String product_name,
            final Set<String> stores,
            final Set<String> brands,
            final Set<String> countries) {
        this.barcode = barcode;
        this.unwantedIngredients = unwantedIngredients;
        this.categories_tags = categories_tags;
        this.product_name = product_name;
        this.image_url = image_url;
        this.stores = stores;
        this.brands = brands;
        this.countries = countries;
    }

    @Override
    public String getBarcode() {
        return this.barcode;
    }

    @Override
    public Set<String> getUnwantedIngredients() {
        return this.unwantedIngredients;
    }

    @Override
    public String getProductName() {
        return this.product_name;
    }

    @Override
    public Set<String> getBrands() {
        return this.brands;
    }

    @Override
    public Set<String> getCategoriesTags() {
        return categories_tags;
    }

    @Override
    public Set<String> getCountries() {
        return countries;
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final Product product = (Product) o;
        return barcode.equals(product.barcode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(barcode);
    }
}
