QUnit.module('UnwantedIngredientsProviderTest', function () {

    QUnit.test('shouldfindAllMatches', function (assert) {
        // Given
        const unwantedIngredientsSynonyms = UnwantedIngredientsProvider.getSynonyms();

        // When
        const matches =
            Synonyms.findAllMatches(
                unwantedIngredientsSynonyms,
                `E120, Schildlaus, Karmin, E904, Schellack, Tenebrio molitor,
                 Mehlkäfer, Mehlwurm, Locusta migratoria, Wanderheuschrecke, Acheta domesticus,
                 Hausgrille, Alphitobius diaperinus, Buffalowurm, Getreideschimmelkäfer`);

        // Then
        assert.deepEqual(
            matches.map(match => match.pattern),
            [
                'E120',
                'Schildlaus',
                'Karmin',
                'E904',
                'Schellack',
                'Tenebrio molitor',
                'Mehlkäfer',
                'Mehlwurm',
                'Locusta migratoria',
                'Wanderheuschrecke',
                'Acheta domesticus',
                'Hausgrille',
                'Alphitobius diaperinus',
                'Buffalowurm',
                'Getreideschimmelkäfer'
            ]);
    });
});