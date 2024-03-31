package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.common.Utils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

class CountriesProvider {

    public static Set<String> getCountries(final List<Product> products) {
        final Set<Set<String>> countriesSets =
                products
                        .stream()
                        .map(Product::getCountries)
                        .collect(Collectors.toSet());
        return Utils.union(countriesSets);
    }
}
