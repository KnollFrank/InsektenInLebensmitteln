package de.keineInsektenImEssen.textdetector.service;

import de.keineInsektenImEssen.textdetector.model.Synonym;
import de.keineInsektenImEssen.textdetector.model.Synonyms;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Set;
import java.util.stream.Stream;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;

class UnwantedIngredientsProviderTest {

    @ParameterizedTest
    @MethodSource("haystackAndMatchesExpectedProvider")
    public void shouldFindAllMatches(final String haystack, final Set<String> matchesExpected) {
        // Given
        final Set<Synonym> unwantedIngredients = UnwantedIngredientsProvider.unwantedIngredients;

        // When
        final Set<String> matches = Synonyms.findAllMatches(unwantedIngredients, haystack);

        // Then
        assertThat(matches, is(matchesExpected));
    }

    private static Stream<Arguments> haystackAndMatchesExpectedProvider() {
        return Stream.of(
                arguments(
                        """
                                E120, Schildlaus, Karmin, E904, Schellack, Tenebrio molitor,
                                Mehlkäfer, Mehlwurm, Locusta migratoria, Wanderheuschrecke, Acheta domesticus,
                                Hausgrille, Alphitobius    diaperinus, Buffalowurm, Getreideschimmelkäfer""",
                        Set.of("E120", "Schildlaus", "Karmin", "E904", "Schellack", "Tenebrio molitor",
                                "Mehlkäfer", "Mehlwurm", "Locusta migratoria", "Wanderheuschrecke", "Acheta domesticus",
                                "Hausgrille", "Alphitobius diaperinus", "Buffalowurm", "Getreideschimmelkäfer")),
                arguments("E 120, E  904", Set.of("E120", "E904")),
                arguments("..., Buffalowürmer, ...", Set.of("Buffalowurm")));
    }
}