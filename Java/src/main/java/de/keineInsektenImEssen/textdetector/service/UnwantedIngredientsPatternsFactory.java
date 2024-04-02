package de.keineInsektenImEssen.textdetector.service;

import com.google.common.collect.ImmutableSet;
import de.keineInsektenImEssen.textdetector.model.Pattern;

import static de.keineInsektenImEssen.textdetector.service.MatcherFactory.contains;
import static de.keineInsektenImEssen.textdetector.service.MatcherFactory.containsIgnoreCase;

public class UnwantedIngredientsPatternsFactory {

    // FK-TODO: zu jedem der folgenden unerwünschten Zutaten in openfoodfacts ein Beispielprodukt suchen und die JSON-Antwort auf unerwünschte Zutaten korrekt parsen (siehe https://de.openfoodfacts.org/cgi/search.pl?action=display&tagtype_0=ingredients&tag_contains_0=contains&tag_0=KARMIN&sort_by=unique_scans_n&page_size=20)

    // FK-TODO: die unwantedIngredients in der App in einem Dialog als Liste anzeigen, damit der Benutzer weiß, welche Insektenzutaten die App überhaupt erkennt.
    public static final ImmutableSet<Pattern> unwantedIngredientsPatterns =
            ImmutableSet.of(
                    // FK-TODO: die folgenden vier Words in einer Term-Klasse zusammenfassen
                    new Pattern("E 120", contains("E 120")),
                    new Pattern("E120", contains("E120")),
                    new Pattern("Schildlaus", containsIgnoreCase("Schildlaus")),
                    new Pattern("Karmin", containsIgnoreCase("Karmin")),

                    new Pattern("E 904", contains("E 904")),
                    new Pattern("E904", contains("E904")),
                    new Pattern("Schellack", containsIgnoreCase("Schellack")),

                    new Pattern("Tenebrio molitor", containsIgnoreCase("Tenebrio molitor")),
                    new Pattern("Mehlkäfer", containsIgnoreCase("Mehlkäfer")),
                    new Pattern("Mehlwurm", containsIgnoreCase("Mehlwurm")),
                    new Pattern("Mehlwürmer", containsIgnoreCase("Mehlwürmer")),

                    new Pattern("Locusta migratoria", containsIgnoreCase("Locusta migratoria")),
                    new Pattern("Wanderheuschrecke", containsIgnoreCase("Wanderheuschrecke")),

                    new Pattern("Acheta domesticus", containsIgnoreCase("Acheta domesticus")),
                    new Pattern("Hausgrille", containsIgnoreCase("Hausgrille")),

                    new Pattern("Alphitobius diaperinus", containsIgnoreCase("Alphitobius diaperinus")),
                    new Pattern("Buffalowurm", containsIgnoreCase("Buffalowurm")),
                    new Pattern("Buffalowürmer", containsIgnoreCase("Buffalowürmer")),
                    new Pattern("Getreideschimmelkäfer", containsIgnoreCase("Getreideschimmelkäfer")));
}
