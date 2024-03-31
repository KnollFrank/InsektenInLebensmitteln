package de.keineInsektenImEssen.dataPreparation;

import java.io.IOException;
import java.util.Optional;

public class DataPreparation {

    /*
        Execute manually in a terminal in order to download Open Food Facts Database:
        cd /home/frankknoll/Dokumente/Insekten/projects/Keine-Insekten-im-Essen/web/InsektenInLebensmitteln/Java/tmp
        wget --retry-connrefused --read-timeout=20 --timeout=15 --tries=0 --continue https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
        gunzip en.openfoodfacts.org.products.csv.gz
    */
    public static void main(final String[] args) throws IOException {
        final Optional<Paths> pathsOption = PathsParser.parsePaths(args);
        if (pathsOption.isEmpty()) {
            throw new IllegalArgumentException();
        }
        synchronizeWithOpenFoodFacts(pathsOption.get());
    }

    private static void synchronizeWithOpenFoodFacts(final Paths paths) throws IOException {
        final OpenFoodFactsSynchronizer openFoodFactsSynchronizer =
                new OpenFoodFactsSynchronizer(
                        25,
                        paths.openFoodFactsDatabase,
                        paths.webAppDataDirectory,
                        paths.tmpDir);
        openFoodFactsSynchronizer.synchronizeWithOpenFoodFacts();
    }
}
