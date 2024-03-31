package de.keineInsektenImEssen.textdetector.service;

import java.util.function.Predicate;

public class MatcherFactory {

    public static Predicate<String> contains(final String str) {
        return elementText -> elementText.contains(str);
    }

    public static Predicate<String> containsIgnoreCase(final String str) {
        return elementText -> elementText.toUpperCase().contains(str.toUpperCase());
    }

    public static Predicate<String> startsWith(final String prefix) {
        return elementText -> elementText.startsWith(prefix);
    }

    public static Predicate<String> endsWith(final String suffix) {
        return elementText -> elementText.endsWith(suffix);
    }

    public static Predicate<String> equalsIgnoreCase(final String str) {
        return str::equalsIgnoreCase;
    }

    public static Predicate<String> or(final Predicate<String> matcher1, final Predicate<String> matcher2) {
        return matcher1.or(matcher2);
    }
}
