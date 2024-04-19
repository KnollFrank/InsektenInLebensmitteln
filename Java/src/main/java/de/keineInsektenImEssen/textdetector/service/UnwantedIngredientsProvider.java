package de.keineInsektenImEssen.textdetector.service;

import com.google.common.collect.ImmutableSet;
import de.keineInsektenImEssen.textdetector.model.Pattern;
import de.keineInsektenImEssen.textdetector.model.Synonym;

import java.util.List;
import java.util.Set;

import static java.util.regex.Pattern.CASE_INSENSITIVE;
import static java.util.regex.Pattern.compile;

public class UnwantedIngredientsProvider {

    // FK-TODO: zu jedem der folgenden unerwünschten Zutaten in openfoodfacts ein Beispielprodukt suchen und die JSON-Antwort auf unerwünschte Zutaten korrekt parsen (siehe https://de.openfoodfacts.org/cgi/search.pl?action=display&tagtype_0=ingredients&tag_contains_0=contains&tag_0=KARMIN&sort_by=unique_scans_n&page_size=20)
    public static final Set<Synonym> unwantedIngredients =
            ImmutableSet.of(
                    new Synonym(
                            "E120",
                            List.of(
                                    new Pattern("E120", compile("E\\s*120")),
                                    new Pattern("Schildlaus", compile("Schildlaus", CASE_INSENSITIVE)),
                                    new Pattern("Karmin", compile("Karmin", CASE_INSENSITIVE)))),
                    new Synonym(
                            "E904",
                            List.of(
                                    new Pattern("E904", compile("E\\s*904")),
                                    new Pattern("Schellack", compile("Schellack", CASE_INSENSITIVE)))),
                    new Synonym(
                            "Tenebrio molitor",
                            List.of(
                                    new Pattern("Tenebrio molitor", compile("Tenebrio\\s+molitor", CASE_INSENSITIVE)),
                                    new Pattern("Mehlkäfer", compile("Mehlkäfer", CASE_INSENSITIVE)),
                                    new Pattern("Mehlwurm", compile("Mehlwurm|Mehlwürmer", CASE_INSENSITIVE)))),
                    new Synonym(
                            "Locusta migratoria",
                            List.of(
                                    new Pattern("Locusta migratoria", compile("Locusta\\s+migratoria", CASE_INSENSITIVE)),
                                    new Pattern("Wanderheuschrecke", compile("Wanderheuschrecke", CASE_INSENSITIVE)))),
                    new Synonym(
                            "Acheta domesticus",
                            List.of(
                                    new Pattern("Acheta domesticus", compile("Acheta\\s+domesticus", CASE_INSENSITIVE)),
                                    new Pattern("Hausgrille", compile("Hausgrille", CASE_INSENSITIVE)))),
                    new Synonym(
                            "Alphitobius diaperinus",
                            List.of(
                                    new Pattern("Alphitobius diaperinus", compile("Alphitobius\\s+diaperinus", CASE_INSENSITIVE)),
                                    new Pattern("Buffalowurm", compile("Buffalowurm|Buffalowürmer", CASE_INSENSITIVE)),
                                    new Pattern("Getreideschimmelkäfer", compile("Getreideschimmelkäfer", CASE_INSENSITIVE)))));
}
