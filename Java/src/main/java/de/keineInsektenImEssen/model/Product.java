package de.keineInsektenImEssen.model;

import com.google.gson.annotations.SerializedName;

import java.util.*;

public class Product implements IProduct {

    // @SerializedName is needed to prevent proguard from destroying this app
    @SerializedName("barcode")
    public final String barcode;

    @SerializedName("unwantedIngredients")
    public final Set<String> unwantedIngredients;

    @SerializedName("categories_tags")
    private final Set<String> categories_tags;

    @SerializedName("product_name")
    public final String product_name;

    @SerializedName("brands")
    public final Set<String> brands;

    @SerializedName("countries_en")
    public final Set<String> countries;

    public Product(
            final String barcode,
            final Set<String> unwantedIngredients,
            final Set<String> categories_tags,
            final String product_name,
            final Set<String> brands,
            final Set<String> countries) {
        this.barcode = barcode;
        this.unwantedIngredients = Collections.unmodifiableSet(unwantedIngredients);
        this.categories_tags = new HashSet<>(categories_tags);
        this.product_name = product_name;
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
        return this.categories_tags;
    }

    @Override
    public Set<String> getCountries() {
        return this.countries;
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

    @Override
    public String toString() {
        return new StringJoiner(", ", Product.class.getSimpleName() + "[", "]")
                .add("barcode='" + barcode + "'")
                .add("unwantedIngredients=" + unwantedIngredients)
                .add("categories_tags=" + categories_tags)
                .add("product_name='" + product_name + "'")
                .add("brands=" + brands)
                .add("countries=" + countries)
                .toString();
    }
}
