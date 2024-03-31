package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.model.Product;

import java.util.Collections;
import java.util.Set;

public class ProductTestFactory {

    private static int barcode = 0;

    public static de.keineInsektenImEssen.model.Product createSomeProductHavingCategory(final String category) {
        return createSomeProductHavingCategories(Collections.singleton(category));
    }

    public static de.keineInsektenImEssen.model.Product createSomeProductHavingCategories(final Set<String> categories) {
        return new Product(
                "" + barcode++,
                Collections.singleton("Karmin"),
                categories,
                "Budapester Salat",
                Collections.singleton("Nestle"),
                Collections.singleton("Germany"));
    }

    public static de.keineInsektenImEssen.dataPreparation.Product createSomeProduct(final Set<String> countries) {
        return new de.keineInsektenImEssen.dataPreparation.Product(
                "" + barcode++,
                Collections.singleton("Karmin"),
                "some image url",
                Collections.singleton("some category"),
                "Budapester Salat",
                Collections.singleton("Aldi"),
                Collections.singleton("Nestle"),
                countries);
    }
}
