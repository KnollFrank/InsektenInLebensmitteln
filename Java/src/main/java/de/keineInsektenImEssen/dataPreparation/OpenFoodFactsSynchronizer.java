package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.ImmutableList;
import de.keineInsektenImEssen.common.ExecUtils;
import org.apache.commons.csv.CSVRecord;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static de.keineInsektenImEssen.common.FileUtils.getCreationTime;
import static de.keineInsektenImEssen.common.FileUtils.persistAsJson;
import static de.keineInsektenImEssen.common.TestUtils.sort;
import static de.keineInsektenImEssen.dataPreparation.ProductsFactory.getUnwantedIngredients;
import static org.apache.commons.io.FileUtils.deleteDirectory;

class OpenFoodFactsSynchronizer {

    private static final String ALL_COUNTRIES = "All Countries";
    private static final String ALL_STORES = "All Stores";

    private final Path openFoodFactsDatabase;
    private final Products4CountryPersister products4CountryPersister;
    private final Path webAppDataDirectory;
    private final Path tmpDir;

    public OpenFoodFactsSynchronizer(final int maxNumberOfProductsInSmallCategory,
                                     final Path openFoodFactsDatabase,
                                     final Path webAppDataDirectory,
                                     final Path tmpDir) {
        this.openFoodFactsDatabase = openFoodFactsDatabase;
        this.products4CountryPersister =
                new Products4CountryPersister(
                        maxNumberOfProductsInSmallCategory,
                        ALL_COUNTRIES,
                        ALL_STORES,
                        webAppDataDirectory,
                        tmpDir);
        this.webAppDataDirectory = webAppDataDirectory;
        this.tmpDir = tmpDir;
    }

    public void synchronizeWithOpenFoodFacts() throws IOException {
        final File productsInternationalCsvFile = createProductsInternationalCsvFile();
        final List<Product> products = getProducts(productsInternationalCsvFile);
        // ProductImagesDownloader.downloadProductImages(products, getAssetsFile("productImages"));
        deleteDirectory(this.webAppDataDirectory.toFile());
        final List<String> persistedCountries =
                persistProducts4Countries(
                        products,
                        CategoriesDownloader.downloadCategoryByName(this.tmpDir),
                        getCountries(products));
        persistAsJson(
                persistedCountries,
                this.webAppDataDirectory.resolve("countries.json").toFile());
        persistLastUpdated();
    }

    private static List<String> getCountries(final List<Product> products) {
        return ImmutableList
                .<String>builder()
                .add(ALL_COUNTRIES)
                .addAll(sort(CountriesProvider.getCountries(products)))
                .build();
    }

    private List<String> persistProducts4Countries(
            final List<Product> products,
            final Map<String, Category> categoryByName,
            final List<String> countries) throws IOException {
        final ImmutableList.Builder<String> persistedCountriesBuilder = ImmutableList.builder();
        for (final String country : countries) {
            System.out.printf("persistProducts4Country for %s\n", country);
            final boolean persistedCountry = this.products4CountryPersister.persistProducts4Country(products, categoryByName, country);
            if (persistedCountry) {
                persistedCountriesBuilder.add(country);
            }
        }
        return persistedCountriesBuilder.build();
    }

    private File createProductsInternationalCsvFile() throws IOException {
        final File productsInternationalCsvFile = this.tmpDir.resolve("products.international.csv").toFile();
        ExecUtils.executeCommandLine(getCmdLine2Create(productsInternationalCsvFile));
        return productsInternationalCsvFile;
    }

    private String getCmdLine2Create(final File productsInternationalCsvFile) {
        final String createProductsCsvFile =
                String.format(
                        "csvcut -t --quoting=3 -c code,product_name,categories_tags,countries_en,ingredients_text,image_url,brands,stores %s > products.csv",
                        this.openFoodFactsDatabase.getFileName().toString());
        final String createProductsInternationalCsvFile =
                "cat products.csv | " +
//                        "csvgrep -c countries_en -r \"Germany|Austria|Switzerland|Liechtenstein\" | " +
                        "csvgrep -c ingredients_text -r \".+\" " +
                        "> " + productsInternationalCsvFile.toString();
        return String.format(
                "cd %s && %s && %s",
                this.openFoodFactsDatabase.getParent().toString(),
                createProductsCsvFile,
                createProductsInternationalCsvFile);
    }

    private List<Product> getProducts(final File productsInternationalCsvFile) throws IOException {
        // FK-TODO: Dropdownmenu anbieten, um Produkte nach Herstellern zu filtern.
        final String[] headers = {"code", "product_name", "categories_tags", "countries_en", "ingredients_text", "image_url", "brands", "stores"};
        final CSVHelper csvHelper = new CSVHelper(headers);
        final Iterable<CSVRecord> records = csvHelper.readCsvRecords(productsInternationalCsvFile);
        final Iterable<CSVRecord> recordsHavingUnwantedIngredients =
                csvHelper.filter(
                        records,
                        record -> !getUnwantedIngredients(record.get("ingredients_text")).isEmpty());
        csvHelper.persistCsvRecords(
                recordsHavingUnwantedIngredients,
                this.tmpDir.resolve("products.international.unwantedIngredients.csv").toFile());
        return ProductsFactory.getProducts(recordsHavingUnwantedIngredients);
    }

    private void persistLastUpdated() throws IOException {
        final Instant lastUpdated = getCreationTime(this.openFoodFactsDatabase);
        persistAsJson(
                lastUpdated.toEpochMilli(),
                this.webAppDataDirectory.resolve("lastUpdatedEpochMilli.json").toFile());
    }
}
