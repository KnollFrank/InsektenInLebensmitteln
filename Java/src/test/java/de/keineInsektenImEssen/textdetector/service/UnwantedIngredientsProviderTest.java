package de.keineInsektenImEssen.textdetector.service;

import de.keineInsektenImEssen.textdetector.model.Synonym;
import de.keineInsektenImEssen.textdetector.model.Synonyms;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

class UnwantedIngredientsProviderTest {

    @Test
    public void shouldFindAllMatches() {
        // Given
        final Set<Synonym> unwantedIngredients = UnwantedIngredientsProvider.unwantedIngredients;

        // When
        final Set<String> matches =
                Synonyms.findAllMatches(
                        unwantedIngredients,
                        """
                                E120, Schildlaus, Karmin, E904, Schellack, Tenebrio molitor,
                                Mehlkäfer, Mehlwurm, Locusta migratoria, Wanderheuschrecke, Acheta domesticus,
                                Hausgrille, Alphitobius diaperinus, Buffalowurm, Getreideschimmelkäfer""");

        // Then
        final Set<String> matchesExpected =
                Set.of("E120", "Schildlaus", "Karmin", "E904", "Schellack", "Tenebrio molitor",
                        "Mehlkäfer", "Mehlwurm", "Locusta migratoria", "Wanderheuschrecke", "Acheta domesticus",
                        "Hausgrille", "Alphitobius diaperinus", "Buffalowurm", "Getreideschimmelkäfer");
        assertThat(matches, is(matchesExpected));
    }
}