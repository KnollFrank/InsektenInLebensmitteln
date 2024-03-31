package de.keineInsektenImEssen.dataPreparation;

import org.apache.commons.cli.*;

import java.util.Optional;

class PathsParser {

    public static Optional<Paths> parsePaths(final String[] args) {
        final Option openFoodFactsDatabase = getOpenFoodFactsDatabase();
        final Option webAppDataDirectory = getWebAppDataDirectory();
        final Option tmpDir = getTmpDir();
        return PathsParser
                .parse(
                        args,
                        new Options()
                                .addOption(openFoodFactsDatabase)
                                .addOption(webAppDataDirectory)
                                .addOption(tmpDir))
                .map(commandLine ->
                        new Paths(
                                java.nio.file.Paths.get(commandLine.getOptionValue(openFoodFactsDatabase)),
                                java.nio.file.Paths.get(commandLine.getOptionValue(webAppDataDirectory)),
                                java.nio.file.Paths.get(commandLine.getOptionValue(tmpDir))));
    }

    private static Option getOpenFoodFactsDatabase() {
        return Option
                .builder("openFoodFactsDatabase")
                .argName("file")
                .hasArg()
                .desc("use given csv file as a database")
                .required()
                .build();
    }

    private static Option getWebAppDataDirectory() {
        return Option
                .builder("webAppDataDirectory")
                .argName("directory")
                .hasArg()
                .required()
                .build();
    }

    private static Option getTmpDir() {
        return Option
                .builder("tmpDir")
                .argName("directory")
                .hasArg()
                .required()
                .build();
    }

    private static Optional<CommandLine> parse(final String[] args, final Options options) {
        try {
            return Optional.of(new DefaultParser().parse(options, args));
        } catch (final ParseException e) {
            new HelpFormatter().printHelp(
                    "dataPreparation",
                    options,
                    true);
            return Optional.empty();
        }
    }
}
