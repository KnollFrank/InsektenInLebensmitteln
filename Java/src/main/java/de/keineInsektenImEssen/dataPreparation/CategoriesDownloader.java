package de.keineInsektenImEssen.dataPreparation;

import de.keineInsektenImEssen.common.FileUtils;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Path;
import java.util.Map;

import static org.apache.commons.io.FileUtils.copyURLToFile;

class CategoriesDownloader {

    public static Map<String, Category> downloadCategoryByName(final Path tmpDir) throws IOException {
        final File categoriesJsonFile = downloadCategoriesJsonFile(tmpDir);
        return new CategoriesProvider().getCategoryByName(new FileReader(categoriesJsonFile));
    }

    private static File downloadCategoriesJsonFile(final Path tmpDir) throws IOException {
        // or https://static.openfoodfacts.org/data/taxonomies/categories.full.json ?
        final URL url = new URL("https://static.openfoodfacts.org/data/taxonomies/categories.json");
        final File categoriesJsonFile = tmpDir.resolve(FileUtils.getFileName(url)).toFile();
        copyURLToFile(url, categoriesJsonFile);
        return categoriesJsonFile;
    }
}
