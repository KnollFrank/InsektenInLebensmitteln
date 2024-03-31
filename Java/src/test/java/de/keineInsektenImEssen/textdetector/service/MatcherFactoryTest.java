package de.keineInsektenImEssen.textdetector.service;

import org.junit.jupiter.api.Test;

import java.util.function.Predicate;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class MatcherFactoryTest {

    @Test
    public void test_or() {
        // Given
        final Predicate<String> orMatcher =
                MatcherFactory.or(
                        MatcherFactory.containsIgnoreCase("Zucker"),
                        MatcherFactory.containsIgnoreCase("salt"));

        // When & Then
        assertThat(orMatcher.test("Zucker"), is(true));
        assertThat(orMatcher.test("salt"), is(true));
    }
}