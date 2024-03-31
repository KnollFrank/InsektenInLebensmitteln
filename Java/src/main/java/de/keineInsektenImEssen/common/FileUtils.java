package de.keineInsektenImEssen.common;

import com.google.gson.Gson;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.stream.Collectors;

public class FileUtils {

    public static String readAsString(final InputStream inputStream) {
        try (final BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream))) {
            return bufferedReader
                    .lines()
                    .collect(Collectors.joining("\n"));
        } catch (final IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static <T> void persistAsJson(final T obj, final File fileName) throws IOException {
        try (final FileWriter writer = new FileWriter(fileName)) {
            new Gson().toJson(obj, writer);
        }
    }

    public static String getFileName(final URL url) {
        return Paths.get(url.getPath()).getFileName().toString();
    }

    public static Instant getCreationTime(final Path file) throws IOException {
        return Files
                .readAttributes(file, BasicFileAttributes.class)
                .creationTime()
                .toInstant();
    }
}
