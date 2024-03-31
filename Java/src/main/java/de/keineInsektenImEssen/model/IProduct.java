package de.keineInsektenImEssen.model;

import java.util.Set;

public interface IProduct {

    String getBarcode();

    Set<String> getUnwantedIngredients();

    String getProductName();

    Set<String> getBrands();

    Set<String> getCategoriesTags();

    Set<String> getCountries();
}
