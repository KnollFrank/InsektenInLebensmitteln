package de.keineInsektenImEssen.dataPreparation;

import com.google.common.collect.ImmutableSet;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Set;

import static de.keineInsektenImEssen.dataPreparation.ProductTestFactory.createSomeProduct;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

public class CountriesProviderTest {

    @Test
    public void shouldProvideCountries() {
        // Given
        final Product product1 = createSomeProduct(ImmutableSet.of("France", "Switzerland"));
        final Product product2 = createSomeProduct(ImmutableSet.of("France", "Austria"));

        // When
        final Set<String> countries = CountriesProvider.getCountries(Arrays.asList(product1, product2));

        // Then
        assertThat(countries, is(ImmutableSet.of("France", "Switzerland", "Austria")));
    }
}
