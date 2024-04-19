package de.keineInsektenImEssen.dataPreparation;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Stream;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

public class ProductsFactoryTest {

    @ParameterizedTest
    @MethodSource("haystackAndUnwantedIngredientsProvider")
    public void shouldGetUnwantedIngredients(final String haystack, final Set<String> unwantedIngredients) {
        assertThat(
                ProductsFactory.getUnwantedIngredients(haystack),
                is(unwantedIngredients));
    }

    private static Stream<Arguments> haystackAndUnwantedIngredientsProvider() {
        return Stream.of(
                arguments("Farbstoff [E 120]", Collections.singleton("E120")),
                arguments("Carbohydrate 120", Collections.emptySet()));
    }
}
