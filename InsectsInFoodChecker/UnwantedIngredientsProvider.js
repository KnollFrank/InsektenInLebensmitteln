class UnwantedIngredientsProvider {

    static synonyms =
        [
            new Synonym(
                'E120',
                [
                    new Pattern('E120', /E\s*120/g),
                    new Pattern('Schildlaus', /Schildlaus/gi),
                    new Pattern('Karmin', /Karmin/gi)
                ],
                new URL("https://en.wikipedia.org/wiki/Carmine")),
            new Synonym(
                'E904',
                [
                    new Pattern('E904', /E\s*904/g),
                    new Pattern('Schellack', /Schellack/gi)
                ],
                new URL("https://en.wikipedia.org/wiki/Shellac")),
            new Synonym(
                'Tenebrio molitor',
                [
                    new Pattern('Tenebrio molitor', /Tenebrio\s+molitor/gi),
                    new Pattern('Mehlkäfer', /Mehlkäfer/gi),
                    new Pattern('Mehlwurm', /Mehlwurm|Mehlwürmer/gi)
                ],
                new URL("https://en.wikipedia.org/wiki/Mealworm")),
            new Synonym(
                'Locusta migratoria',
                [
                    new Pattern('Locusta migratoria', /Locusta\s+migratoria/gi),
                    new Pattern('Wanderheuschrecke', /Wanderheuschrecke/gi)
                ],
                new URL("https://en.wikipedia.org/wiki/Migratory_locust")),
            new Synonym(
                'Acheta domesticus',
                [
                    new Pattern('Acheta domesticus', /Acheta\s+domesticus/gi),
                    new Pattern('Hausgrille', /Hausgrille/g)
                ],
                new URL("https://en.wikipedia.org/wiki/House_cricket")),
            new Synonym(
                'Alphitobius diaperinus',
                [
                    new Pattern('Alphitobius diaperinus', /Alphitobius\s+diaperinus/gi),
                    new Pattern('Buffalowurm', /Buffalowurm|Buffalowürmer/gi),
                    new Pattern('Getreideschimmelkäfer', /Getreideschimmelkäfer/gi)
                ],
                new URL("https://en.wikipedia.org/wiki/Alphitobius_diaperinus"))
        ];
}