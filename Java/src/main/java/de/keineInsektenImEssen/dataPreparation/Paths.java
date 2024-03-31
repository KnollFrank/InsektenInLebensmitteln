package de.keineInsektenImEssen.dataPreparation;

import java.nio.file.Path;

class Paths {

    public final Path openFoodFactsDatabase;
    public final Path webAppDataDirectory;
    public final Path tmpDir;

    public Paths(final Path openFoodFactsDatabase,
                  final Path webAppDataDirectory,
                  final Path tmpDir) {
        this.openFoodFactsDatabase = openFoodFactsDatabase;
        this.webAppDataDirectory = webAppDataDirectory;
        this.tmpDir = tmpDir;
    }

    @Override
    public String toString() {
        return "Paths{" +
                "openFoodFactsDatabase=" + openFoodFactsDatabase +
                ", webAppDataDirectory=" + webAppDataDirectory +
                ", tmpDir=" + tmpDir +
                '}';
    }
}
