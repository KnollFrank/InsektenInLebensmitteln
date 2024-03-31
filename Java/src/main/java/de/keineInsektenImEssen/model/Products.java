package de.keineInsektenImEssen.model;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static de.keineInsektenImEssen.common.Utils.union;

public abstract class Products {

    public static Set<String> getCategories(final List<? extends IProduct> products) {
        final List<Set<String>> categoriesForEachProduct =
                products
                        .stream()
                        .map(IProduct::getCategoriesTags)
                        .collect(Collectors.toList());
        return union(categoriesForEachProduct);
    }
}
