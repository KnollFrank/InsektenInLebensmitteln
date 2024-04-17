package de.keineInsektenImEssen.textdetector.model;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Synonyms {

    public static Set<String> findAllMatches(final Set<Synonym> synonyms, final String haystack) {
        return Synonyms
                .getPatterns(synonyms)
                .filter(pattern -> pattern.matcher().test(haystack))
                .map(Pattern::name)
                .collect(Collectors.toSet());
    }

    private static Stream<Pattern> getPatterns(final Set<Synonym> synonyms) {
        return synonyms
                .stream()
                .flatMap(synonym -> synonym.patterns().stream());
    }
}
