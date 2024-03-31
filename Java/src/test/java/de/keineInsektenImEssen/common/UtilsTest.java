package de.keineInsektenImEssen.common;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class UtilsTest {

    @Test
    public void shouldGetSublists() {
        // Given
        final List<String> lst = Arrays.asList("a", "b", "c", "d");

        // When
        final List<List<String>> sublists = Utils.getSublists(lst, 2);

        // Then
        assertThat(
                sublists,
                is(
                        Arrays.asList(
                                Arrays.asList("a", "b"),
                                Arrays.asList("b", "c"),
                                Arrays.asList("c", "d"))));
    }

    @Test
    public void shouldNotGetSublists() {
        Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> Utils.getSublists(Arrays.asList("a", "b", "c", "d"), -1));
    }

    @Test
    public void shouldGetSublists_sizeOfEachSublistTooLarge() {
        // Given
        final List<String> lst = Arrays.asList("a", "b", "c", "d");

        // When
        final List<List<String>> sublists = Utils.getSublists(lst, lst.size() + 1);

        // Then
        assertThat(sublists, is(Collections.emptyList()));
    }
}