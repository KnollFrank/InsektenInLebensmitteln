class UnwantedIngredientsPatternsFactory {

    static createUnwantedIngredientsPatterns() {
        return new Patterns(UnwantedIngredientsPatternsFactory.getUnwantedIngredientsPatterns());
    }

    static getUnwantedIngredientsPatterns() {
        return [
            // FK-TODO: die folgenden vier Words in einer Term-Klasse zusammenfassen
            new Pattern('E120', /E120|E\s+120/g),
            new Pattern('Schildlaus', /Schildlaus/gi),
            new Pattern('Karmin', /Karmin/gi),

            new Pattern('E904', /E904|E\s+904/g),
            new Pattern('Schellack', /Schellack/gi),

            new Pattern('Tenebrio molitor', /Tenebrio\s+molitor/gi),
            new Pattern('Mehlkäfer', /Mehlkäfer/gi),
            new Pattern('Mehlwurm', /Mehlwurm|Mehlwürmer/gi),

            new Pattern('Locusta migratoria', /Locusta\s+migratoria/gi),
            new Pattern('Wanderheuschrecke', /Wanderheuschrecke/gi),

            new Pattern('Acheta domesticus', /Acheta\s+domesticus/gi),
            new Pattern('Hausgrille', /Hausgrille/g),

            new Pattern('Alphitobius diaperinus', /Alphitobius\s+diaperinus/gi),
            new Pattern('Buffalowurm', /Buffalowurm|Buffalowürmer/gi),
            new Pattern('Getreideschimmelkäfer', /Getreideschimmelkäfer/gi)
        ];
    }
}