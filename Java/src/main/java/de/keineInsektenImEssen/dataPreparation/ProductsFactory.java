package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.Streams;
import de.keineInsektenImEssen.textdetector.model.Pattern;
import de.keineInsektenImEssen.textdetector.service.UnwantedIngredientsPatternsFactory;
import org.apache.commons.csv.CSVRecord;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static de.keineInsektenImEssen.common.Utils.commaSeparatedStrings2Set;

class ProductsFactory {

    public static List<Product> getProducts(final Iterable<CSVRecord> records) {
        return Streams
                .stream(records)
                .map(
                        record ->
                                new Product(
                                        record.get("code"),
                                        getUnwantedIngredients(record.get("ingredients_text")),
                                        record.get("image_url"),
                                        commaSeparatedStrings2Set(record.get("categories_tags")),
                                        record.get("product_name"),
                                        normalizeStores(commaSeparatedStrings2Set(record.get("stores"))),
                                        commaSeparatedStrings2Set(record.get("brands")),
                                        commaSeparatedStrings2Set(record.get("countries_en"))))
                .collect(Collectors.toList());
    }

    private static Set<String> normalizeStores(final Set<String> stores) {
        return stores
                .stream()
                .map(ProductsFactory::normalizeStore)
                .collect(Collectors.toSet());
    }

    private static String normalizeStore(final String store) {
        return store.trim().toUpperCase();
    }

    public static Set<String> getUnwantedIngredients(final String haystack) {
        return UnwantedIngredientsPatternsFactory
                .unwantedIngredientsPatterns
                .stream()
                .filter(unwantedIngredient -> unwantedIngredient.getMatcher().test(haystack))
                .map(Pattern::getName)
                .collect(Collectors.toSet());
    }
}
