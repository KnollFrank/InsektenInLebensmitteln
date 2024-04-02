package de.keineInsektenImEssen.textdetector.service;

import java.util.function.Predicate;

public class MatcherFactory {

    public static Predicate<String> contains(final String needle) {
        return haystack -> haystack.contains(needle);
    }

    public static Predicate<String> containsIgnoreCase(final String needle) {
        return haystack -> haystack.toUpperCase().contains(needle.toUpperCase());
    }

    public static Predicate<String> startsWith(final String prefix) {
        return haystack -> haystack.startsWith(prefix);
    }

    public static Predicate<String> endsWith(final String suffix) {
        return haystack -> haystack.endsWith(suffix);
    }

    public static Predicate<String> equalsIgnoreCase(final String str) {
        return str::equalsIgnoreCase;
    }

    public static Predicate<String> or(final Predicate<String> matcher1, final Predicate<String> matcher2) {
        return matcher1.or(matcher2);
    }
}
