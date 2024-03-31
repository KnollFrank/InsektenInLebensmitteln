package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.common.Utils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

class StoresProvider {

    public static Set<String> getStores(final List<Product> products) {
        final Set<Set<String>> storesSets =
                products
                        .stream()
                        .map(product -> product.stores)
                        .collect(Collectors.toSet());
        return Utils.union(storesSets);
    }
}
