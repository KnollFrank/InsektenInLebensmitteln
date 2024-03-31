package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.ImmutableList;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static de.keineInsektenImEssen.common.FileUtils.persistAsJson;
import static de.keineInsektenImEssen.common.TestUtils.sort;

class Products4CountryPersister {

    private final int maxNumberOfProductsInSmallCategory;
    private final String ALL_COUNTRIES;
    private final String ALL_STORES;
    private final Path webAppDataDirectory;
    private final Path tmpDir;

    public Products4CountryPersister(
            final int maxNumberOfProductsInSmallCategory,
            final String ALL_COUNTRIES,
            final String ALL_STORES,
            final Path webAppDataDirectory,
            final Path tmpDir) {
        this.maxNumberOfProductsInSmallCategory = maxNumberOfProductsInSmallCategory;
        this.ALL_COUNTRIES = ALL_COUNTRIES;
        this.ALL_STORES = ALL_STORES;
        this.webAppDataDirectory = webAppDataDirectory;
        this.tmpDir = tmpDir;
    }

    public boolean persistProducts4Country(
            final List<Product> products,
            final Map<String, Category> categoryByName,
            final String country) throws IOException {
        final List<Product> products4Country = getProducts4Country(products, country);
        final ImmutableList.Builder<String> persistedStoresBuilder = ImmutableList.builder();
        for (final String store : getStores(products4Country)) {
            System.out.printf("persistProducts for %s/%s\n", country, store);
            final boolean persistedCountry4Store =
                    ProductsPersister.persistProducts(
                            getProducts4Store(products4Country, store),
                            categoryByName,
                            this.maxNumberOfProductsInSmallCategory,
                            this.webAppDataDirectory.resolve(country).resolve(store).toFile(),
                            this.tmpDir);
            if (persistedCountry4Store) {
                persistedStoresBuilder.add(store);
            }
        }
        final List<String> persistedStores = persistedStoresBuilder.build();
        final boolean persistedCountry4AnyStore = !persistedStores.isEmpty();
        if (persistedCountry4AnyStore) {
            persistAsJson(
                    persistedStores,
                    this.webAppDataDirectory.resolve(country).resolve("stores.json").toFile());
        }
        return persistedCountry4AnyStore;
    }

    private List<Product> getProducts4Country(final List<Product> products, final String country) {
        return ALL_COUNTRIES.equals(country) ?
                products :
                products
                        .stream()
                        .filter(product -> product.getCountries().contains(country))
                        .collect(Collectors.toList());
    }

    private List<Product> getProducts4Store(final List<Product> products, final String store) {
        return ALL_STORES.equals(store) ?
                products :
                products
                        .stream()
                        .filter(product -> product.stores.contains(store))
                        .collect(Collectors.toList());
    }

    private List<String> getStores(final List<Product> products) {
        return ImmutableList
                .<String>builder()
                .add(ALL_STORES)
                .addAll(sort(StoresProvider.getStores(products)))
                .build();
    }
}
